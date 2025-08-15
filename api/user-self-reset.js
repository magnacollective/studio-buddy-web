// Safer endpoint for users to reset their own subscription status
// Requires actual user authentication

const admin = require('firebase-admin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user's Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];

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

    // Verify the ID token and get user info
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { newPlan = 'free', newStatus = 'active' } = req.body;

    console.log(`🔒 AUTHENTICATED RESET: User ${userId} (${decodedToken.email}) resetting own subscription`);

    const db = admin.firestore();
    const userDoc = db.collection('users').doc(userId);

    // Get current user data
    const currentUser = await userDoc.get();
    if (!currentUser.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription data
    const updateData = {
      'subscription.plan': newPlan,
      'subscription.status': newStatus,
      'subscription.updatedAt': new Date(),
      'subscription.resetBy': 'user-self-reset',
      'subscription.resetAt': new Date()
    };

    await userDoc.update(updateData);

    console.log(`✅ User ${userId} self-reset subscription to ${newPlan}/${newStatus}`);

    res.status(200).json({
      success: true,
      message: 'Your subscription has been reset successfully',
      userId: userId,
      email: decodedToken.email,
      oldPlan: currentUser.data()?.subscription?.plan || 'unknown',
      newPlan: newPlan,
      newStatus: newStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in user self-reset:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired',
        message: 'Please sign in again'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to reset subscription'
    });
  }
}