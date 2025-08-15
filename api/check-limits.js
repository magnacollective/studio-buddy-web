// Check usage limits before allowing processing
// Returns whether user can process and current usage stats

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

    // Premium users have unlimited access
    if (userPlan === 'premium') {
      return res.status(200).json({
        canProcess: true,
        plan: 'premium',
        unlimited: true
      });
    }

    // For free/anonymous users, check daily limits
    const identifier = userId || sessionId;
    if (!identifier) {
      return res.status(400).json({ error: 'User identifier required' });
    }

    // Create compound identifiers for both user and IP tracking
    const userIdentifier = userId ? `user_${userId}` : `session_${sessionId}`;
    const ipIdentifier = `ip_${userIP}`;

    // Get current date for daily limits
    const today = new Date().toISOString().split('T')[0];
    const userStorageKey = `usage_${userIdentifier}_${today}`;
    const ipStorageKey = `usage_${ipIdentifier}_${today}`;

    console.log(`🔍 Checking limits: ${userIdentifier}, IP: ${userIP}`);

    // Get current usage for both user and IP
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

    const dailyLimit = 2;
    const ipDailyLimit = 10;
    
    const userCount = currentUserUsage[processType] || 0;
    const ipCount = currentIPUsage[processType] || 0;
    
    const userCanProcess = userCount < dailyLimit;
    const ipCanProcess = ipCount < ipDailyLimit;
    const canProcess = userCanProcess && ipCanProcess;

    // Determine why user can't process if blocked
    let blockedReason = null;
    if (!userCanProcess) {
      blockedReason = 'User daily limit exceeded';
    } else if (!ipCanProcess) {
      blockedReason = 'Network daily limit exceeded';
    }

    // Return usage status
    res.status(200).json({
      canProcess: canProcess,
      plan: userPlan,
      blockedReason: blockedReason,
      usage: {
        mastering: currentUserUsage.mastering,
        vocal_separation: currentUserUsage.vocal_separation,
        limits: {
          mastering: dailyLimit,
          vocal_separation: dailyLimit
        },
        remaining: {
          mastering: dailyLimit - currentUserUsage.mastering,
          vocal_separation: dailyLimit - currentUserUsage.vocal_separation
        },
        ip: {
          mastering: currentIPUsage.mastering,
          vocal_separation: currentIPUsage.vocal_separation,
          limits: {
            mastering: ipDailyLimit,
            vocal_separation: ipDailyLimit
          },
          remaining: {
            mastering: ipDailyLimit - currentIPUsage.mastering,
            vocal_separation: ipDailyLimit - currentIPUsage.vocal_separation
          },
          uniqueUsers: currentIPUsage.users.size
        }
      },
      resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      processType: processType
    });

  } catch (error) {
    console.error('❌ Error checking limits:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}