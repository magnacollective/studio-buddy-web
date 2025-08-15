// Usage Manager for Studio Buddy Web
// Handles freemium limits, usage tracking, and UI updates

class UsageManager {
  constructor() {
    this.dailyLimits = {
      mastering: 2,
      vocal_separation: 2
    };
    this.currentUsage = {
      mastering: 0,
      vocal_separation: 0
    };
  }

  // Check if user can perform a specific operation
  async canPerformOperation(operationType) {
    try {
      console.log(`🔍 Checking if user can perform: ${operationType}`);
      
      const result = await window.authManager.canProcess(operationType);
      
      if (!result.canProcess) {
        this.showLimitExceededDialog(operationType, result);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking operation limits:', error);
      this.showErrorDialog(error.message);
      return false;
    }
  }

  // Track usage after successful operation
  async trackOperation(operationType) {
    try {
      console.log(`📊 UsageManager: Tracking usage for: ${operationType}`);
      
      if (!window.authManager || !window.authManager.trackProcessUsage) {
        console.error('❌ AuthManager or trackProcessUsage not available');
        throw new Error('Authentication manager not ready');
      }
      
      console.log('🔗 Calling authManager.trackProcessUsage...');
      const result = await window.authManager.trackProcessUsage(operationType);
      console.log('✅ TrackProcessUsage returned:', result);
      
      this.currentUsage = result.usage;
      
      // Update UI to reflect new usage
      console.log('🎨 Updating UI displays...');
      this.updateUsageDisplay();
      
      // Update desktop usage counter
      if (window.updateUsageCounter) {
        console.log('📈 Updating desktop counter...');
        console.log('📊 Usage data for counter update:', result.usage);
        setTimeout(window.updateUsageCounter, 100);
      } else {
        console.error('❌ window.updateUsageCounter not available, trying to create it...');
        // Create updateUsageCounter function if it doesn't exist
        this.createUpdateUsageCounter();
        if (window.updateUsageCounter) {
          console.log('✅ Created updateUsageCounter, calling now...');
          setTimeout(window.updateUsageCounter, 100);
        }
      }
      
      // Show success message with remaining usage
      this.showUsageUpdate(operationType, result.usage.remaining);
      
      return result;
    } catch (error) {
      console.error('❌ UsageManager: Error tracking operation:', error);
      console.error('Error details:', error.stack);
      this.showErrorDialog(error.message);
      throw error;
    }
  }

  // Show limit exceeded dialog
  showLimitExceededDialog(operationType, limitInfo) {
    const modal = this.createLimitModal(operationType, limitInfo);
    document.body.appendChild(modal);
  }

  // Create limit exceeded modal
  createLimitModal(operationType, limitInfo) {
    const modal = document.createElement('div');
    modal.className = 'limit-modal';
    modal.innerHTML = `
      <div class="limit-modal-content">
        <div class="limit-modal-header">
          <h2>Daily Limit Reached</h2>
          <button class="limit-close">&times;</button>
        </div>
        
        <div class="limit-modal-body">
          <div class="limit-icon">⏰</div>
          <h3>You've reached your daily limit</h3>
          <p>Free users can perform <strong>${this.dailyLimits[operationType]} ${this.getOperationDisplayName(operationType)}</strong> operations per day.</p>
          
          <div class="usage-breakdown">
            <div class="usage-item">
              <span class="usage-label">Mastering:</span>
              <span class="usage-count">${limitInfo.usage?.mastering || 0}/${this.dailyLimits.mastering}</span>
              <span class="usage-remaining">(${limitInfo.usage?.remaining?.mastering || 0} remaining)</span>
            </div>
            <div class="usage-item">
              <span class="usage-label">Vocal Separation:</span>
              <span class="usage-count">${limitInfo.usage?.vocal_separation || 0}/${this.dailyLimits.vocal_separation}</span>
              <span class="usage-remaining">(${limitInfo.usage?.remaining?.vocal_separation || 0} remaining)</span>
            </div>
          </div>
          
          <div class="reset-info">
            <p>Your limits reset daily at midnight UTC.</p>
            ${limitInfo.resetTime ? `<p>Next reset: ${new Date(limitInfo.resetTime).toLocaleString()}</p>` : ''}
          </div>
          
          <div class="upgrade-prompt">
            <h4>Want unlimited access?</h4>
            <p>Upgrade to Premium for unlimited mastering and vocal separation.</p>
            <button class="upgrade-btn" onclick="this.closest('.limit-modal').remove(); window.sessionManager.showUpgradeModal();">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addLimitModalStyles(modal);

    // Bind events
    modal.querySelector('.limit-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  }

  // Add styles for limit modal
  addLimitModalStyles(modal) {
    const styles = `
      .limit-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10002;
        backdrop-filter: blur(4px);
      }

      .limit-modal-content {
        background: #c0c0c0;
        border: 2px outset #c0c0c0;
        width: 90%;
        max-width: 500px;
        font-family: 'MS Sans Serif', sans-serif;
        font-size: 11px;
      }

      .limit-modal-header {
        background: linear-gradient(90deg, #ff6600, #ff8800);
        color: white;
        padding: 6px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .limit-modal-header h2 {
        margin: 0;
        font-size: 12px;
        font-weight: bold;
      }

      .limit-close {
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

      .limit-modal-body {
        padding: 20px;
        text-align: center;
      }

      .limit-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .usage-breakdown {
        background: #e0e0e0;
        border: 1px inset #c0c0c0;
        padding: 12px;
        margin: 16px 0;
        text-align: left;
      }

      .usage-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px;
        background: #f0f0f0;
        border: 1px solid #d0d0d0;
      }

      .usage-label {
        font-weight: bold;
      }

      .usage-remaining {
        color: #666;
        font-style: italic;
      }

      .reset-info {
        margin: 16px 0;
        padding: 8px;
        background: #ffffcc;
        border: 1px solid #cccc00;
        font-size: 10px;
      }

      .upgrade-prompt {
        margin-top: 16px;
        padding: 12px;
        background: #e0ffe0;
        border: 1px solid #00cc00;
      }

      .upgrade-btn {
        background: linear-gradient(90deg, #ff6600, #ff8800);
        color: white;
        border: 2px outset #ff6600;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 8px;
      }

      .upgrade-btn:hover {
        background: linear-gradient(90deg, #ff7700, #ff9900);
      }
    `;

    const style = document.createElement('style');
    style.textContent = styles;
    modal.appendChild(style);
  }

  // Get human-readable operation name
  getOperationDisplayName(operationType) {
    const names = {
      mastering: 'mastering',
      vocal_separation: 'vocal separation'
    };
    return names[operationType] || operationType;
  }

  // Show usage update notification
  showUsageUpdate(operationType, remaining) {
    const notification = document.createElement('div');
    notification.className = 'usage-notification';
    notification.innerHTML = `
      <strong>Operation completed!</strong><br>
      ${this.getOperationDisplayName(operationType)} remaining today: ${remaining[operationType]}
    `;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#ccffcc',
      border: '2px outset #00cc00',
      color: '#006600',
      padding: '12px 16px',
      maxWidth: '300px',
      zIndex: '10003',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  // Show error dialog
  showErrorDialog(message) {
    alert('Error: ' + message);
  }

  // Update usage display in UI
  async updateUsageDisplay() {
    try {
      const usageStats = await window.authManager.getUsageStats();
      
      // Update any usage indicators in the UI
      const usageElements = document.querySelectorAll('.usage-display');
      usageElements.forEach(element => {
        element.innerHTML = `
          <div>Mastering: ${usageStats.mastering}/${usageStats.limits?.mastering || 2}</div>
          <div>Vocal Separation: ${usageStats.vocal_separation}/${usageStats.limits?.vocal_separation || 2}</div>
        `;
      });
    } catch (error) {
      console.error('Error updating usage display:', error);
    }
  }

  // Wrapper for mastering operations
  async processMastering(audioData, callback) {
    if (await this.canPerformOperation('mastering')) {
      try {
        const result = await callback(audioData);
        await this.trackOperation('mastering');
        return result;
      } catch (error) {
        console.error('Mastering operation failed:', error);
        throw error;
      }
    }
    return null;
  }

  // Wrapper for vocal separation operations
  async processVocalSeparation(audioData, callback) {
    if (await this.canPerformOperation('vocal_separation')) {
      try {
        const result = await callback(audioData);
        await this.trackOperation('vocal_separation');
        return result;
      } catch (error) {
        console.error('Vocal separation operation failed:', error);
        throw error;
      }
    }
    return null;
  }

  // Create updateUsageCounter function if it doesn't exist
  createUpdateUsageCounter() {
    console.log('🛠️ Creating updateUsageCounter function...');
    
    window.updateUsageCounter = async function() {
      try {
        console.log('🔄 updateUsageCounter called (created by UsageManager)');
        
        if (!window.authManager || !window.authManager.getUsageStats) {
          console.log('⏳ Usage manager not ready yet');
          return;
        }

        const userPlan = await window.authManager.getUserPlan();
        console.log('👤 User plan:', userPlan);
        
        // Debug: Check Firebase data directly
        const userData = await window.authManager.getUserData();
        console.log('🔥 Firebase user data:', userData);
        console.log('🔥 Firebase subscription:', userData?.subscription);
        
        const usageStats = await window.authManager.getUsageStats();
        console.log('📊 Usage stats received:', usageStats);
        console.log('📊 Usage stats breakdown:', {
          mastering: usageStats.mastering,
          vocal_separation: usageStats.vocal_separation,
          remaining: usageStats.remaining,
          limits: usageStats.limits
        });
        
        // Update status indicator
        const statusElement = document.getElementById('usage-status');
        const masteringElement = document.getElementById('mastering-count');
        const vocalElement = document.getElementById('vocal-count');
        const footerElement = document.getElementById('usage-footer');

        if (!statusElement || !masteringElement || !vocalElement) {
          console.log('🔍 Usage counter elements not found');
          return;
        }

        if (userPlan === 'premium') {
          // Premium user - unlimited
          statusElement.textContent = 'PREMIUM';
          statusElement.style.background = 'rgba(255, 215, 0, 0.3)';
          statusElement.style.borderColor = '#ffd700';
          statusElement.style.color = '#ffd700';
          
          masteringElement.textContent = 'UNLIMITED';
          masteringElement.className = 'usage-item-count unlimited';
          
          vocalElement.textContent = 'UNLIMITED';
          vocalElement.className = 'usage-item-count unlimited';
          
          footerElement.textContent = '✨ Premium: Unlimited processing';
        } else {
          // Free user - show limits
          statusElement.textContent = 'FREE';
          statusElement.style.background = 'rgba(0, 255, 136, 0.2)';
          statusElement.style.borderColor = '#00ff88';
          statusElement.style.color = '#00ff88';
          
          const masteringRemaining = usageStats.remaining?.mastering || 2;
          const vocalRemaining = usageStats.remaining?.vocal_separation || 2;
          
          masteringElement.textContent = `${masteringRemaining} left`;
          masteringElement.className = 'usage-item-count';
          
          vocalElement.textContent = `${vocalRemaining} left`;
          vocalElement.className = 'usage-item-count';
          
          footerElement.textContent = `Resets daily at midnight UTC`;
        }
        
        console.log('✅ Usage counter updated successfully (by UsageManager)');
        
      } catch (error) {
        console.error('❌ Error updating usage counter:', error);
      }
    };
    
    console.log('✅ updateUsageCounter function created');
  }
}

// Create global usage manager
const usageManager = new UsageManager();
window.usageManager = usageManager;