// Authentication Modal Component

class AuthModal {
  constructor() {
    this.modal = null;
    this.isSignUp = false;
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="auth-modal" class="auth-modal" style="display: none;">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h2 class="auth-title">Sign In to Studio Buddy</h2>
            <button class="auth-close">&times;</button>
          </div>
          
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="signin">Sign In</button>
            <button class="auth-tab" data-tab="signup">Sign Up</button>
          </div>
          
          <form class="auth-form" id="auth-form">
            <div class="auth-input-group" id="name-group" style="display: none;">
              <label for="auth-name">Full Name</label>
              <input type="text" id="auth-name" placeholder="Enter your full name">
            </div>
            
            <div class="auth-input-group">
              <label for="auth-email">Email</label>
              <input type="email" id="auth-email" placeholder="Enter your email" required>
            </div>
            
            <div class="auth-input-group">
              <label for="auth-password">Password</label>
              <input type="password" id="auth-password" placeholder="Enter your password" required>
            </div>
            
            <button type="submit" class="auth-submit" id="auth-submit">Sign In</button>
            
            <div class="auth-divider">
              <span>or</span>
            </div>
            
            <button type="button" class="auth-google" id="auth-google">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
          
          <div class="auth-loading" id="auth-loading" style="display: none;">
            <div class="auth-spinner"></div>
            <p>Signing you in...</p>
          </div>
          
          <div class="auth-error" id="auth-error" style="display: none;"></div>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('auth-modal');
  }

  bindEvents() {
    // Close modal
    this.modal.querySelector('.auth-close').addEventListener('click', () => this.hide());
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });

    // Tab switching
    this.modal.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Form submission
    this.modal.querySelector('#auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Google sign in
    this.modal.querySelector('#auth-google').addEventListener('click', () => {
      this.handleGoogleSignIn();
    });
  }

  switchTab(tab) {
    this.isSignUp = tab === 'signup';
    
    // Update tab buttons
    this.modal.querySelectorAll('.auth-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update form
    const title = this.modal.querySelector('.auth-title');
    const nameGroup = this.modal.querySelector('#name-group');
    const submitBtn = this.modal.querySelector('#auth-submit');
    
    if (this.isSignUp) {
      title.textContent = 'Create Your Account';
      nameGroup.style.display = 'block';
      submitBtn.textContent = 'Create Account';
    } else {
      title.textContent = 'Sign In to Studio Buddy';
      nameGroup.style.display = 'none';
      submitBtn.textContent = 'Sign In';
    }
    
    this.clearError();
  }

  async handleSubmit() {
    const email = this.modal.querySelector('#auth-email').value;
    const password = this.modal.querySelector('#auth-password').value;
    const name = this.modal.querySelector('#auth-name').value;
    
    if (!email || !password) {
      this.showError('Please fill in all required fields');
      return;
    }
    
    if (this.isSignUp && !name) {
      this.showError('Please enter your full name');
      return;
    }
    
    this.showLoading(true);
    
    let result;
    if (this.isSignUp) {
      result = await window.authManager.signUp(email, password, name);
    } else {
      result = await window.authManager.signIn(email, password);
    }
    
    this.showLoading(false);
    
    if (result.success) {
      this.hide();
      this.clearForm();
      // Dispatch custom event for successful login
      window.dispatchEvent(new CustomEvent('userSignedIn', { detail: result.user }));
    } else {
      this.showError(result.error);
    }
  }

  async handleGoogleSignIn() {
    this.showLoading(true);
    
    const result = await window.authManager.signInWithGoogle();
    
    this.showLoading(false);
    
    if (result.success) {
      this.hide();
      window.dispatchEvent(new CustomEvent('userSignedIn', { detail: result.user }));
    } else {
      this.showError(result.error);
    }
  }

  showLoading(show) {
    const form = this.modal.querySelector('.auth-form');
    const loading = this.modal.querySelector('.auth-loading');
    
    form.style.display = show ? 'none' : 'block';
    loading.style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    const errorDiv = this.modal.querySelector('.auth-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  clearError() {
    const errorDiv = this.modal.querySelector('.auth-error');
    errorDiv.style.display = 'none';
  }

  clearForm() {
    this.modal.querySelector('#auth-form').reset();
  }

  show() {
    this.modal.style.display = 'flex';
    this.clearError();
    this.clearForm();
  }

  hide() {
    this.modal.style.display = 'none';
  }
}

// CSS styles for the modal
const authModalStyles = `
  .auth-modal {
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

  .auth-modal-content {
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
    border-radius: 0;
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    font-family: 'MS Sans Serif', sans-serif;
    font-size: 11px;
  }

  .auth-modal-header {
    background: linear-gradient(90deg, #0080ff, #004080);
    color: white;
    padding: 4px 8px;
    display: flex;
    justify-content: between;
    align-items: center;
    position: relative;
  }

  .auth-title {
    font-size: 11px;
    font-weight: bold;
    margin: 0;
    flex: 1;
  }

  .auth-close {
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

  .auth-close:hover {
    background: #d0d0d0;
  }

  .auth-close:active {
    border: 1px inset #c0c0c0;
  }

  .auth-tabs {
    display: flex;
    background: #c0c0c0;
    border-bottom: 1px solid #808080;
  }

  .auth-tab {
    flex: 1;
    padding: 6px 12px;
    background: #c0c0c0;
    border: none;
    border-right: 1px solid #808080;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
  }

  .auth-tab:last-child {
    border-right: none;
  }

  .auth-tab.active {
    background: #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: -1px;
  }

  .auth-form {
    padding: 16px;
  }

  .auth-input-group {
    margin-bottom: 12px;
  }

  .auth-input-group label {
    display: block;
    margin-bottom: 4px;
    font-weight: bold;
  }

  .auth-input-group input {
    width: 100%;
    padding: 4px;
    border: 1px inset #c0c0c0;
    background: white;
    font-family: inherit;
    font-size: 11px;
    box-sizing: border-box;
  }

  .auth-input-group input:focus {
    outline: none;
    background: #ffffcc;
  }

  .auth-submit {
    width: 100%;
    padding: 6px 12px;
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .auth-submit:hover {
    background: #d0d0d0;
  }

  .auth-submit:active {
    border: 2px inset #c0c0c0;
  }

  .auth-divider {
    text-align: center;
    margin: 16px 0;
    position: relative;
    color: #666;
  }

  .auth-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #808080;
  }

  .auth-divider span {
    background: #c0c0c0;
    padding: 0 8px;
  }

  .auth-google {
    width: 100%;
    padding: 8px 12px;
    background: white;
    border: 1px solid #ddd;
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .auth-google:hover {
    background: #f5f5f5;
  }

  .auth-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    gap: 12px;
  }

  .auth-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e0e0e0;
    border-top: 3px solid #0080ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .auth-error {
    background: #ffcccc;
    border: 1px solid #ff6666;
    padding: 8px 12px;
    margin: 0 16px 16px 16px;
    font-size: 11px;
    color: #cc0000;
  }
`;

// Add styles to page
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = authModalStyles;
  document.head.appendChild(style);
}

// Create global auth modal instance
const authModal = new AuthModal();
window.authModal = authModal;