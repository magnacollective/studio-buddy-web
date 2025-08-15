// Server-side request validation and abuse prevention
// This should be called by your audio processing APIs

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { processType, userId, sessionId, userPlan = 'free' } = req.body;

    // Get user's IP address for tracking and validation
    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Validate required fields
    if (!processType || (!userId && !sessionId)) {
      return res.status(400).json({ 
        error: 'Missing required fields: processType and user identifier' 
      });
    }

    console.log(`🛡️ Validating request: ${userId ? `user_${userId}` : `session_${sessionId}`}, IP: ${userIP}`);

    // Validate process type
    const validTypes = ['mastering', 'vocal_separation'];
    if (!validTypes.includes(processType)) {
      return res.status(400).json({ error: 'Invalid process type' });
    }

    // Premium users bypass all limits
    if (userPlan === 'premium') {
      return res.status(200).json({
        valid: true,
        plan: 'premium',
        unlimited: true
      });
    }

    // Rate limiting for abuse prevention
    const identifier = userId || sessionId;
    const rateLimitKey = `rate_${identifier}`;
    const now = Date.now();
    
    // Initialize rate limiting store
    global.rateLimitStore = global.rateLimitStore || {};
    
    // Get rate limit data
    const rateData = global.rateLimitStore[rateLimitKey] || {
      requests: [],
      lastCleanup: now
    };

    // Clean old requests (older than 1 hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    rateData.requests = rateData.requests.filter(timestamp => timestamp > oneHourAgo);
    rateData.lastCleanup = now;

    // Check rate limits (max 10 requests per hour for free users)
    const maxRequestsPerHour = 10;
    if (rateData.requests.length >= maxRequestsPerHour) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 3600 // 1 hour
      });
    }

    // Add current request to rate limit tracking
    rateData.requests.push(now);
    global.rateLimitStore[rateLimitKey] = rateData;

    // Check daily usage limits
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage_${identifier}_${today}`;
    
    global.usageStore = global.usageStore || {};
    const usage = global.usageStore[usageKey] || {
      mastering: 0,
      vocal_separation: 0,
      date: today
    };

    const dailyLimit = 2;
    const currentCount = usage[processType] || 0;

    if (currentCount >= dailyLimit) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        limit: dailyLimit,
        used: currentCount,
        processType: processType,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }

    // Additional security checks
    const securityChecks = await performSecurityChecks(req, identifier);
    if (!securityChecks.valid) {
      return res.status(403).json({
        error: 'Security check failed',
        message: securityChecks.reason
      });
    }

    // All checks passed
    res.status(200).json({
      valid: true,
      plan: userPlan,
      usage: {
        current: currentCount,
        limit: dailyLimit,
        remaining: dailyLimit - currentCount
      },
      security: {
        requestId: generateRequestId(),
        timestamp: now
      }
    });

  } catch (error) {
    console.error('❌ Error validating request:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Perform additional security checks
async function performSecurityChecks(req, identifier) {
  const checks = {
    valid: true,
    reason: null
  };

  try {
    // Check for suspicious patterns
    const userAgent = req.headers['user-agent'];
    const referer = req.headers.referer;

    // Block known bot user agents
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i, 
      /automated/i, /python/i, /curl/i, /wget/i
    ];
    
    if (userAgent && botPatterns.some(pattern => pattern.test(userAgent))) {
      checks.valid = false;
      checks.reason = 'Automated requests not allowed';
      return checks;
    }

    // Check referer (should be from your domain or empty for direct access)
    if (referer && !referer.includes(process.env.APP_URL || 'studio-buddy')) {
      // Log suspicious referer but don't block (could be legitimate)
      console.warn('⚠️ Suspicious referer:', referer);
    }

    // Check request frequency (prevent rapid-fire requests)
    const frequencyKey = `freq_${identifier}`;
    global.frequencyStore = global.frequencyStore || {};
    
    const lastRequest = global.frequencyStore[frequencyKey] || 0;
    const timeSinceLastRequest = Date.now() - lastRequest;
    
    // Minimum 5 seconds between requests
    if (timeSinceLastRequest < 5000) {
      checks.valid = false;
      checks.reason = 'Requests too frequent. Please wait 5 seconds between operations.';
      return checks;
    }
    
    global.frequencyStore[frequencyKey] = Date.now();

    return checks;

  } catch (error) {
    console.error('Error in security checks:', error);
    // On error, allow the request but log it
    return { valid: true, reason: null };
  }
}

// Generate unique request ID for tracking
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Cleanup function for memory management
export function cleanupStores() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  // Clean rate limit store
  if (global.rateLimitStore) {
    Object.keys(global.rateLimitStore).forEach(key => {
      const data = global.rateLimitStore[key];
      if (data.lastCleanup < oneHourAgo) {
        data.requests = data.requests.filter(timestamp => timestamp > oneHourAgo);
        if (data.requests.length === 0) {
          delete global.rateLimitStore[key];
        }
      }
    });
  }

  // Clean frequency store
  if (global.frequencyStore) {
    Object.keys(global.frequencyStore).forEach(key => {
      if (global.frequencyStore[key] < oneHourAgo) {
        delete global.frequencyStore[key];
      }
    });
  }

  // Clean old usage data
  if (global.usageStore) {
    const today = new Date().toISOString().split('T')[0];
    Object.keys(global.usageStore).forEach(key => {
      const usage = global.usageStore[key];
      if (usage.date !== today) {
        delete global.usageStore[key];
      }
    });
  }
}