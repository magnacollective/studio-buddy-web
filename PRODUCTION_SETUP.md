# Studio Buddy Web - Production Setup Guide

This guide will help you deploy Studio Buddy Web with proper premium subscription functionality.

## Prerequisites

1. **Stripe Account**: Set up a Stripe account at https://stripe.com
2. **Firebase Project**: For user authentication and data storage
3. **Deployment Platform**: Vercel, Netlify, or similar

## Environment Variables

Set these environment variables in your deployment platform:

### Required for Production
```bash
# Stripe Configuration (REQUIRED)
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
APP_URL=https://your-domain.com
NODE_ENV=production

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

### Optional
```bash
# Success/Cancel URLs (will use APP_URL if not specified)
SUCCESS_URL=https://your-domain.com/success
CANCEL_URL=https://your-domain.com/cancel

# API URL (defaults to window.location.origin)
API_URL=https://your-domain.com
```

## Stripe Setup

### 1. Create Product and Price
1. Go to Stripe Dashboard → Products
2. Create a new product: "Studio Buddy Premium"
3. Add a recurring price (e.g., $9.99/month)
4. Copy the Price ID (starts with `price_`) and set it as `STRIPE_PRICE_ID`

### 2. Set Up Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret and set it as `STRIPE_WEBHOOK_SECRET`

## Deployment Steps

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy the project
4. The API routes in `/api/` will automatically be deployed as serverless functions

### Netlify Deployment  
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Configure build settings:
   - Build command: `npm run build` (if you have one)
   - Publish directory: `/` (root directory)
4. The API routes in `/api/` need to be configured as Netlify Functions

### Custom Server Deployment
1. Set up a Node.js server
2. Configure environment variables
3. Serve the static files and API routes
4. Ensure HTTPS is enabled

## Security Checklist

### Production Security
- [ ] Use live Stripe keys (not test keys)
- [ ] Enable HTTPS
- [ ] Set proper CORS headers
- [ ] Configure CSP headers
- [ ] Set secure cookie flags
- [ ] Enable webhook signature verification

### Environment Variables Security
- [ ] Never commit secrets to version control
- [ ] Use your platform's secret management
- [ ] Rotate keys regularly
- [ ] Monitor for leaked keys

## Testing the Premium Workflow

### Test in Demo Mode
1. Deploy without Stripe keys set → automatically enables demo mode
2. Test the upgrade flow → simulates successful payment
3. Verify all UI elements work correctly

### Test with Stripe Test Mode
1. Use test keys (`pk_test_` and `sk_test_`)
2. Use test card numbers from Stripe documentation
3. Test successful and failed payments
4. Verify webhook handling

### Go Live
1. Replace test keys with live keys
2. Update webhook endpoints to production URLs
3. Test with real (small amount) transactions
4. Monitor Stripe dashboard for issues

## Monitoring and Maintenance

### Key Metrics to Monitor
- Successful checkout sessions
- Failed payments
- Subscription cancellations
- API errors and response times

### Regular Maintenance
- Update Stripe API versions
- Monitor webhook reliability
- Review subscription metrics
- Update pricing if needed

## Troubleshooting

### Common Issues

**Demo Mode Won't Disable**
- Ensure `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are set
- Check that keys start with `pk_live_` and `sk_live_` for production

**Payments Not Processing**
- Verify webhook endpoint is accessible
- Check webhook secret matches
- Review Stripe dashboard for errors

**API Errors**
- Check serverless function logs
- Verify environment variables are set
- Ensure proper CORS configuration

### Debug Information
The app logs helpful debug information to the console:
- Payment system status
- Environment detection
- Configuration validation

## Support

For issues with this setup:
1. Check the browser console for errors
2. Review Stripe dashboard logs
3. Check your deployment platform's function logs
4. Verify all environment variables are correctly set

## Production Readiness Checklist

- [ ] All environment variables configured
- [ ] Stripe product and pricing set up
- [ ] Webhooks configured and tested
- [ ] HTTPS enabled
- [ ] Domain configured properly
- [ ] Test transactions completed successfully
- [ ] Error handling tested
- [ ] User experience flow verified
- [ ] Analytics/monitoring set up
- [ ] Backup and recovery plan in place