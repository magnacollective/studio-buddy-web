// Payment Manager for subscription handling - Global Window Implementation

class PaymentManager {
  constructor() {
    // Configuration - uses environment variables (Stripe integration required)
    this.config = {
      stripePublishableKey: this.getEnvVar('STRIPE_PUBLISHABLE_KEY') || '',
      priceId: this.getEnvVar('STRIPE_PRICE_ID') || '',
      apiUrl: this.getEnvVar('API_URL') || window.location.origin
    };
    
    // Demo mode is disabled - real Stripe integration required
    this.config.demoMode = false;
    
    this.stripe = null;
    this.isInitialized = false;
    this.init();
  }

  // Helper to get environment variables from various sources
  getEnvVar(name) {
    // Try process.env first
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
    
    // Try window._env object (for runtime config)
    if (typeof window !== 'undefined' && window._env && window._env[name]) {
      return window._env[name];
    }
    
    // Try meta tag
    const metaTag = document.querySelector(`meta[name="env-${name.toLowerCase()}"]`);
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    return null;
  }

  // Validate Stripe configuration
  validateStripeConfig() {
    const pubKey = this.config.stripePublishableKey;
    const priceId = this.config.priceId;
    
    if (!pubKey || !priceId) {
      throw new Error('Stripe configuration missing. Please configure STRIPE_PUBLISHABLE_KEY and STRIPE_PRICE_ID.');
    }
    
    // Check if keys are valid format
    const validPubKey = pubKey.startsWith('pk_live_') || pubKey.startsWith('pk_test_');
    
    if (!validPubKey) {
      throw new Error('Invalid Stripe publishable key format.');
    }
    
    return true;
  }

  async init() {
    try {
      // Wait for configuration to be loaded from API
      await this.waitForConfig();
      
      // Load Stripe.js dynamically
      if (typeof Stripe === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => this.initializeStripe();
        document.head.appendChild(script);
      } else {
        this.initializeStripe();
      }
    } catch (error) {
      console.error('❌ Failed to initialize payment system:', error);
      this.isInitialized = false;
      // Do not allow any payments if configuration fails
      throw error;
    }
  }

  async waitForConfig() {
    // Wait up to 5 seconds for config to be loaded
    const maxAttempts = 50;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // Check if config is loaded
      if (this.config.stripePublishableKey && this.config.priceId) {
        return;
      }
      
      // Update config from window._env
      this.config.stripePublishableKey = this.getEnvVar('STRIPE_PUBLISHABLE_KEY') || '';
      this.config.priceId = this.getEnvVar('STRIPE_PRICE_ID') || '';
      
      if (this.config.stripePublishableKey && this.config.priceId) {
        return;
      }
      
      // Wait 100ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    throw new Error('Failed to load Stripe configuration from API');
  }

