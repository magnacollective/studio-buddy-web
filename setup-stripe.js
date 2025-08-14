#!/usr/bin/env node
// Stripe Setup Helper for Studio Buddy
// Run with: node setup-stripe.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎯 Studio Buddy Stripe Setup Helper\n');
console.log('This will help you configure Stripe for your Studio Buddy installation.\n');

async function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupStripe() {
  try {
    console.log('📋 Let\'s gather your Stripe configuration:\n');

    // Get Stripe keys
    const publishableKey = await question('1. Enter your Stripe Publishable Key (pk_test_...): ');
    const secretKey = await question('2. Enter your Stripe Secret Key (sk_test_...): ');
    const priceId = await question('3. Enter your Premium Price ID (price_...): ');
    const webhookSecret = await question('4. Enter your Webhook Secret (whsec_...) [optional]: ');
    const domain = await question('5. Enter your domain (e.g., https://yourdomain.com) [localhost:3000]: ') || 'http://localhost:3000';

    console.log('\n🔧 Updating configuration files...\n');

    // Update payment-manager.js
    const paymentManagerPath = path.join(__dirname, 'payment-manager.js');
    let paymentManagerContent = fs.readFileSync(paymentManagerPath, 'utf8');
    
    paymentManagerContent = paymentManagerContent.replace(
      /stripePublishableKey: '[^']*'/,
      `stripePublishableKey: '${publishableKey}'`
    );
    paymentManagerContent = paymentManagerContent.replace(
      /priceId: '[^']*'/,
      `priceId: '${priceId}'`
    );
    paymentManagerContent = paymentManagerContent.replace(
      /demoMode: true/,
      'demoMode: false'
    );

    fs.writeFileSync(paymentManagerPath, paymentManagerContent);
    console.log('✅ Updated payment-manager.js');

    // Create .env.local file
    const envContent = `# Studio Buddy Environment Variables
STRIPE_PUBLISHABLE_KEY=${publishableKey}
STRIPE_SECRET_KEY=${secretKey}
STRIPE_PRICE_ID=${priceId}
${webhookSecret ? `STRIPE_WEBHOOK_SECRET=${webhookSecret}` : '# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret'}
DOMAIN=${domain}
NODE_ENV=development
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local file');

    // Update package.json with stripe dependency
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.dependencies.stripe) {
      packageJson.dependencies.stripe = '^14.0.0';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added Stripe to package.json');
    }

    console.log('\n🎉 Stripe configuration complete!\n');
    console.log('Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Deploy your backend API endpoints (api/create-checkout-session.js, api/stripe-webhook.js)');
    console.log('3. Configure webhook endpoint in Stripe Dashboard');
    console.log('4. Test the payment flow\n');

    console.log('📚 For detailed setup instructions, see STRIPE_SETUP.md\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStripe();
}

module.exports = { setupStripe };