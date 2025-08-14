// Production Setup Validation Script
// Run this to check if your Studio Buddy Web deployment is production-ready

class SetupValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.checks = 0;
  }

  // Helper to get environment variable
  getEnvVar(name) {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
    
    if (typeof window !== 'undefined' && window._env && window._env[name]) {
      return window._env[name];
    }
    
    const metaTag = document.querySelector(`meta[name="env-${name.toLowerCase()}"]`);
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    return null;
  }

  check(condition, message, isWarning = false) {
    this.checks++;
    if (!condition) {
      if (isWarning) {
        this.warnings.push(message);
      } else {
        this.issues.push(message);
      }
    }
  }

  validateStripeConfiguration() {
    console.log('🔍 Validating Stripe Configuration...');
    
    const pubKey = this.getEnvVar('STRIPE_PUBLISHABLE_KEY');
    const secretKey = this.getEnvVar('STRIPE_SECRET_KEY');
    const priceId = this.getEnvVar('STRIPE_PRICE_ID');
    const webhookSecret = this.getEnvVar('STRIPE_WEBHOOK_SECRET');
    
    // Check if keys exist
    this.check(!!pubKey, 'Missing STRIPE_PUBLISHABLE_KEY');
    this.check(!!secretKey, 'Missing STRIPE_SECRET_KEY');
    this.check(!!priceId, 'Missing STRIPE_PRICE_ID');
    this.check(!!webhookSecret, 'Missing STRIPE_WEBHOOK_SECRET', true);
    
    // Check key format
    if (pubKey) {
      const isValidPubKey = pubKey.startsWith('pk_live_') || pubKey.startsWith('pk_test_');
      this.check(isValidPubKey, 'Invalid STRIPE_PUBLISHABLE_KEY format');
      
      const isLiveKey = pubKey.startsWith('pk_live_');
      this.check(isLiveKey, 'Using test keys instead of live keys (production ready?)', true);
    }
    
    if (secretKey) {
      const isValidSecretKey = secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_');
      this.check(isValidSecretKey, 'Invalid STRIPE_SECRET_KEY format');
    }
    
    if (priceId) {
      const isValidPriceId = priceId.startsWith('price_');
      this.check(isValidPriceId, 'Invalid STRIPE_PRICE_ID format');
    }
  }

  validateEnvironment() {
    console.log('🌍 Validating Environment Configuration...');
    
    const nodeEnv = this.getEnvVar('NODE_ENV');
    const appUrl = this.getEnvVar('APP_URL');
    
    this.check(!!appUrl, 'Missing APP_URL');
    
    if (appUrl) {
      const isHttps = appUrl.startsWith('https://');
      this.check(isHttps, 'APP_URL should use HTTPS in production', true);
    }
    
    // Check if running in production environment
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol;
      
      if (!isLocalhost) {
        this.check(protocol === 'https:', 'Production deployment should use HTTPS');
      }
    }
  }

  validateFirebaseConfiguration() {
    console.log('🔥 Validating Firebase Configuration...');
    
    const apiKey = this.getEnvVar('FIREBASE_API_KEY');
    const authDomain = this.getEnvVar('FIREBASE_AUTH_DOMAIN');
    const projectId = this.getEnvVar('FIREBASE_PROJECT_ID');
    
    this.check(!!apiKey, 'Missing FIREBASE_API_KEY');
    this.check(!!authDomain, 'Missing FIREBASE_AUTH_DOMAIN');
    this.check(!!projectId, 'Missing FIREBASE_PROJECT_ID');
  }

  validateAPIEndpoints() {
    console.log('🔗 Validating API Endpoints...');
    
    const requiredEndpoints = [
      '/api/create-checkout-session',
      '/api/verify-payment',
      '/api/stripe-webhook'
    ];
    
    // This is a basic check - in a real validation, you'd make HTTP requests
    requiredEndpoints.forEach(endpoint => {
      // For now, just warn about endpoint availability
      console.log(`📋 Required endpoint: ${endpoint}`);
    });
    
    this.warnings.push('Manual verification needed: Ensure API endpoints are deployed and accessible');
  }

  validateSecurity() {
    console.log('🔒 Validating Security Configuration...');
    
    if (typeof window !== 'undefined') {
      // Check for secure context
      const isSecureContext = window.isSecureContext;
      this.check(isSecureContext, 'App should run in secure context (HTTPS)');
      
      // Check for mixed content
      if (window.location.protocol === 'https:') {
        // Would need to check for mixed content warnings in a real implementation
      }
    }
  }

  async run() {
    console.log('🚀 Starting Production Setup Validation...\n');
    
    this.validateStripeConfiguration();
    this.validateEnvironment();
    this.validateFirebaseConfiguration();
    this.validateAPIEndpoints();
    this.validateSecurity();
    
    console.log(`\n✅ Completed ${this.checks} validation checks\n`);
    
    // Report results
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Your setup is production ready.');
    } else {
      if (this.issues.length > 0) {
        console.log('❌ Critical Issues Found:');
        this.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        this.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning}`);
        });
      }
      
      console.log('\n📋 Next Steps:');
      if (this.issues.length > 0) {
        console.log('   1. Fix the critical issues above');
        console.log('   2. Update your environment variables');
        console.log('   3. Redeploy your application');
        console.log('   4. Run this validator again');
      } else {
        console.log('   1. Review the warnings above');
        console.log('   2. Address any security or performance concerns');
        console.log('   3. Test the payment flow end-to-end');
      }
    }
    
    return {
      success: this.issues.length === 0,
      issues: this.issues,
      warnings: this.warnings,
      totalChecks: this.checks
    };
  }
}

// Auto-run if loaded in browser
if (typeof window !== 'undefined') {
  // Make validator available globally
  window.SetupValidator = SetupValidator;
  
  // Auto-run validation
  console.log('Studio Buddy Web - Production Setup Validator');
  console.log('=============================================');
  
  const validator = new SetupValidator();
  validator.run().then(result => {
    console.log('\n📊 Validation Summary:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Issues: ${result.issues.length}`);
    console.log(`   Warnings: ${result.warnings.length}`);
    console.log(`   Total Checks: ${result.totalChecks}`);
    
    // Store result globally for inspection
    window.validationResult = result;
  });
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SetupValidator;
}