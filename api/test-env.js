// Simple environment variable test (no dependencies)
// This verifies that environment variables are set up correctly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
    };

    // Check if any are missing
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    // Show partial values for debugging (first 10 chars)
    const partialValues = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.substring(0, 10) + '...',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'NOT SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
    };

    const allSet = missingVars.length === 0;

    res.status(allSet ? 200 : 500).json({
      success: allSet,
      message: allSet ? 'All environment variables are set' : 'Some environment variables are missing',
      environmentVariables: envCheck,
      missingVariables: missingVars,
      partialValues: partialValues,
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Environment test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}