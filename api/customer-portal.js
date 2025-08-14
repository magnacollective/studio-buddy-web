// Stripe Customer Portal Session Creation API
// This creates a portal session for users to manage their subscriptions

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
    const { customerId } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ 
        error: 'Missing required field: customerId' 
      });
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || process.env.DOMAIN || 'https://studio-buddy-web.vercel.app'}/dashboard`,
    });

    console.log('✅ Customer portal session created:', portalSession.id);
    res.json({ url: portalSession.url });

  } catch (error) {
    console.error('❌ Error creating customer portal session:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'api_error'
    });
  }
}

// Environment variables needed:
// STRIPE_SECRET_KEY=sk_test_your_secret_key_here
// APP_URL=https://yourdomain.com (or http://localhost:3000 for development)