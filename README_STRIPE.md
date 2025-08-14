# 💳 Stripe Integration - Studio Buddy

Complete Stripe payment integration for Studio Buddy premium subscriptions.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Setup Helper
```bash
node setup-stripe.js
```

### 3. Deploy Backend APIs
Choose one option:

**Option A: Vercel**
```bash
npm i -g vercel
vercel
```

**Option B: Netlify**
```bash
npm i -g netlify-cli
netlify deploy
```

**Option C: Firebase Functions**
```bash
firebase init functions
firebase deploy --only functions
```

### 4. Configure Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy webhook secret to your environment variables

## 📁 Files Overview

### Frontend Integration
- `payment-manager.js` - Stripe checkout integration
- `success.html` - Payment success page
- `cancel.html` - Payment cancellation page

### Backend APIs
- `api/create-checkout-session.js` - Creates Stripe checkout sessions
- `api/stripe-webhook.js` - Handles Stripe webhook events

### Configuration
- `.env.example` - Environment variables template
- `setup-stripe.js` - Interactive setup helper
- `STRIPE_SETUP.md` - Detailed setup guide

## 🔧 Configuration

### Environment Variables
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
DOMAIN=https://yourdomain.com
```

### Payment Manager Settings
Update `payment-manager.js`:
```javascript
this.config = {
  stripePublishableKey: 'pk_live_your_live_key', // Use live key for production
  priceId: 'price_your_actual_price_id',
  demoMode: false // Set to false for production
};
```

## 🧪 Testing

### Test Mode (Default)
- Uses Stripe test keys (`pk_test_`, `sk_test_`)
- Test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`

### Test Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Test webhook
stripe trigger checkout.session.completed
```

### Demo Mode
- Set `demoMode: true` in `payment-manager.js`
- Simulates successful payments without real Stripe calls
- Perfect for development and testing

## 🔄 Payment Flow

### Customer Journey
1. User clicks "Upgrade to Premium"
2. Redirects to Stripe Checkout
3. Customer enters payment details
4. On success → `success.html`
5. On cancel → `cancel.html`
6. Webhook updates user subscription in Firebase

### Backend Flow
1. `create-checkout-session.js` creates Stripe session
2. User completes payment on Stripe
3. `stripe-webhook.js` receives webhook event
4. Firebase user document updated with premium status
5. Frontend reflects new subscription status

## 🛡️ Security Features

### Production Security
- ✅ Webhook signature verification
- ✅ Firebase auth token validation
- ✅ No sensitive keys in frontend
- ✅ HTTPS required for live mode
- ✅ Customer email validation

### Fraud Protection
- ✅ Stripe's built-in fraud detection
- ✅ 3D Secure authentication support
- ✅ Address verification
- ✅ CVC checks

## 🎯 Premium Features

### What Premium Users Get
- ✅ Unlimited audio track processing
- ✅ Priority processing speed
- ✅ Advanced audio analysis
- ✅ Multiple export formats
- ✅ Premium customer support
- ✅ Early access to new features

### Usage Enforcement
- Free users: 3 tracks/month limit
- Premium users: Unlimited processing
- Real-time usage tracking
- Automatic limit enforcement

## 📊 Monitoring & Analytics

### Stripe Dashboard
- Real-time payment monitoring
- Revenue analytics
- Customer lifecycle tracking
- Failed payment alerts

### Firebase Analytics
- User subscription events
- Usage pattern analysis
- Conversion funnel tracking
- Churn prediction

## 🔧 Deployment Platforms

### Vercel
```json
{
  "functions": {
    "api/create-checkout-session.js": {
      "maxDuration": 10
    },
    "api/stripe-webhook.js": {
      "maxDuration": 30
    }
  }
}
```

### Netlify
```toml
[build]
  functions = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Firebase Functions
```javascript
const functions = require('firebase-functions');
const { createCheckoutSession } = require('./checkout');
const { stripeWebhook } = require('./webhook');

exports.createCheckoutSession = functions.https.onCall(createCheckoutSession);
exports.stripeWebhook = functions.https.onRequest(stripeWebhook);
```

## 🆘 Troubleshooting

### Common Issues

**Webhook not working?**
- Check webhook URL is publicly accessible
- Verify webhook secret matches environment variable
- Check Stripe logs for delivery attempts

**Payment not updating user?**
- Check webhook events are properly selected
- Verify Firebase connection in webhook handler
- Check browser console for JavaScript errors

**Checkout session creation fails?**
- Verify Stripe secret key is valid
- Check price ID exists in Stripe
- Ensure user authentication is working

### Debug Mode
Enable debug logging:
```javascript
// In payment-manager.js
console.log('🐛 Debug mode enabled');
this.config.debug = true;
```

## 📞 Support

### Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Studio Buddy Issues](https://github.com/magnacollective/studio-buddy-web/issues)

### Support Checklist
Before asking for help:
- [ ] Followed setup guide completely
- [ ] Environment variables are set correctly
- [ ] Webhook endpoint is publicly accessible
- [ ] Test mode is working properly
- [ ] Browser console shows no errors

---

## 🎉 Ready for Production!

Your Studio Buddy Stripe integration is production-ready with:
- ✅ Complete payment flow
- ✅ Secure webhook handling
- ✅ Professional UI/UX
- ✅ Comprehensive error handling
- ✅ Real-time subscription management

**Happy monetizing! 🚀**