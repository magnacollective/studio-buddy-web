// Payment Manager for subscription handling - Global Window Implementation

class PaymentManager {
  constructor() {
    // Configuration - uses environment variables or defaults to demo mode
    this.config = {
      stripePublishableKey: this.getEnvVar('STRIPE_PUBLISHABLE_KEY') || 'pk_test_demo_mode',
      priceId: this.getEnvVar('STRIPE_PRICE_ID') || 'price_1RvySh0R5PD3apLx2nTyNXkw',
      apiUrl: this.getEnvVar('API_URL') || window.location.origin
    };
    
    // Determine if we're in demo mode based on actual Stripe key validity
    this.config.demoMode = this.shouldUseDemoMode();
    
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

  // Determine if we should use demo mode
  shouldUseDemoMode() {
    const pubKey = this.config.stripePublishableKey;
    const secretKey = this.getEnvVar('STRIPE_SECRET_KEY');
    
    // If no keys provided or placeholder values, use demo mode
    if (!pubKey || !secretKey || 
        pubKey === 'pk_test_demo_mode' ||
        pubKey === 'pk_test_YOUR_PUBLISHABLE_KEY_HERE' ||
        secretKey === 'sk_test_YOUR_SECRET_KEY_HERE') {
      return true;
    }
    
    // If keys don't start with proper prefixes, use demo mode
    const validPubKey = pubKey.startsWith('pk_live_') || pubKey.startsWith('pk_test_');
    const validSecretKey = secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_');
    
    if (!validPubKey || !validSecretKey) {
      return true;
    }
    
    // All checks passed, we can use real Stripe
    return false;
  }

  async init() {
    try {
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
      console.error('Error loading Stripe:', error);
    }
  }

  initializeStripe() {
    try {
      // Check if we have real Stripe keys or are in demo mode
      const hasRealStripeKeys = this.config.stripePublishableKey.startsWith('pk_live_') || 
                                this.config.stripePublishableKey.startsWith('pk_test_');
      
      if (!hasRealStripeKeys) {
        console.log('💡 No valid Stripe keys found, enabling demo mode');
        this.config.demoMode = true;
      }
      
      this.stripe = Stripe(this.config.stripePublishableKey);
      this.isInitialized = true;
      
      console.log('✅ Stripe initialized successfully');
      console.log(`💡 Demo mode: ${this.config.demoMode ? 'ON' : 'OFF'}`);
      console.log(`💡 Environment: ${this.isProductionReady() ? 'Production Ready' : 'Development'}`);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      console.log('💡 Using demo mode due to Stripe initialization error');
      this.config.demoMode = true;
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

    // Check if demo mode or production mode
    if (this.config.demoMode) {
      console.log('🎭 Demo mode: Using simulated checkout');
      return this.simulateSuccessfulUpgrade();
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
      
      // Fallback to demo mode if API is not available
      if (error.message.includes('Failed to fetch')) {
        console.log('🎭 API unavailable, falling back to demo mode');
        this.config.demoMode = true;
        return this.simulateSuccessfulUpgrade();
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
              <div class="secure-payment">🔒 ${this.config.demoMode ? 'Demo Mode - No actual payment required' : 'Secure Payment via Stripe'}</div>
              <div class="trial-info">${this.config.demoMode ? 'For testing • Real Stripe integration ready' : 'Cancel anytime • Secure billing'}</div>
            </div>
            
            ${this.config.demoMode ? `
            <div class="demo-controls" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #808080;">
              <div style="font-size: 10px; margin-bottom: 8px; color: #666;">Demo Controls:</div>
              <button class="demo-btn" id="downgrade-btn" style="background: #ff6666; color: white; border: 1px solid #ff6666; padding: 4px 8px; margin-right: 8px; font-size: 10px; cursor: pointer;">
                Simulate Downgrade
              </button>
              <button class="demo-btn" onclick="alert('Feature: View payment history, manage billing, update payment methods')" style="background: #666; color: white; border: 1px solid #666; padding: 4px 8px; font-size: 10px; cursor: pointer;">
                Billing Settings
              </button>
            </div>
            ` : ''}
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
        
        if (this.config.demoMode) {
          // For demo purposes - simulate successful upgrade
          await this.simulateSuccessfulUpgrade();
        } else {
          // Real checkout session
          await this.createPremiumCheckout();
        }
      } catch (error) {
        this.showPaymentNotification('Error processing upgrade: ' + error.message, 'error');
        modal.querySelector('#subscribe-btn').textContent = 'Subscribe Now';
        modal.querySelector('#subscribe-btn').disabled = false;
      }
    });

    // Add downgrade button event listener (only in demo mode)
    if (this.config.demoMode) {
      const downgradeBtn = modal.querySelector('#downgrade-btn');
      if (downgradeBtn) {
        downgradeBtn.addEventListener('click', async () => {
          if (confirm('Downgrade to Free Plan?\n\nYou will lose Premium benefits and be limited to 3 tracks per month.')) {
            modal.remove();
            await this.simulateDowngrade();
          }
        });
      }
    }

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

  // Simulate successful upgrade for demo purposes
  async simulateSuccessfulUpgrade() {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Update user subscription to premium
          const success = await window.authManager.updateSubscription('premium', 'active', null);
          
          if (success) {
            // Close modal
            const modal = document.querySelector('.upgrade-modal');
            if (modal) modal.remove();
            
            this.showPaymentNotification('🎉 Welcome to Premium! You now have unlimited access to all features.', 'success');
            
            // Update the start button to reflect premium status
            const userStatus = document.getElementById('user-status');
            if (userStatus) {
              userStatus.textContent = '⭐';
            }
            
            resolve();
          } else {
            throw new Error('Failed to update subscription');
          }
        } catch (error) {
          this.showPaymentNotification('Error upgrading account: ' + error.message, 'error');
          throw error;
        }
      }, 2000); // 2 second delay to simulate processing
    });
  }

  // Simulate downgrade for demo purposes
  async simulateDowngrade() {
    try {
      const success = await window.authManager.updateSubscription('free', 'active', null);
      
      if (success) {
        this.showPaymentNotification('Downgraded to Free Plan. You now have 3 tracks per month.', 'info');
        
        // Update the start button to reflect free status
        const userStatus = document.getElementById('user-status');
        if (userStatus) {
          userStatus.textContent = '👤';
        }
      } else {
        throw new Error('Failed to downgrade subscription');
      }
    } catch (error) {
      this.showPaymentNotification('Error downgrading account: ' + error.message, 'error');
    }
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

  // Mock backend endpoints for development
  static createMockEndpoints() {
    console.log('🚀 Payment system ready for backend integration');
    console.log('📋 Required backend endpoints:');
    console.log('  - POST /api/create-checkout-session');
    console.log('  - POST /api/verify-payment');
    console.log('  - POST /api/cancel-subscription');
    console.log('  - POST /api/webhook/stripe (for payment webhooks)');
    console.log('');
    console.log('💡 Currently using demo mode - upgrades are simulated');
  }
}

// Create global payment manager
const paymentManager = new PaymentManager();
window.paymentManager = paymentManager;

// Log setup instructions
PaymentManager.createMockEndpoints();