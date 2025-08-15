// Stripe Webhook Handler
// This handles Stripe events like successful payments, subscription updates, etc.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.log('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        
        console.log('💳 Checkout completed for user:', userId);
        
        // Update user subscription in Firebase
        if (userId) {
          await updateUserSubscription(userId, 'premium', 'active', session);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        
        console.log('🎯 Subscription created for user:', userId);
        // Additional subscription setup if needed
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        
        console.log('🔄 Subscription updated for user:', userId);
        
        if (userId) {
          const status = subscription.status === 'active' ? 'active' : 'inactive';
          await updateUserSubscription(userId, 'premium', status, subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;
        
        console.log('❌ Subscription cancelled for user:', userId);
        
        if (userId) {
          await updateUserSubscription(userId, 'free', 'canceled', subscription);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('✅ Payment succeeded for invoice:', invoice.id);
        // Handle successful recurring payment
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('❌ Payment failed for invoice:', invoice.id);
        // Handle failed payment (notify user, retry, etc.)
        break;
      }

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// Helper function to update user subscription in Firebase
async function updateUserSubscription(userId, plan, status, stripeData) {
  try {
    const updateData = {
      'subscription.plan': plan,
      'subscription.status': status,
      'subscription.updatedAt': new Date(),
    };

    // Add Stripe-specific data
    if (stripeData) {
      if (stripeData.customer) {
        updateData['subscription.stripeCustomerId'] = stripeData.customer;
      }
      if (stripeData.subscription || stripeData.id) {
        updateData['subscription.stripeSubscriptionId'] = stripeData.subscription || stripeData.id;
      }
      if (stripeData.current_period_end) {
        updateData['subscription.currentPeriodEnd'] = new Date(stripeData.current_period_end * 1000);
      }
    }

    // Update user subscription using Firebase Admin SDK
    await admin.firestore().collection('users').doc(userId).update(updateData);

    console.log('✅ User subscription updated in Firebase:', userId);
  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
    // Consider adding this to a retry queue
  }
}

// Configuration notes:
// 1. Set up webhook endpoint in Stripe Dashboard: https://yourdomain.com/api/stripe-webhook
// 2. Select events: checkout.session.completed, customer.subscription.*, invoice.*
// 3. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET environment variable
// 4. Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe-webhook