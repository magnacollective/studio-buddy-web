// Studio Buddy Web Configuration
// This file helps with production deployment and environment management

class Config {
  constructor() {
    this.environment = this.detectEnvironment();
    this.isProduction = this.environment === 'production';
    this.isDevelopment = this.environment === 'development';
    
    // Initialize configuration
    this.initConfig();
  }

  detectEnvironment() {
    // Check various environment indicators
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('localhost')) {
      return 'development';
    }
    
    if (window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('netlify.app') ||
        window.location.hostname.includes('herokuapp.com') ||
        window.location.hostname.includes('railway.app')) {
      return 'production';
    }
    
    return 'production'; // Default to production for safety
  }

  initConfig() {
    // Set global config object
    window._studioConfig = {
      environment: this.environment,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      
      // API endpoints
      api: {
        base: window.location.origin,
        stripe: {
          createCheckout: '/api/create-checkout-session',
          verifyPayment: '/api/verify-payment',
          cancelSubscription: '/api/cancel-subscription',
          webhook: '/api/stripe-webhook'
        }
      },
      
      // Feature flags
      features: {
        demoMode: false, // Demo mode disabled - real Stripe required
        analytics: this.isProduction,
        logging: this.isDevelopment
      },
      
      // URLs
      urls: {
        success: `${window.location.origin}/success`,
        cancel: `${window.location.origin}/cancel`,
        terms: `${window.location.origin}/terms`,
        privacy: `${window.location.origin}/privacy`
      }
    };

    // Expose environment check functions
    window.isProduction = () => this.isProduction;
    window.isDevelopment = () => this.isDevelopment;
    
    console.log('🚀 Studio Buddy Config initialized');
    console.log('📊 Environment:', this.environment);
    console.log('💳 Stripe Mode: Production');
  }

  hasStripeKeys() {
    const pubKey = this.getEnvVar('STRIPE_PUBLISHABLE_KEY');
    const secretKey = this.getEnvVar('STRIPE_SECRET_KEY');
    
    return !!(pubKey && secretKey && 
             (pubKey.startsWith('pk_live_') || pubKey.startsWith('pk_test_')) &&
             (secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_')));
  }

  getEnvVar(name) {
    // Try multiple sources for environment variables
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
    
    if (window._env && window._env[name]) {
      return window._env[name];
    }
    
    const metaTag = document.querySelector(`meta[name="env-${name.toLowerCase()}"]`);
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    return null;
  }

  // Production readiness check
  static checkProductionReadiness() {
    const config = new Config();
    const issues = [];
    
    // Check required environment variables
    const requiredVars = [
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY', 
      'STRIPE_PRICE_ID'
    ];
    
    requiredVars.forEach(varName => {
      if (!config.getEnvVar(varName)) {
        issues.push(`Missing ${varName}`);
      }
    });
    
    // Check Stripe key validity
    const pubKey = config.getEnvVar('STRIPE_PUBLISHABLE_KEY');
    if (pubKey && !pubKey.startsWith('pk_live_') && config.isProduction) {
      issues.push('Using test Stripe keys in production');
    }
    
    // Check if running on HTTPS in production
    if (config.isProduction && window.location.protocol !== 'https:') {
      issues.push('Production deployment should use HTTPS');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Production Readiness Issues:', issues);
      return { ready: false, issues };
    }
    
    console.log('✅ Production readiness check passed');
    return { ready: true, issues: [] };
  }
}

// Initialize configuration immediately
const config = new Config();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}

// Make config globally available
window.Config = Config;
window.studioConfig = window._studioConfig;