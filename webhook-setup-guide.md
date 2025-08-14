# 🎯 Stripe Webhook Setup Guide

## After Vercel Deployment

### 1. Get Your Vercel URL
After deployment, you'll get a URL like:
```
https://studio-buddy-web-your-username.vercel.app
```

### 2. Configure Stripe Webhook

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-vercel-url.vercel.app/api/stripe-webhook`
4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Get Webhook Secret
1. **Click on your webhook endpoint**
2. **Copy the "Signing secret"** (starts with `whsec_`)
3. **Add to Vercel environment variables**:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET
   # Paste your webhook secret
   ```

### 4. Test Webhook
1. **Go to your webhook in Stripe Dashboard**
2. **Click "Send test webhook"**
3. **Check Vercel function logs** to verify it's working

### 5. Required Environment Variables

Make sure these are set in Vercel:

```bash
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_your_key
STRIPE_SECRET_KEY=sk_live_or_test_your_key
STRIPE_PRICE_ID=price_your_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
APP_URL=https://your-vercel-url.vercel.app
NODE_ENV=production
```

### 6. Test Payment Flow

Use these test cards in Stripe:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### 7. Verify Everything Works

✅ Checkout session creation
✅ Payment processing  
✅ Webhook delivery
✅ User subscription update
✅ Customer portal access

## 🔧 Troubleshooting

### Webhook Not Receiving Events
- Check endpoint URL is correct
- Verify webhook secret in environment variables
- Check Vercel function logs for errors

### Payment Not Processing
- Verify Stripe keys are correct
- Check browser console for JavaScript errors
- Ensure environment variables are set

### CORS Issues
- Verify API endpoints have proper CORS headers
- Check vercel.json configuration

## 📋 Testing Checklist

- [ ] Webhook endpoint responds to Stripe
- [ ] Test payment completes successfully  
- [ ] User subscription is updated
- [ ] Customer portal works
- [ ] Email receipts are sent (if configured)