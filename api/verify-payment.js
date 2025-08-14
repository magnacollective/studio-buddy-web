// Stripe Payment Verification API
// This verifies a checkout session and returns subscription details

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
    const { sessionId } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Missing required field: sessionId' 
      });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        status: session.payment_status 
      });
    }

    // Get subscription details
    const subscription = session.subscription;
    const customer = session.customer;

    const result = {
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      },
      customer: {
        id: customer.id,
        email: customer.email
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        plan: subscription.items.data[0]?.price?.nickname || 'Premium'
      },
      metadata: session.metadata
    };

    console.log('✅ Payment verified for session:', sessionId);
    res.json(result);

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'api_error'
    });
  }
}

// Environment variables needed:
// STRIPE_SECRET_KEY=sk_test_your_secret_key_here