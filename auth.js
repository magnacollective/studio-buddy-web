// Authentication module - using global Firebase objects

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isInitialized = false;
    this.init();
  }

  init() {
    console.log('🚀 AuthManager initializing...');
    // Wait for Firebase to be available
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        console.log('✅ Firebase available, setting up auth state listener');
        window.firebaseAuth.onAuthStateChanged(async (user) => {
          console.log('🔥 Firebase auth state changed:', user ? `User: ${user.email}` : 'No user');
          this.currentUser = user;
          if (user) {
            console.log('👤 Ensuring user document for:', user.email);
            await this.ensureUserDocument(user);
          }
          this.isInitialized = true;
          console.log('📢 Notifying', this.authListeners.length, 'listeners');
          this.notifyListeners(user);
        });
      } else {
        console.log('⏳ Firebase not ready, checking again...');
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  }

  // Wait for auth to initialize
  async waitForInit() {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve();
      } else {
        const unsubscribe = this.onAuthStateChange(() => {
          unsubscribe();
          resolve();
        });
      }
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(user) {
    console.log('📣 Notifying auth listeners:', this.authListeners.length);
    this.authListeners.forEach((callback, index) => {
      console.log(`📞 Calling listener ${index + 1}`);
      try {
        callback(user);
      } catch (error) {
        console.error('❌ Error in auth listener:', error);
      }
    });
  }

  // Create user document in Firestore
  async ensureUserDocument(user) {
    console.log('🔧 Creating/checking user document for:', user.uid, user.email);
    console.log('🔧 Firebase auth current user:', window.firebaseAuth.currentUser?.email);
    console.log('🔧 Auth token available:', !!window.firebaseAuth.currentUser?.accessToken);
    
    const userDoc = window.firebaseDB.collection('users').doc(user.uid);
    console.log('🔧 Attempting Firestore read...');
    const docSnap = await userDoc.get();
    
    if (!docSnap.exists) {
      await userDoc.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: null
        },
        usage: {
          processedTracks: 0,
          monthlyLimit: 3 // Free tier limit
        }
      });
    }
  }

  // Sign up with email and password
  async signUp(email, password, displayName) {
    try {
      const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await window.firebaseAuth.signInWithPopup(provider);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      await window.firebaseAuth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user data from Firestore
  async getUserData() {
    if (!this.currentUser) return null;
    
    console.log('🔧 Getting user data for:', this.currentUser.uid, this.currentUser.email);
    console.log('🔧 Current auth user:', window.firebaseAuth.currentUser?.email);
    console.log('🔧 Auth state:', window.firebaseAuth.currentUser ? 'authenticated' : 'not authenticated');
    
    const userDoc = window.firebaseDB.collection('users').doc(this.currentUser.uid);
    console.log('🔧 Attempting user data read...');
    const docSnap = await userDoc.get();
    console.log('🔧 Document exists:', docSnap.exists);
    return docSnap.exists ? docSnap.data() : null;
  }

  // Update user subscription
  async updateSubscription(plan, status, expiresAt = null) {
    if (!this.currentUser) return false;
    
    try {
      const userDoc = window.firebaseDB.collection('users').doc(this.currentUser.uid);
      await userDoc.update({
        'subscription.plan': plan,
        'subscription.status': status,
        'subscription.expiresAt': expiresAt
      });
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  }

  // Track usage for specific process types (mastering or vocal_separation)
  async trackProcessUsage(processType) {
    try {
      const userId = this.currentUser ? this.currentUser.uid : null;
      const sessionId = this.getSessionId();
      
      console.log('🎯 AuthManager: trackProcessUsage called');
      console.log('📋 Process type:', processType);
      console.log('👤 User ID:', userId);
      console.log('🆔 Session ID:', sessionId);
      
      const requestBody = {
        processType: processType,
        userId: userId,
        sessionId: sessionId
      };
      
      console.log('📤 Sending request to /api/track-usage:', requestBody);
      
      const response = await fetch('/api/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error response:', error);
        if (response.status === 429) {
          throw new Error(`Daily limit exceeded for ${processType}. You can process ${error.limit} ${processType} operations per day. Try again tomorrow.`);
        }
        throw new Error(error.error || 'Failed to track usage');
      }
      
      const result = await response.json();
      console.log('✅ API success response:', result);
      return result;
    } catch (error) {
      console.error('❌ AuthManager: Error tracking usage:', error);
      throw error;
    }
  }
  
  // Legacy method for backward compatibility
  async incrementUsage() {
    try {
      await this.trackProcessUsage('mastering');
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  // Check if user can process specific operation type
  async canProcess(processType) {
    try {
      const userId = this.currentUser ? this.currentUser.uid : null;
      const sessionId = this.getSessionId();
      const userPlan = await this.getUserPlan();
      
      const response = await fetch('/api/check-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processType: processType,
          userId: userId,
          sessionId: sessionId,
          userPlan: userPlan
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check limits');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking process limits:', error);
      return { canProcess: false, error: error.message };
    }
  }
  
  // Legacy method for backward compatibility
  async canProcessTrack() {
    const result = await this.canProcess('mastering');
    return result.canProcess;
  }
  
  // Get or create session ID for anonymous users
  getSessionId() {
    let sessionId = localStorage.getItem('studio_buddy_session_id');
    if (!sessionId) {
      sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('studio_buddy_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Get user plan
  async getUserPlan() {
    if (!this.currentUser) return 'free';
    
    try {
      const userData = await this.getUserData();
      const subscription = userData?.subscription || {};
      return (subscription.plan === 'premium' && subscription.status === 'active') ? 'premium' : 'free';
    } catch (error) {
      console.error('Error getting user plan:', error);
      return 'free';
    }
  }
  
  // Get current usage stats for display
  async getUsageStats() {
    try {
      const userId = this.currentUser ? this.currentUser.uid : null;
      const sessionId = this.getSessionId();
      const userPlan = await this.getUserPlan();
      
      console.log('📡 Calling check-limits API with:', {
        processType: 'mastering',
        userId: userId,
        sessionId: sessionId,
        userPlan: userPlan
      });
      
      const response = await fetch('/api/check-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processType: 'mastering', // Get stats for any type
          userId: userId,
          sessionId: sessionId,
          userPlan: userPlan
        })
      });
      
      console.log('📡 Check-limits API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 Check-limits API result:', result);
        return result.usage || {};
      } else {
        const errorText = await response.text();
        console.error('📡 Check-limits API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error getting usage stats:', error);
    }
    
    return {
      mastering: 0,
      vocal_separation: 0,
      limits: { mastering: 2, vocal_separation: 2 },
      remaining: { mastering: 2, vocal_separation: 2 }
    };
  }
}

// Create global auth manager instance
const authManager = new AuthManager();
window.authManager = authManager;