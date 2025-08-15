// API endpoint to provide public configuration to the frontend
// This safely exposes only the publishable key and price ID

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return public configuration
  // These values come from Vercel environment variables
  const config = {
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripePriceId: process.env.STRIPE_PRICE_ID || '',
    environment: process.env.NODE_ENV || 'production'
  };

  // Validate configuration
  if (!config.stripePublishableKey || !config.stripePriceId) {
    console.error('⚠️ Stripe configuration missing in environment variables');
    return res.status(500).json({ 
      error: 'Payment system not configured',
      message: 'Please set STRIPE_PUBLISHABLE_KEY and STRIPE_PRICE_ID in Vercel environment variables'
    });
  }

  res.status(200).json(config);
}