  initializeStripe() {
    try {
      // Validate configuration before initializing
      this.validateStripeConfig();
      
      this.stripe = Stripe(this.config.stripePublishableKey);
      this.isInitialized = true;
      
      console.log('✅ Stripe initialized successfully');
      console.log(`💡 Environment: ${this.isProductionReady() ? 'Production Ready' : 'Development'}`);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Check if the payment system is production ready
  isProductionReady() {
    const requiredVars = [
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !this.getEnvVar(varName));
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing environment variables for production:', missingVars);
      return false;
    }
    
    const pubKey = this.getEnvVar('STRIPE_PUBLISHABLE_KEY');
    const isLiveMode = pubKey && pubKey.startsWith('pk_live_');
    
    return isLiveMode;
  }

  // Create checkout session for premium subscription
  async createPremiumCheckout() {
    if (!window.authManager.isAuthenticated()) {
      throw new Error('User must be authenticated to subscribe');
    }

    // Ensure Stripe is properly initialized
    if (!this.isInitialized) {
      throw new Error('Stripe is not properly initialized. Please check your configuration.');
    }

    try {
      const user = window.authManager.getCurrentUser();
      
      // Call your backend API to create a Stripe checkout session
      const response = await fetch(`${this.config.apiUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          priceId: this.config.priceId,
          userId: user.uid,
          email: user.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // API must be available for payments
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Payment API is unavailable. Please check your backend configuration.');
      }
      
      throw error;
    }
  }

  // Handle successful payment (webhook would typically handle this)
  async handlePaymentSuccess(sessionId) {
    try {
      const user = window.authManager.getCurrentUser();
      if (!user) return false;

      // Verify the payment with your backend
      const response = await fetch(`${this.config.apiUrl}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const { success } = await response.json();
      
      if (success) {
        // Update user subscription in Firebase
        await window.authManager.updateSubscription('premium', 'active', null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error handling payment success:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription() {
    if (!window.authManager.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }

    try {
      const user = window.authManager.getCurrentUser();
      
      const response = await fetch(`${this.config.apiUrl}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update user subscription in Firebase
      await authManager.updateSubscription('free', 'canceled', null);
      
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Show upgrade modal with payment options
  showUpgradeModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.upgrade-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = this.createUpgradeModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  createUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
      <div class="upgrade-modal-content">
        <div class="upgrade-modal-header">
          <h2>Upgrade to Premium</h2>
          <button class="upgrade-close">&times;</button>
        </div>
        
        <div class="upgrade-modal-body">
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>Studio Buddy Premium</h3>
              <div class="price">$9.99<span class="period">/month</span></div>
            </div>
            
            <div class="pricing-features">
              <div class="feature">✓ Unlimited track processing</div>
              <div class="feature">✓ Priority processing speed</div>
              <div class="feature">✓ Advanced audio analysis</div>
              <div class="feature">✓ Export in multiple formats</div>
              <div class="feature">✓ Premium support</div>
              <div class="feature">✓ Cancel anytime</div>
            </div>
            
            <button class="subscribe-btn" id="subscribe-btn">
              Subscribe Now
            </button>
            
            <div class="payment-info">
              <div class="secure-payment">🔒 Secure Payment via Stripe</div>
              <div class="trial-info">Cancel anytime • Secure billing</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addUpgradeModalStyles(modal);

    // Bind events
    modal.querySelector('.upgrade-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    modal.querySelector('#subscribe-btn').addEventListener('click', async () => {
      try {
        modal.querySelector('#subscribe-btn').textContent = 'Processing...';
        modal.querySelector('#subscribe-btn').disabled = true;
        
        // Validate configuration before proceeding
        if (!this.config.stripePublishableKey || !this.config.priceId) {
          throw new Error('Stripe is not configured. Please contact support.');
        }
        
        // Ensure Stripe is initialized
        if (!this.isInitialized || !this.stripe) {
          throw new Error('Payment system is not ready. Please try again in a moment.');
        }
        
        // Real checkout session - this should redirect to Stripe
        await this.createPremiumCheckout();
        
        // If we reach this point without redirecting, something went wrong
        throw new Error('Payment system failed to redirect to checkout. Please try again.');
        
      } catch (error) {
        console.error('❌ Payment error:', error);
        this.showPaymentNotification('Error: ' + error.message, 'error');
        modal.querySelector('#subscribe-btn').textContent = 'Subscribe Now';
        modal.querySelector('#subscribe-btn').disabled = false;
        
        // CRITICAL: Do not grant premium on error
        // Premium access is only granted after successful Stripe payment
      }
    });


    return modal;
  }

  addUpgradeModalStyles(modal) {
    const styles = `
      .upgrade-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        backdrop-filter: blur(4px);
      }

      .upgrade-modal-content {
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        width: 90%;
        max-width: 400px;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
      }

      .upgrade-modal-header {
        background: linear-gradient(90deg, #ff6600, #ff8800);
        color: white;
        padding: 6px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .upgrade-modal-header h2 {
        margin: 0;
        font-size: 12px;
        font-weight: bold;
      }

      .upgrade-close {
        background: #c0c0c0;
        border: 1px outset #c0c0c0;
        width: 18px;
        height: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        color: #000;
      }

      .upgrade-modal-body {
        padding: 20px;
      }

      .pricing-card {
        text-align: center;
      }

      .pricing-header h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #ff6600;
        font-weight: bold;
      }

      .price {
        font-size: 24px;
        font-weight: bold;
        color: #000;
        margin-bottom: 16px;
      }

      .period {
        font-size: 12px;
        color: #666;
      }

      .pricing-features {
        text-align: left;
        margin-bottom: 20px;
        background: #e0e0e0;
        padding: 12px;
        border: 1px inset #c0c0c0;
      }

      .feature {
        margin-bottom: 6px;
        color: #006600;
        font-weight: bold;
      }

      .feature:last-child {
        margin-bottom: 0;
      }

      .subscribe-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(90deg, #ff6600, #ff8800);
        color: white;
        border: 2px outset #ff6600;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
        margin-bottom: 12px;
      }

      .subscribe-btn:hover {
        background: linear-gradient(90deg, #ff7700, #ff9900);
      }

      .subscribe-btn:active {
        border: 2px inset #ff6600;
      }

      .subscribe-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .payment-info {
        font-size: 10px;
        color: #666;
        text-align: center;
      }

      .secure-payment {
        margin-bottom: 4px;
        color: #006600;
      }

      .trial-info {
        font-style: italic;
      }
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    modal.appendChild(style);
  }


  showPaymentNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `payment-notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'error' ? '#ffcccc' : type === 'success' ? '#ccffcc' : type === 'warning' ? '#ffffcc' : '#ccccff',
      border: `2px outset ${type === 'error' ? '#ff6666' : type === 'success' ? '#00cc00' : type === 'warning' ? '#ffcc00' : '#0066cc'}`,
      color: type === 'error' ? '#cc0000' : type === 'success' ? '#006600' : type === 'warning' ? '#cc6600' : '#000066',
      padding: '12px 16px',
      maxWidth: '350px',
      zIndex: '10004',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      wordWrap: 'break-word',
      boxShadow: '4px 4px 8px rgba(0,0,0,0.3)'
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 6 seconds for success messages, 8 seconds for others
    const timeout = type === 'success' ? 6000 : 8000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, timeout);
  }

  // Log backend requirements
  static logBackendRequirements() {
    console.log('🚀 Stripe payment system initialized');
    console.log('📋 Required backend endpoints:');
    console.log('  - POST /api/create-checkout-session');
    console.log('  - POST /api/verify-payment');
    console.log('  - POST /api/cancel-subscription');
    console.log('  - POST /api/webhook/stripe (for payment webhooks)');
  }
}

// Create global payment manager
const paymentManager = new PaymentManager();
window.paymentManager = paymentManager;

// Log backend requirements
PaymentManager.logBackendRequirements();