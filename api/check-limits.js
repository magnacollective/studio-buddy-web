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

    // Get current date for daily limits
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `usage_${identifier}_${today}`;

    // Get current usage
    global.usageStore = global.usageStore || {};
    const currentUsage = global.usageStore[storageKey] || {
      mastering: 0,
      vocal_separation: 0,
      date: today,
      identifier: identifier
    };

    const dailyLimit = 2;
    const currentCount = currentUsage[processType] || 0;
    const canProcess = currentCount < dailyLimit;

    // Return usage status
    res.status(200).json({
      canProcess: canProcess,
      plan: userPlan,
      usage: {
        mastering: currentUsage.mastering,
        vocal_separation: currentUsage.vocal_separation,
        limits: {
          mastering: dailyLimit,
          vocal_separation: dailyLimit
        },
        remaining: {
          mastering: dailyLimit - currentUsage.mastering,
          vocal_separation: dailyLimit - currentUsage.vocal_separation
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