// Session Manager for authentication and user state

class SessionManager {
  constructor() {
    this.authModal = window.authModal;
    this.isInitialized = false;
    this.userMenuOpen = false;
    this.init();
  }

  async init() {
    // Wait for dependencies to load
    const waitForDependencies = () => {
      return new Promise((resolve) => {
        const checkDependencies = () => {
          if (window.authManager && window.authModal) {
            resolve();
          } else {
            setTimeout(checkDependencies, 100);
          }
        };
        checkDependencies();
      });
    };
    
    await waitForDependencies();
    
    // Wait for auth to initialize
    await window.authManager.waitForInit();
    
    // Create user UI elements
    this.createUserInterface();
    
    // Listen for auth state changes
    window.authManager.onAuthStateChange((user) => {
      this.handleAuthStateChange(user);
    });

    // Listen for successful sign-ins
    window.addEventListener('userSignedIn', (event) => {
      this.showNotification('Successfully signed in!', 'success');
    });

    this.isInitialized = true;
  }

  createUserInterface() {
    // Create global start button handler
    window.handleStartClick = () => {
      this.handleStartButtonClick();
    };
    
    // Add authentication overlay styles
    this.addAuthStyles();
    
    // Don't lock interface - let users explore freely
    // Authentication only required when processing
  }

