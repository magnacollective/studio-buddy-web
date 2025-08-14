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
    console.log('📋 Setting up auth state change listener...');
    const unsubscribe = window.authManager.onAuthStateChange((user) => {
      console.log('🔄 SessionManager received auth state change:', user ? user.email : 'signed out');
      this.handleAuthStateChange(user);
    });
    console.log('✅ Auth state listener registered');

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

    // Create global openWindow function that works with all apps
    window.openWindow = (windowType) => {
      console.log('🚪 Opening window:', windowType);
      
      // Map window types to their actual window IDs
      const windowMap = {
        'audio-mastering': 'studio-buddy-window',
        'audio-analysis': 'analyzer-window', 
        'vocal-remover': 'vocal-remover-window',
        'lyrics-generator': 'lyrics-generator-window',
        'settings': 'settings-window',
        'studio-buddy': 'studio-buddy-window',
        'analyzer': 'analyzer-window'
      };
      
      const windowId = windowMap[windowType] || windowType + '-window';
      const windowElement = document.getElementById(windowId);
      
      if (windowElement) {
        // Show the window
        windowElement.style.display = 'flex';
        windowElement.style.position = 'fixed';
        
        // Position windows in cascade style if multiple are open
        const openWindows = document.querySelectorAll('.window[style*="flex"]').length;
        const offset = openWindows * 30;
        windowElement.style.left = (50 + offset) + 'px';
        windowElement.style.top = (50 + offset) + 'px';
        windowElement.style.zIndex = 1000 + openWindows;
        
        console.log('✅ Window opened:', windowId);
        
        // If script.js windowManager exists, use it for additional functionality
        if (window.windowManager && typeof window.windowManager.bringToFront === 'function') {
          window.windowManager.bringToFront(windowElement);
          window.windowManager.addTaskButton(windowType);
          window.windowManager.setActiveWindow(windowType);
        }
      } else {
        console.warn('❌ Window element not found:', windowId);
        alert(`${windowType} feature is not available in this view. Please use the main interface.`);
      }
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

    console.log('🔄 Auth state changed:', user ? 'User signed in' : 'User signed out');

    if (user) {
      // User is signed in
      const userData = await window.authManager.getUserData();
      const displayName = user.displayName || user.email.split('@')[0];
      
      startText.textContent = displayName;
      userStatus.style.display = 'inline';
      userStatus.textContent = userData?.subscription?.plan === 'premium' ? '⭐' : '👤';
      
      // Update the start menu to show user menu
      this.updateStartMenuForUser(user, userData);
      
      this.showNotification(`Welcome back, ${displayName}!`, 'success');
    } else {
      // User is signed out
      startText.textContent = 'Sign In';
      userStatus.style.display = 'none';
      
      // Update the start menu to show sign-in menu
      this.updateStartMenuForGuest();
    }
  }

  updateStartMenuForUser(user, userData) {
    console.log('📝 Updating start menu for authenticated user');
    const startMenu = document.getElementById('start-menu');
    if (!startMenu) return;

    const displayName = user.displayName || user.email.split('@')[0];
    const isPremium = userData?.subscription?.plan === 'premium';

    startMenu.innerHTML = `
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-header" style="background: #e0e0e0; padding: 4px 12px; font-weight: bold; color: #000080; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #808080; margin-bottom: 2px;">Welcome, ${displayName}</div>
        <div class="start-menu-item" id="dashboard-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">📊</span>
          My Dashboard
        </div>
        <div class="start-menu-item" id="upgrade-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">${isPremium ? '⭐' : '⬆️'}</span>
          ${isPremium ? 'Premium Account' : 'Upgrade to Premium'}
        </div>
      </div>
      <div class="start-menu-divider" style="height: 1px; background: #808080; margin: 4px 8px;"></div>
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-header" style="background: #e0e0e0; padding: 4px 12px; font-weight: bold; color: #000080; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #808080; margin-bottom: 2px;">Features</div>
        <div class="start-menu-item" data-window="audio-mastering" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🎛️</span>
          Audio Mastering
        </div>
        <div class="start-menu-item" data-window="audio-analysis" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">📊</span>
          Audio Analysis
        </div>
        <div class="start-menu-item" data-window="vocal-remover" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🎤</span>
          Vocal Remover
        </div>
        <div class="start-menu-item" data-window="lyrics-generator" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">✍️</span>
          AI Lyrics Generator
        </div>
      </div>
      <div class="start-menu-divider" style="height: 1px; background: #808080; margin: 4px 8px;"></div>
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-item" id="signout-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🚪</span>
          Sign Out
        </div>
      </div>
    `;

    // Re-attach event handlers after updating innerHTML
    this.attachUserMenuHandlers();
  }

  updateStartMenuForGuest() {
    console.log('📝 Updating start menu for guest user');
    const startMenu = document.getElementById('start-menu');
    if (!startMenu) return;

    startMenu.innerHTML = `
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-header" style="background: #e0e0e0; padding: 4px 12px; font-weight: bold; color: #000080; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #808080; margin-bottom: 2px;">Account</div>
        <div class="start-menu-item" id="signin-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🔑</span>
          Sign In
        </div>
        <div class="start-menu-item" id="signup-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">👤</span>
          Create Free Account
        </div>
      </div>
      <div class="start-menu-divider" style="height: 1px; background: #808080; margin: 4px 8px;"></div>
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-header" style="background: #e0e0e0; padding: 4px 12px; font-weight: bold; color: #000080; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #808080; margin-bottom: 2px;">Features</div>
        <div class="start-menu-item" data-window="audio-mastering" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🎛️</span>
          Audio Mastering
        </div>
        <div class="start-menu-item" data-window="audio-analysis" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">📊</span>
          Audio Analysis
        </div>
        <div class="start-menu-item" data-window="vocal-remover" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">🎤</span>
          Vocal Remover
        </div>
        <div class="start-menu-item" data-window="lyrics-generator" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">✍️</span>
          AI Lyrics Generator
        </div>
      </div>
      <div class="start-menu-divider" style="height: 1px; background: #808080; margin: 4px 8px;"></div>
      <div class="start-menu-section" style="padding: 4px 0;">
        <div class="start-menu-item" id="upgrade-item" style="display: flex; align-items: center; padding: 6px 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0080ff'; this.style.color='white'" onmouseout="this.style.background=''; this.style.color=''">
          <span class="start-menu-icon" style="margin-right: 8px; font-size: 14px; width: 18px; text-align: center;">⭐</span>
          Upgrade to Premium
        </div>
      </div>
    `;

    // Re-attach event handlers after updating innerHTML
    this.attachGuestMenuHandlers();
  }

  attachUserMenuHandlers() {
    const dashboardItem = document.getElementById('dashboard-item');
    const upgradeItem = document.getElementById('upgrade-item');
    const signoutItem = document.getElementById('signout-item');
    const startMenu = document.getElementById('start-menu');

    if (dashboardItem) {
      dashboardItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Dashboard clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        this.showDashboard();
      });
    }

    if (upgradeItem) {
      upgradeItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Upgrade clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        this.showUpgradeModal();
      });
    }

    if (signoutItem) {
      signoutItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Sign out clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        this.signOut();
      });
    }

    // Handle feature window clicks
    const featureItems = startMenu.querySelectorAll('[data-window]');
    featureItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const windowType = this.getAttribute('data-window');
        console.log('🔧 DEBUG: Opening window:', windowType);
        startMenu.style.display = 'none';
        
        if (window.openWindow) {
          window.openWindow(windowType);
        } else {
          alert(`${windowType} feature loading...`);
        }
      });
    });
  }

  attachGuestMenuHandlers() {
    const signinItem = document.getElementById('signin-item');
    const signupItem = document.getElementById('signup-item');
    const upgradeItem = document.getElementById('upgrade-item');
    const startMenu = document.getElementById('start-menu');

    if (signinItem) {
      signinItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Sign in clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        
        if (window.authModal && window.authModal.show) {
          window.authModal.show();
        } else {
          alert('Please wait for authentication system to load...');
        }
      });
    }

    if (signupItem) {
      signupItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Sign up clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        
        if (window.authModal && window.authModal.show && window.authModal.switchTab) {
          window.authModal.show();
          window.authModal.switchTab('signup');
        } else {
          alert('Please wait for authentication system to load...');
        }
      });
    }

    if (upgradeItem) {
      upgradeItem.addEventListener('click', (e) => {
        console.log('🔧 DEBUG: Upgrade clicked');
        e.stopPropagation();
        startMenu.style.display = 'none';
        alert('Premium upgrade feature coming soon!');
      });
    }

    // Handle feature window clicks
    const featureItems = startMenu.querySelectorAll('[data-window]');
    featureItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const windowType = this.getAttribute('data-window');
        console.log('🔧 DEBUG: Opening window:', windowType);
        startMenu.style.display = 'none';
        
        if (window.openWindow) {
          window.openWindow(windowType);
        } else {
          alert(`${windowType} feature loading...`);
        }
      });
    });
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