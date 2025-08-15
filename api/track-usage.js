// Secure usage tracking API endpoint
// Tracks daily limits for anonymous and free users

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
    const { processType, userId, sessionId } = req.body;

    // Get user's IP address for additional abuse prevention
    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Validate process type
    const validTypes = ['mastering', 'vocal_separation'];
    if (!validTypes.includes(processType)) {
      return res.status(400).json({ error: 'Invalid process type' });
    }

    // For anonymous users, use sessionId; for authenticated users, use userId
    const identifier = userId || sessionId;
    if (!identifier) {
      return res.status(400).json({ error: 'User identifier required' });
    }

    // Create compound identifier for more robust tracking
    const userIdentifier = userId ? `user_${userId}` : `session_${sessionId}`;
    const ipIdentifier = `ip_${userIP}`;
    
    console.log(`🔍 Tracking usage: ${userIdentifier}, IP: ${userIP}`);

    // Get current date for daily limits
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create storage keys for both user and IP tracking
    const userStorageKey = `usage_${userIdentifier}_${today}`;
    const ipStorageKey = `usage_${ipIdentifier}_${today}`;

    // For this demo, we'll use a simple in-memory store
    // In production, you'd want to use Redis, database, or similar persistent storage
    global.usageStore = global.usageStore || {};
    
    const currentUserUsage = global.usageStore[userStorageKey] || {
      mastering: 0,
      vocal_separation: 0,
      date: today,
      identifier: userIdentifier,
      ip: userIP
    };

    const currentIPUsage = global.usageStore[ipStorageKey] || {
      mastering: 0,
      vocal_separation: 0,
      date: today,
      identifier: ipIdentifier,
      users: new Set()
    };

    // Check daily limits (2 per type for free/anonymous users)
    const dailyLimit = 2;
    const ipDailyLimit = 10; // Higher limit per IP to allow multiple users on same network
    
    const userCount = currentUserUsage[processType] || 0;
    const ipCount = currentIPUsage[processType] || 0;

    // Check user-specific limit first
    if (userCount >= dailyLimit) {
      return res.status(429).json({ 
        error: 'Daily limit exceeded for your account',
        limit: dailyLimit,
        used: userCount,
        processType: processType,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }

    // Check IP-based limit for abuse prevention
    if (ipCount >= ipDailyLimit) {
      return res.status(429).json({ 
        error: 'Daily limit exceeded for your network',
        limit: ipDailyLimit,
        used: ipCount,
        processType: processType,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
        message: 'Multiple users on your network have reached the daily limit. Please try again tomorrow.'
      });
    }

    // Increment usage for both user and IP tracking
    currentUserUsage[processType] = userCount + 1;
    currentUserUsage.lastUsed = new Date().toISOString();
    
    currentIPUsage[processType] = ipCount + 1;
    currentIPUsage.lastUsed = new Date().toISOString();
    currentIPUsage.users.add(userIdentifier);
    
    // Store updated usage
    global.usageStore[userStorageKey] = currentUserUsage;
    global.usageStore[ipStorageKey] = currentIPUsage;

    console.log(`✅ Usage tracked: User ${userCount + 1}/${dailyLimit}, IP ${ipCount + 1}/${ipDailyLimit}`);

    // Return success with current usage stats
    res.status(200).json({
      success: true,
      usage: {
        mastering: currentUserUsage.mastering,
        vocal_separation: currentUserUsage.vocal_separation,
        remaining: {
          mastering: dailyLimit - currentUserUsage.mastering,
          vocal_separation: dailyLimit - currentUserUsage.vocal_separation
        },
        ip: {
          mastering: currentIPUsage.mastering,
          vocal_separation: currentIPUsage.vocal_separation,
          uniqueUsers: currentIPUsage.users.size
        }
      },
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
    });

  } catch (error) {
    console.error('❌ Error tracking usage:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Cleanup function to remove old usage data (call this periodically)
export function cleanupOldUsage() {
  if (!global.usageStore) return;
  
  const today = new Date().toISOString().split('T')[0];
  const keys = Object.keys(global.usageStore);
  
  keys.forEach(key => {
    const usage = global.usageStore[key];
    if (usage.date !== today) {
      delete global.usageStore[key];
    }
  });
}