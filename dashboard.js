// User Dashboard Component - Global Window Implementation

class UserDashboard {
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
              <h3 id="subscription-header">Upgrade to Premium</h3>
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
              
              <div id="premium-management" style="display: none;">
                <div style="background: #e0ffe0; padding: 12px; margin: 12px 0; border: 1px solid #00cc00;">
                  <strong>Premium Active</strong><br>
                  You have unlimited access to all Studio Buddy features!
                </div>
                <div class="premium-actions">
                  <button class="action-btn" onclick="window.paymentManager.showUpgradeModal();">
                    Manage Subscription
                  </button>
                  <button class="action-btn danger" onclick="window.paymentManager.cancelSubscription();">
                    Cancel Premium
                  </button>
                </div>
              </div>
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

      .premium-actions {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }

      .premium-actions .action-btn {
        flex: 1;
      }

      @media (max-width: 600px) {
        .usage-stats {
          flex-direction: column;
        }
        
        .action-buttons {
          flex-direction: column;
        }
        
        .premium-actions {
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
    const user = window.authManager.getCurrentUser();
    const userData = await window.authManager.getUserData();

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

    // Update subscription section based on plan
    const subscriptionHeader = document.getElementById('subscription-header');
    const upgradeBtnLarge = document.getElementById('upgrade-btn-large');
    const premiumManagement = document.getElementById('premium-management');
    
    if (plan === 'premium') {
      subscriptionHeader.textContent = 'Premium Subscription';
      upgradeBtnLarge.style.display = 'none';
      premiumManagement.style.display = 'block';
    } else {
      subscriptionHeader.textContent = 'Upgrade to Premium';
      upgradeBtnLarge.style.display = 'block';
      premiumManagement.style.display = 'none';
    }
  }

  showUpgradeModal() {
    this.hide();
    window.paymentManager.showUpgradeModal();
  }

  async resetUsage() {
    if (!confirm('Reset your monthly usage counter?\n\nThis will reset your processed tracks count to 0 for the current month.')) {
      return;
    }

    const user = window.authManager.getCurrentUser();
    if (user) {
      try {
        const userDoc = window.firebaseDB.collection('users').doc(user.uid);
        await userDoc.update({
          'usage.processedTracks': 0,
          'usage.lastReset': new Date()
        });
        
        this.showNotification('Usage counter reset successfully!', 'success');
        await this.loadUserData();
      } catch (error) {
        this.showNotification('Error resetting usage: ' + error.message, 'error');
      }
    }
  }

  async deleteAccount() {
    const confirmText = 'DELETE MY ACCOUNT';
    const userInput = prompt(`⚠️ DANGER: Account Deletion\n\nThis will permanently delete:\n• Your account and profile\n• All usage history\n• Your subscription (if any)\n\nType "${confirmText}" to confirm:`);
    
    if (userInput !== confirmText) {
      this.showNotification('Account deletion cancelled', 'info');
      return;
    }

    const user = window.authManager.getCurrentUser();
    if (user) {
      try {
        // Delete user document from Firestore
        await window.firebaseDB.collection('users').doc(user.uid).delete();
        
        // Delete the user account
        await user.delete();
        
        this.hide();
        this.showNotification('Account deleted successfully', 'success');
        
        // Reload page after account deletion
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        this.showNotification('Error deleting account: ' + error.message, 'error');
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `dashboard-notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'error' ? '#ffcccc' : type === 'success' ? '#ccffcc' : type === 'warning' ? '#ffffcc' : '#ccccff',
      border: `2px outset ${type === 'error' ? '#ff6666' : type === 'success' ? '#00cc00' : type === 'warning' ? '#ffcc00' : '#0066cc'}`,
      color: type === 'error' ? '#cc0000' : type === 'success' ? '#006600' : type === 'warning' ? '#cc6600' : '#000066',
      padding: '8px 12px',
      maxWidth: '300px',
      zIndex: '10003',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '11px',
      wordWrap: 'break-word'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }
}

// Create global dashboard instance
const userDashboard = new UserDashboard();
window.userDashboard = userDashboard;