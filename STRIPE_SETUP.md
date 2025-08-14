# Stripe Integration Setup Guide for Studio Buddy

This guide will help you integrate Stripe payments for premium subscriptions in Studio Buddy.

## 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification (required for live payments)
3. Go to **Dashboard** → **Developers** → **API Keys**
4. Copy your **Publishable Key** and **Secret Key**

## 2. Create Stripe Products & Prices

### Via Stripe Dashboard:
1. Go to **Products** → **Add Product**
2. Create product: "Studio Buddy Premium"
3. Add price: $9.99/month (recurring)
4. Copy the **Price ID** (starts with `price_`)

### Via Stripe CLI (Alternative):
```bash
# Install Stripe CLI
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-buster-stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Login to Stripe
stripe login

# Create product and price
stripe products create --name="Studio Buddy Premium" --description="Unlimited audio processing and premium features"
stripe prices create --unit-amount=999 --currency=usd --recurring-interval=month --product=prod_YOUR_PRODUCT_ID
```

## 3. Update Firebase Configuration

Add Stripe keys to your environment variables:

```javascript
// In firebase-config.js or separate config file
const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here',
  priceId: process.env.STRIPE_PRICE_ID || 'price_your_price_id_here'
};
```

## 4. Backend Setup Options

### Option A: Firebase Functions (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase Functions
cd /path/to/your/project
firebase init functions

# Install Stripe in functions directory
cd functions
npm install stripe
```

Create `functions/index.js`:
```javascript
const functions = require('firebase-functions');
const stripe = require('stripe')(functions.config().stripe.secret_key);
const admin = require('firebase-admin');
admin.initializeApp();

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { priceId } = data;
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${functions.config().app.url}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app.url}/cancel`,
      metadata: {
        userId: userId
      }
    });

    return { sessionId: session.id };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    // Update user subscription in Firestore
    await admin.firestore().collection('users').doc(userId).update({
      'subscription.plan': 'premium',
      'subscription.status': 'active',
      'subscription.stripeCustomerId': session.customer,
      'subscription.stripeSubscriptionId': session.subscription
    });
  }

  res.json({ received: true });
});
```

Set Firebase config:
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_secret_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
firebase functions:config:set app.url="https://yourdomain.com"
```

### Option B: Vercel/Netlify Functions

Create `api/create-checkout-session.js`:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN}/cancel`,
      metadata: { userId }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 5. Frontend Integration

Update `payment-manager.js` to use real Stripe:

```javascript
// Replace the demo simulation with real Stripe calls
async createPremiumCheckout() {
  if (!window.authManager.isAuthenticated()) {
    throw new Error('User must be authenticated to subscribe');
  }

  try {
    const user = window.authManager.getCurrentUser();
    
    // Call your backend function
    const functions = firebase.functions();
    const createCheckoutSession = functions.httpsCallable('createCheckoutSession');
    
    const result = await createCheckoutSession({
      priceId: 'price_your_price_id_here'
    });

    // Redirect to Stripe checkout
    const { error } = await this.stripe.redirectToCheckout({
      sessionId: result.data.sessionId
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
```

## 6. Environment Variables Setup

Create `.env.local` file:
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DOMAIN=http://localhost:3000
```

For production, set these in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Firebase**: `firebase functions:config:set`

## 7. Test Integration

### Test Mode:
1. Use Stripe test keys (start with `pk_test_` and `sk_test_`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Test webhook locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### Production Mode:
1. Switch to live keys in production environment
2. Set up production webhook endpoint in Stripe Dashboard
3. Test with real card (small amount)

## 8. Security Checklist

- ✅ Never expose secret keys in frontend code
- ✅ Validate webhooks with signature verification
- ✅ Use HTTPS in production
- ✅ Implement proper error handling
- ✅ Log payment events for debugging
- ✅ Set up monitoring for failed payments

## 9. Additional Features

### Customer Portal:
```javascript
// Allow users to manage subscriptions
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://yourdomain.com/dashboard'
});
```

### Usage-Based Billing:
```javascript
// Report usage for metered billing
await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
  quantity: tracksProcessed,
  timestamp: Math.floor(Date.now() / 1000)
});
```

## Next Steps

1. Complete Stripe account setup and verification
2. Create products and prices in Stripe Dashboard
3. Choose backend option (Firebase Functions recommended)
4. Update payment-manager.js with real Stripe calls
5. Set up webhook endpoints
6. Test thoroughly in test mode
7. Deploy to production with live keys

Your authentication system is already Stripe-ready! 🚀