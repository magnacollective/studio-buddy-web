// Payment Manager for subscription handling
import { authManager } from './auth.js';

export class PaymentManager {
  constructor() {
    this.stripePublishableKey = 'pk_test_your_stripe_publishable_key'; // Replace with actual key
    this.stripe = null;
    this.isInitialized = false;
    this.init();
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
      this.stripe = Stripe(this.stripePublishableKey);
      this.isInitialized = true;
      console.log('✅ Stripe initialized successfully');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
    }
  }

  // Create checkout session for premium subscription
  async createPremiumCheckout() {
    if (!authManager.isAuthenticated()) {
      throw new Error('User must be authenticated to subscribe');
    }

    try {
      const user = authManager.getCurrentUser();
      
      // This would normally call your backend API to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          priceId: 'price_premium_monthly', // Your Stripe price ID
          userId: user.uid,
          email: user.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
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
      throw error;
    }
  }

  // Handle successful payment (webhook would typically handle this)
  async handlePaymentSuccess(sessionId) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) return false;

      // Verify the payment with your backend
      const response = await fetch('/api/verify-payment', {
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
        await authManager.updateSubscription('premium', 'active', null);
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
    if (!authManager.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }

    try {
      const user = authManager.getCurrentUser();
      
      const response = await fetch('/api/cancel-subscription', {
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
              <div class="secure-payment">🔒 Secure payment powered by Stripe</div>
              <div class="trial-info">7-day free trial • Cancel anytime</div>
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
        
        await this.createPremiumCheckout();
      } catch (error) {
        alert('Error starting checkout: ' + error.message);
        modal.querySelector('#subscribe-btn').textContent = 'Subscribe Now';
        modal.querySelector('#subscribe-btn').disabled = false;
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

  // Mock backend endpoints for development
  static createMockEndpoints() {
    // This would be replaced with actual backend implementation
    console.log('🚀 Payment system ready for backend integration');
    console.log('📋 Required backend endpoints:');
    console.log('  - POST /api/create-checkout-session');
    console.log('  - POST /api/verify-payment');
    console.log('  - POST /api/cancel-subscription');
    console.log('  - POST /api/webhook/stripe (for payment webhooks)');
  }
}

// Create global payment manager
export const paymentManager = new PaymentManager();

// Log setup instructions
PaymentManager.createMockEndpoints();

export default paymentManager;