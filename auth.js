// Authentication module - using global Firebase objects

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.isInitialized = false;
    this.init();
  }

  init() {
    // Wait for Firebase to be available
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged(async (user) => {
          this.currentUser = user;
          if (user) {
            await this.ensureUserDocument(user);
          }
          this.isInitialized = true;
          this.notifyListeners(user);
        });
      } else {
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
    this.authListeners.forEach(callback => callback(user));
  }

  // Create user document in Firestore
  async ensureUserDocument(user) {
    const userDoc = window.firebaseDB.collection('users').doc(user.uid);
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
    
    const userDoc = window.firebaseDB.collection('users').doc(this.currentUser.uid);
    const docSnap = await userDoc.get();
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

  // Increment usage counter
  async incrementUsage() {
    if (!this.currentUser) return false;
    
    try {
      const userData = await this.getUserData();
      const newCount = (userData.usage?.processedTracks || 0) + 1;
      
      const userDoc = window.firebaseDB.collection('users').doc(this.currentUser.uid);
      await userDoc.update({
        'usage.processedTracks': newCount
      });
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  // Check if user can process more tracks
  async canProcessTrack() {
    if (!this.currentUser) return false;
    
    const userData = await this.getUserData();
    const subscription = userData.subscription || {};
    const usage = userData.usage || {};
    
    // Premium users have unlimited access
    if (subscription.plan === 'premium' && subscription.status === 'active') {
      return true;
    }
    
    // Free users have monthly limit
    const monthlyLimit = usage.monthlyLimit || 3;
    const processedTracks = usage.processedTracks || 0;
    
    return processedTracks < monthlyLimit;
  }
}

// Create global auth manager instance
const authManager = new AuthManager();
window.authManager = authManager;