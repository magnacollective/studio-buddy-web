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

    // Get current date for daily limits
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create storage key for this user/session and date
    const storageKey = `usage_${identifier}_${today}`;

    // For this demo, we'll use a simple in-memory store
    // In production, you'd want to use Redis, database, or similar persistent storage
    global.usageStore = global.usageStore || {};
    
    const currentUsage = global.usageStore[storageKey] || {
      mastering: 0,
      vocal_separation: 0,
      date: today,
      identifier: identifier
    };

    // Check daily limits (2 per type for free/anonymous users)
    const dailyLimit = 2;
    const currentCount = currentUsage[processType] || 0;

    if (currentCount >= dailyLimit) {
      return res.status(429).json({ 
        error: 'Daily limit exceeded',
        limit: dailyLimit,
        used: currentCount,
        processType: processType,
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      });
    }

    // Increment usage
    currentUsage[processType] = currentCount + 1;
    currentUsage.lastUsed = new Date().toISOString();
    
    // Store updated usage
    global.usageStore[storageKey] = currentUsage;

    // Return success with current usage stats
    res.status(200).json({
      success: true,
      usage: {
        mastering: currentUsage.mastering,
        vocal_separation: currentUsage.vocal_separation,
        remaining: {
          mastering: dailyLimit - currentUsage.mastering,
          vocal_separation: dailyLimit - currentUsage.vocal_separation
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