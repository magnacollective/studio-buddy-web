// Test Firebase Admin SDK connection
// This verifies that environment variables are set up correctly

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables first
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    };

    // Check if any are missing
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Missing environment variables',
        missingVariables: missingVars,
        environmentVariables: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Try to import Firebase Admin SDK
    let admin;
    try {
      admin = require('firebase-admin');
    } catch (importError) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin SDK not available',
        details: importError.message,
        environmentVariables: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Initialize Firebase Admin SDK if not already done
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });
    }

    // Test Firestore connection
    const db = admin.firestore();
    const testDoc = await db.collection('users').limit(1).get();

    res.status(200).json({
      success: true,
      message: 'Firebase Admin SDK connected successfully',
      environmentVariables: envCheck,
      firestoreConnected: true,
      userCount: testDoc.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Firebase test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      environmentVariables: envCheck,
      timestamp: new Date().toISOString()
    });
  }
}