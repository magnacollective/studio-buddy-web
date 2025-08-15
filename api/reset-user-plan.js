// Endpoint to reset user subscription status for testing
// This should only be used for debugging/testing

const admin = require('firebase-admin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, newPlan = 'free', newStatus = 'active' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
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
      'subscription.resetBy': 'debug-endpoint',
      'subscription.resetAt': new Date()
    };

    await userDoc.update(updateData);

    console.log(`✅ User ${userId} subscription reset to ${newPlan}/${newStatus}`);

    res.status(200).json({
      success: true,
      message: `User subscription reset successfully`,
      userId: userId,
      oldPlan: currentUser.data()?.subscription?.plan || 'unknown',
      newPlan: newPlan,
      newStatus: newStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error resetting user subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      userId: userId
    });
  }
}