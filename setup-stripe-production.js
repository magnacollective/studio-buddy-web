#!/usr/bin/env node

// Stripe Production Setup Script
// This script helps you configure Stripe for production deployment

const fs = require('fs');
const path = require('path');

console.log('🎯 Studio Buddy - Stripe Production Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found!');
  console.log('📋 Creating .env file template...\n');
  
  const envTemplate = `# Stripe Configuration
# Get these from your Stripe Dashboard -> Developers -> API keys
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Product Configuration
# Get this from Stripe Dashboard -> Products -> Studio Buddy Premium -> Pricing
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Stripe Webhook Configuration
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App Configuration
APP_URL=https://studio-buddy-web.vercel.app
NODE_ENV=production

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Success/Cancel URLs
SUCCESS_URL=https://studio-buddy-web.vercel.app/success
CANCEL_URL=https://studio-buddy-web.vercel.app/cancel
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created!');
}

console.log('📋 Stripe Integration Checklist:\n');

console.log('1. ✅ Create Stripe Account');
console.log('   - Go to https://stripe.com');
console.log('   - Sign up for an account');
console.log('   - Complete business verification\n');

console.log('2. ✅ Get API Keys');
console.log('   - Go to Stripe Dashboard -> Developers -> API keys');
console.log('   - Copy Publishable key (pk_test_...)');
console.log('   - Copy Secret key (sk_test_...)');
console.log('   - Add them to your .env file\n');

console.log('3. ✅ Create Product & Pricing');
console.log('   - Go to Stripe Dashboard -> Products');
console.log('   - Create product: "Studio Buddy Premium"');
console.log('   - Add pricing: $9.99/month recurring');
console.log('   - Copy the Price ID (price_...)');
console.log('   - Add it to your .env file\n');

console.log('4. ✅ Deploy to Vercel');
console.log('   - Run: npx vercel');
console.log('   - Add environment variables in Vercel dashboard');
console.log('   - Or use: vercel env add\n');

console.log('5. ✅ Configure Webhooks');
console.log('   - Go to Stripe Dashboard -> Developers -> Webhooks');
console.log('   - Add endpoint: https://your-app.vercel.app/api/stripe-webhook');
console.log('   - Select events: checkout.session.completed, customer.subscription.*');
console.log('   - Copy webhook secret and add to .env\n');

console.log('6. ✅ Test Payment Flow');
console.log('   - Use test card: 4242 4242 4242 4242');
console.log('   - Check Stripe Dashboard for events');
console.log('   - Verify webhook delivery\n');

console.log('🔧 Environment Variables Needed:\n');

const requiredVars = [
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY', 
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'APP_URL'
];

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=YOUR_`);
    const status = hasVar ? '✅' : '❌';
    console.log(`   ${status} ${varName}`);
  });
} else {
  requiredVars.forEach(varName => {
    console.log(`   ❌ ${varName}`);
  });
}

console.log('\n🚀 Next Steps:');
console.log('1. Fill in your .env file with real Stripe keys');
console.log('2. Deploy to Vercel: npx vercel --prod');
console.log('3. Set up webhook endpoint in Stripe Dashboard');
console.log('4. Test with Stripe test cards\n');

console.log('📚 Documentation:');
console.log('- Stripe Dashboard: https://dashboard.stripe.com');
console.log('- Test Cards: https://stripe.com/docs/testing#cards');
console.log('- Webhooks: https://stripe.com/docs/webhooks\n');

console.log('🎯 Ready to accept payments! 💳');