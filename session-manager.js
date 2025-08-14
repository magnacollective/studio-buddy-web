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
      console.log('🖱️ Start button clicked!');
      console.log('🔍 Session manager initialized:', this.isInitialized);
      console.log('🔍 Auth modal available:', !!window.authModal);
      console.log('🔍 Auth manager available:', !!window.authManager);
      this.handleStartButtonClick();
    };
    
    // Add authentication overlay styles
    this.addAuthStyles();
    
    // Don't lock interface - let users explore freely
    // Authentication only required when processing
    
    console.log('✅ Session manager user interface created');
  }

  addAuthStyles() {
    // Authentication and start menu styles are now in styles.css for better compatibility
    console.log('✅ Auth styles loaded from main CSS file');
  }

  handleStartButtonClick() {
    console.log('📋 Processing start button click...');
    console.log('🔍 Auth manager exists:', !!window.authManager);
    
    if (!window.authManager) {
      console.error('❌ Auth manager not available!');
      alert('Authentication system not ready. Please refresh the page.');
      return;
    }
    
    const isAuthenticated = window.authManager.isAuthenticated();
    console.log('🔍 User authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('👤 Showing start menu for unauthenticated user');
      // Show sign-in options
      this.showStartMenu();
    } else {
      console.log('👤 Showing user menu for authenticated user');
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
      <div class="start-menu-section">
        <div class="start-menu-header">Account</div>
        <div class="start-menu-item" onclick="window.sessionManager.authModal.show(); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🔑</span>
          Sign In
        </div>
        <div class="start-menu-item" onclick="window.sessionManager.authModal.show(); window.sessionManager.authModal.switchTab('signup'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">👤</span>
          Create Free Account
        </div>
      </div>
      <div class="start-menu-divider"></div>
      <div class="start-menu-section">
        <div class="start-menu-header">Features</div>
        <div class="start-menu-item" onclick="openWindow('audio-mastering'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🎛️</span>
          Audio Mastering
        </div>
        <div class="start-menu-item" onclick="openWindow('audio-analysis'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">📊</span>
          Audio Analysis
        </div>
        <div class="start-menu-item" onclick="openWindow('vocal-remover'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🎤</span>
          Vocal Remover
        </div>
        <div class="start-menu-item" onclick="openWindow('lyrics-generator'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">✍️</span>
          AI Lyrics Generator
        </div>
      </div>
      <div class="start-menu-divider"></div>
      <div class="start-menu-section">
        <div class="start-menu-item" onclick="window.sessionManager.showAuthRequiredDialog(); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">⭐</span>
          Upgrade to Premium
        </div>
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
    
    const user = window.authManager.getCurrentUser();
    const displayName = user ? (user.displayName || user.email.split('@')[0]) : 'User';
    
    const startMenu = document.createElement('div');
    startMenu.className = 'start-menu';
    startMenu.id = 'start-menu';
    startMenu.innerHTML = `
      <div class="start-menu-section">
        <div class="start-menu-header">Welcome, ${displayName}</div>
        <div class="start-menu-item" onclick="window.sessionManager.showDashboard(); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">📊</span>
          My Dashboard
        </div>
        <div class="start-menu-item" onclick="window.sessionManager.showUpgradeModal(); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">⭐</span>
          Upgrade to Premium
        </div>
      </div>
      <div class="start-menu-divider"></div>
      <div class="start-menu-section">
        <div class="start-menu-header">Features</div>
        <div class="start-menu-item" onclick="openWindow('audio-mastering'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🎛️</span>
          Audio Mastering
        </div>
        <div class="start-menu-item" onclick="openWindow('audio-analysis'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">📊</span>
          Audio Analysis
        </div>
        <div class="start-menu-item" onclick="openWindow('vocal-remover'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🎤</span>
          Vocal Remover
        </div>
        <div class="start-menu-item" onclick="openWindow('lyrics-generator'); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">✍️</span>
          AI Lyrics Generator
        </div>
      </div>
      <div class="start-menu-divider"></div>
      <div class="start-menu-section">
        <div class="start-menu-item" onclick="window.sessionManager.signOut(); window.sessionManager.removeStartMenu();">
          <span class="start-menu-icon">🚪</span>
          Sign Out
        </div>
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
console.log('🚀 Initializing Session Manager...');
const sessionManager = new SessionManager();
window.sessionManager = sessionManager;
console.log('✅ Session Manager created and attached to window');