  addAuthStyles() {
    const styles = `
      .interface-locked {
        pointer-events: none;
        opacity: 0.5;
        filter: grayscale(50%);
      }
      
      .interface-locked .start-button {
        pointer-events: auto;
        opacity: 1;
        filter: none;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 5px rgba(255, 255, 0, 0.5); }
        50% { box-shadow: 0 0 15px rgba(255, 255, 0, 0.8); }
      }
      
      .auth-required-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        padding: 16px;
        z-index: 10000;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
        box-shadow: 4px 4px 8px rgba(0,0,0,0.3);
      }
      
      .auth-required-dialog h3 {
        margin: 0 0 8px 0;
        color: #000080;
      }
      
      .auth-required-dialog p {
        margin: 0 0 12px 0;
        color: #000;
      }
      
      .auth-required-dialog button {
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        padding: 4px 12px;
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        margin-right: 8px;
      }
      
      .auth-required-dialog button:hover {
        background: #d0d0d0;
      }
      
      .auth-required-dialog button:active {
        border: 2px inset #c0c0c0;
      }
      
      .start-menu {
        position: absolute;
        bottom: 40px;
        left: 0;
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        min-width: 200px;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
        z-index: 1001;
      }
      
      .start-menu-item {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        cursor: pointer;
        border-bottom: 1px solid #808080;
      }
      
      .start-menu-item:hover {
        background: #0080ff;
        color: white;
      }
      
      .start-menu-item:last-child {
        border-bottom: none;
      }
      
      .start-menu-icon {
        margin-right: 8px;
        font-size: 14px;
      }
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
  }

  handleStartButtonClick() {
    if (!window.authManager.isAuthenticated()) {
      // Show sign-in options
      this.showStartMenu();
    } else {
      // Show user menu for authenticated users
      this.showUserStartMenu();
    }
  }

  showStartMenu() {
    // Remove existing menu
    this.removeStartMenu();
    
    const startMenu = document.createElement('div');
    startMenu.className = 'start-menu';
    startMenu.id = 'start-menu';
    startMenu.innerHTML = `
      <div class="start-menu-item" onclick="sessionManager.authModal.show(); sessionManager.removeStartMenu();">
        <span class="start-menu-icon">🔑</span>
        Sign In
      </div>
      <div class="start-menu-item" onclick="sessionManager.authModal.show(); sessionManager.authModal.switchTab('signup'); sessionManager.removeStartMenu();">
        <span class="start-menu-icon">👤</span>
        Create Account
      </div>
      <div class="start-menu-item" onclick="sessionManager.showAuthRequiredDialog();">
        <span class="start-menu-icon">ℹ️</span>
        About Authentication
      </div>
    `;
    
    const startButton = document.getElementById('start-button');
    startButton.parentNode.appendChild(startMenu);
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', this.closeStartMenuHandler = (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
          this.removeStartMenu();
        }
      });
    }, 0);
  }

  showUserStartMenu() {
    // Remove existing menu
    this.removeStartMenu();
    
    const startMenu = document.createElement('div');
    startMenu.className = 'start-menu';
    startMenu.id = 'start-menu';
    startMenu.innerHTML = `
      <div class="start-menu-item" onclick="sessionManager.showDashboard(); sessionManager.removeStartMenu();">
        <span class="start-menu-icon">📊</span>
        Dashboard
      </div>
      <div class="start-menu-item" onclick="sessionManager.showUpgradeModal(); sessionManager.removeStartMenu();">
        <span class="start-menu-icon">⭐</span>
        Upgrade to Premium
      </div>
      <div class="start-menu-item" onclick="sessionManager.signOut(); sessionManager.removeStartMenu();">
        <span class="start-menu-icon">🚪</span>
        Sign Out
      </div>
    `;
    
    const startButton = document.getElementById('start-button');
    startButton.parentNode.appendChild(startMenu);
    
    // Close menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', this.closeStartMenuHandler = (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
          this.removeStartMenu();
        }
      });
    }, 0);
  }

  removeStartMenu() {
    const existingMenu = document.getElementById('start-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    if (this.closeStartMenuHandler) {
      document.removeEventListener('click', this.closeStartMenuHandler);
      this.closeStartMenuHandler = null;
    }
  }

  // Clean up old methods - no longer needed

  async handleAuthStateChange(user) {
    const startText = document.getElementById('start-text');
    const userStatus = document.getElementById('user-status');

    if (user) {
      // User is signed in
      const userData = await window.authManager.getUserData();
      const displayName = user.displayName || user.email.split('@')[0];
      
      startText.textContent = displayName;
      userStatus.style.display = 'inline';
      userStatus.textContent = userData?.subscription?.plan === 'premium' ? '⭐' : '👤';
      
      this.showNotification(`Welcome back, ${displayName}!`, 'success');
    } else {
      // User is signed out
      startText.textContent = 'Sign In';
      userStatus.style.display = 'none';
    }
  }

  lockInterface() {
    const mainInterface = document.querySelector('.main-interface');
    if (mainInterface) {
      mainInterface.classList.add('interface-locked');
    }
  }

  unlockInterface() {
    const mainInterface = document.querySelector('.main-interface');
    if (mainInterface) {
      mainInterface.classList.remove('interface-locked');
    }
  }

  showAuthRequiredDialog() {
    this.removeStartMenu();
    
    const dialog = document.createElement('div');
    dialog.className = 'auth-required-dialog';
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>🎵 Sign In to Process Audio</h3>
        <button class="dialog-close" onclick="this.closest('.auth-required-dialog').remove();">×</button>
      </div>
      <div class="dialog-body">
        <p>To use Studio Buddy's audio processing features, please sign in or create a free account.</p>
        
        <div class="plan-comparison">
          <div class="plan-item">
            <div class="plan-header">
              <span class="plan-icon">🆓</span>
              <strong>Free Plan</strong>
            </div>
            <div class="plan-features">
              • 3 audio tracks per month<br>
              • Basic analysis & mastering<br>
              • Standard processing speed
            </div>
          </div>
          
          <div class="plan-item premium">
            <div class="plan-header">
              <span class="plan-icon">⭐</span>
              <strong>Premium Plan</strong>
            </div>
            <div class="plan-features">
              • Unlimited audio processing<br>
              • Advanced AI features<br>
              • Priority processing speed<br>
              • Export in multiple formats
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-primary" onclick="window.sessionManager.authModal.show(); this.closest('.auth-required-dialog').remove();">
          Sign In
        </button>
        <button class="btn btn-secondary" onclick="window.sessionManager.authModal.show(); window.sessionManager.authModal.switchTab('signup'); this.closest('.auth-required-dialog').remove();">
          Create Free Account
        </button>
        <button class="btn btn-tertiary" onclick="this.closest('.auth-required-dialog').remove();">
          Continue Browsing
        </button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (dialog.parentNode) {
        dialog.remove();
      }
    }, 30000);
  }

  async signOut() {
    const result = await window.authManager.signOut();
    if (result.success) {
      this.showNotification('Successfully signed out', 'success');
    } else {
      this.showNotification('Error signing out: ' + result.error, 'error');
    }
  }

  showDashboard() {
    window.userDashboard.show();
  }

  showUpgradeModal() {
    window.paymentManager.showUpgradeModal();
  }

  // Check if user can process audio (for monetization)
  async canUserProcess() {
    if (!window.authManager.isAuthenticated()) {
      this.showAuthRequiredDialog();
      return false;
    }
    
    const canProcess = await window.authManager.canProcessTrack();
    if (!canProcess) {
      this.showUpgradePrompt();
      return false;
    }
    
    return true;
  }

  // Increment usage after successful processing
  async trackUsage() {
    if (window.authManager.isAuthenticated()) {
      await window.authManager.incrementUsage();
      // Refresh user menu to show updated usage
      this.handleAuthStateChange(window.authManager.getCurrentUser());
    }
  }

  showUpgradePrompt() {
    const message = "You've reached your monthly limit of 3 tracks. Upgrade to Premium for unlimited processing!";
    this.showNotification(message, 'warning');
    
    // Show upgrade options
    setTimeout(() => {
      this.showUpgradeModal();
    }, 2000);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '60px',
      right: '16px',
      background: type === 'error' ? '#ffcccc' : type === 'warning' ? '#ffffcc' : type === 'success' ? '#ccffcc' : '#ccccff',
      border: `2px outset ${type === 'error' ? '#ff6666' : type === 'warning' ? '#ffcc00' : type === 'success' ? '#00cc00' : '#0066cc'}`,
      color: type === 'error' ? '#cc0000' : type === 'warning' ? '#cc6600' : type === 'success' ? '#006600' : '#000066',
      padding: '8px 12px',
      maxWidth: '300px',
      zIndex: '10002',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '11px',
      wordWrap: 'break-word'
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Public method to check authentication before processing
  async requireAuth() {
    return await this.canUserProcess();
  }

  // Public method to track usage after processing
  async recordUsage() {
    return await this.trackUsage();
  }
}

// Create global session manager
const sessionManager = new SessionManager();
window.sessionManager = sessionManager;