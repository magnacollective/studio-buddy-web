// Stripe Checkout Session Creation API
// This is a sample backend endpoint - deploy to Vercel, Netlify, or Firebase Functions

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, email } = req.body;

    // Validate required fields
    if (!priceId || !userId || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: priceId, userId, email' 
      });
    }

    // Verify Firebase auth token (optional but recommended)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      // TODO: Verify Firebase token with admin SDK
      // const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Auth token received:', token ? 'Yes' : 'No');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || process.env.DOMAIN || 'https://studiobuddy.xyz'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || process.env.DOMAIN || 'https://studiobuddy.xyz'}/cancel`,
      metadata: {
        userId: userId,
        source: 'studio_buddy_web'
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      },
      // Allow promotional codes
      allow_promotion_codes: true,
      // Set billing address collection
      billing_address_collection: 'required'
    });

    console.log('✅ Checkout session created:', session.id);
    res.json({ sessionId: session.id });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'api_error'
    });
  }
}

// Environment variables needed:
// STRIPE_SECRET_KEY=sk_test_your_secret_key_here
// DOMAIN=https://yourdomain.com (or http://localhost:3000 for development)