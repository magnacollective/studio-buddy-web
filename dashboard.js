// User Dashboard Component
import { authManager } from './auth.js';

export class UserDashboard {
  constructor() {
    this.modal = null;
    this.createDashboard();
    this.bindEvents();
  }

  createDashboard() {
    const dashboardHTML = `
      <div id="user-dashboard" class="dashboard-modal" style="display: none;">
        <div class="dashboard-content">
          <div class="dashboard-header">
            <h2 class="dashboard-title">User Dashboard</h2>
            <button class="dashboard-close">&times;</button>
          </div>
          
          <div class="dashboard-body">
            <div class="dashboard-section">
              <h3>Account Information</h3>
              <div class="account-info">
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value" id="dashboard-email">-</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Member Since:</span>
                  <span class="info-value" id="dashboard-member-since">-</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Plan:</span>
                  <span class="info-value" id="dashboard-plan">-</span>
                </div>
              </div>
            </div>
            
            <div class="dashboard-section">
              <h3>Usage Statistics</h3>
              <div class="usage-stats">
                <div class="stat-card">
                  <div class="stat-number" id="dashboard-tracks-processed">0</div>
                  <div class="stat-label">Tracks Processed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" id="dashboard-monthly-usage">0/3</div>
                  <div class="stat-label">Monthly Usage</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" id="dashboard-remaining">3</div>
                  <div class="stat-label">Remaining</div>
                </div>
              </div>
              
              <div class="usage-bar">
                <div class="usage-bar-fill" id="dashboard-usage-fill"></div>
              </div>
              <div class="usage-text" id="dashboard-usage-text">3 tracks remaining this month</div>
            </div>
            
            <div class="dashboard-section" id="upgrade-section">
              <h3>Upgrade to Premium</h3>
              <div class="premium-benefits">
                <div class="benefit-item">✓ Unlimited track processing</div>
                <div class="benefit-item">✓ Priority processing speed</div>
                <div class="benefit-item">✓ Advanced audio analysis</div>
                <div class="benefit-item">✓ Export in multiple formats</div>
                <div class="benefit-item">✓ Premium support</div>
              </div>
              <button class="upgrade-btn-large" id="upgrade-btn-large">
                Upgrade to Premium - $9.99/month
              </button>
            </div>
            
            <div class="dashboard-section">
              <h3>Account Actions</h3>
              <div class="action-buttons">
                <button class="action-btn" id="reset-usage-btn">Reset Monthly Usage</button>
                <button class="action-btn danger" id="delete-account-btn">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    this.modal = document.getElementById('user-dashboard');
    this.addStyles();
  }

  addStyles() {
    const styles = `
      .dashboard-modal {
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

      .dashboard-content {
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
      }

      .dashboard-header {
        background: linear-gradient(90deg, #0080ff, #004080);
        color: white;
        padding: 4px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dashboard-title {
        font-size: 11px;
        font-weight: bold;
        margin: 0;
      }

      .dashboard-close {
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

      .dashboard-close:hover {
        background: #d0d0d0;
      }

      .dashboard-body {
        padding: 16px;
      }

      .dashboard-section {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #808080;
      }

      .dashboard-section:last-child {
        border-bottom: none;
      }

      .dashboard-section h3 {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: #0080ff;
        font-weight: bold;
      }

      .account-info {
        background: #e0e0e0;
        border: 1px inset #c0c0c0;
        padding: 8px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        padding: 2px 0;
      }

      .info-row:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-weight: bold;
      }

      .usage-stats {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .stat-card {
        flex: 1;
        background: #e0e0e0;
        border: 2px inset #c0c0c0;
        padding: 12px;
        text-align: center;
        min-width: 80px;
      }

      .stat-number {
        font-size: 18px;
        font-weight: bold;
        color: #0080ff;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 10px;
        color: #666;
      }

      .usage-bar {
        width: 100%;
        height: 16px;
        background: #e0e0e0;
        border: 1px inset #c0c0c0;
        margin-bottom: 8px;
        position: relative;
      }

      .usage-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #00cc00, #ffcc00, #ff6600);
        width: 0%;
        transition: width 0.5s ease;
      }

      .usage-text {
        text-align: center;
        font-size: 10px;
        color: #666;
      }

      .premium-benefits {
        background: #ffffcc;
        border: 1px solid #ffcc00;
        padding: 12px;
        margin-bottom: 12px;
      }

      .benefit-item {
        margin-bottom: 4px;
        color: #006600;
        font-weight: bold;
      }

      .benefit-item:last-child {
        margin-bottom: 0;
      }

      .upgrade-btn-large {
        width: 100%;
        padding: 12px;
        background: linear-gradient(90deg, #ff6600, #ff8800);
        color: white;
        border: 2px outset #ff6600;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
      }

      .upgrade-btn-large:hover {
        background: linear-gradient(90deg, #ff7700, #ff9900);
      }

      .upgrade-btn-large:active {
        border: 2px inset #ff6600;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .action-btn {
        padding: 6px 12px;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        flex: 1;
      }

      .action-btn:hover {
        background: #d0d0d0;
      }

      .action-btn:active {
        border: 2px inset #c0c0c0;
      }

      .action-btn.danger {
        background: #ff6666;
        border: 2px outset #ff6666;
        color: white;
      }

      .action-btn.danger:hover {
        background: #ff7777;
      }

      .action-btn.danger:active {
        border: 2px inset #ff6666;
      }

      @media (max-width: 600px) {
        .usage-stats {
          flex-direction: column;
        }
        
        .action-buttons {
          flex-direction: column;
        }
      }
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
  }

  bindEvents() {
    // Close modal
    this.modal.querySelector('.dashboard-close').addEventListener('click', () => this.hide());
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });

    // Upgrade button
    this.modal.querySelector('#upgrade-btn-large').addEventListener('click', () => {
      this.showUpgradeModal();
    });

    // Action buttons
    this.modal.querySelector('#reset-usage-btn').addEventListener('click', () => {
      this.resetUsage();
    });

    this.modal.querySelector('#delete-account-btn').addEventListener('click', () => {
      this.deleteAccount();
    });
  }

  async show() {
    this.modal.style.display = 'flex';
    await this.loadUserData();
  }

  hide() {
    this.modal.style.display = 'none';
  }

  async loadUserData() {
    const user = authManager.getCurrentUser();
    const userData = await authManager.getUserData();

    if (!user || !userData) return;

    // Update account info
    document.getElementById('dashboard-email').textContent = user.email;
    document.getElementById('dashboard-member-since').textContent = 
      new Date(userData.createdAt.seconds * 1000).toLocaleDateString();

    const subscription = userData.subscription || {};
    const usage = userData.usage || {};
    
    // Update plan info
    const plan = subscription.plan || 'free';
    const planDisplay = plan === 'premium' ? 'Premium' : 'Free';
    document.getElementById('dashboard-plan').textContent = planDisplay;
    document.getElementById('dashboard-plan').style.color = plan === 'premium' ? '#ff6600' : '#0080ff';

    // Update usage stats
    const processedTracks = usage.processedTracks || 0;
    const monthlyLimit = plan === 'premium' ? Infinity : (usage.monthlyLimit || 3);
    const remaining = plan === 'premium' ? '∞' : Math.max(0, monthlyLimit - processedTracks);

    document.getElementById('dashboard-tracks-processed').textContent = processedTracks;
    
    if (plan === 'premium') {
      document.getElementById('dashboard-monthly-usage').textContent = `${processedTracks}/∞`;
      document.getElementById('dashboard-remaining').textContent = '∞';
      document.getElementById('dashboard-usage-text').textContent = 'Unlimited tracks available';
    } else {
      document.getElementById('dashboard-monthly-usage').textContent = `${processedTracks}/${monthlyLimit}`;
      document.getElementById('dashboard-remaining').textContent = remaining;
      document.getElementById('dashboard-usage-text').textContent = `${remaining} tracks remaining this month`;
    }

    // Update usage bar
    const usagePercentage = plan === 'premium' ? 100 : (processedTracks / monthlyLimit) * 100;
    document.getElementById('dashboard-usage-fill').style.width = Math.min(usagePercentage, 100) + '%';

    // Show/hide upgrade section
    const upgradeSection = document.getElementById('upgrade-section');
    upgradeSection.style.display = plan === 'premium' ? 'none' : 'block';
  }

  showUpgradeModal() {
    // This would integrate with payment system
    alert('Payment integration coming soon! This would redirect to Stripe/payment processor.');
    this.hide();
  }

  async resetUsage() {
    if (!confirm('Reset monthly usage counter? This is for testing purposes only.')) {
      return;
    }

    // This would normally be restricted to admins or have proper validation
    const user = authManager.getCurrentUser();
    if (user) {
      try {
        const userDoc = doc(db, 'users', user.uid);
        await updateDoc(userDoc, {
          'usage.processedTracks': 0
        });
        
        alert('Usage counter reset successfully!');
        await this.loadUserData();
      } catch (error) {
        alert('Error resetting usage: ' + error.message);
      }
    }
  }

  async deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    // This would normally involve backend cleanup
    alert('Account deletion feature coming soon! This would require backend integration for secure deletion.');
  }
}

// Create global dashboard instance
export const userDashboard = new UserDashboard();
export default userDashboard;