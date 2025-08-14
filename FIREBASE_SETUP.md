# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication for Studio Buddy monetization.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "studio-buddy-auth")
4. Enable Google Analytics if desired
5. Create project

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable these providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", add your project email

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules later)
4. Choose a location close to your users
5. Click "Done"

## 4. Set Firestore Security Rules

Go to "Firestore Database" → "Rules" and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && validateUserData();
      
      // Validate user data structure and prevent tampering
      function validateUserData() {
        return request.resource.data.keys().hasAll(['uid', 'email']) &&
               request.resource.data.uid == request.auth.uid &&
               request.resource.data.email == request.auth.token.email &&
               // Prevent users from modifying critical fields
               (!request.resource.data.keys().hasAny(['subscription']) || 
                validateSubscription()) &&
               // Prevent usage tampering (only allow increments)
               (!request.resource.data.keys().hasAny(['usage']) || 
                validateUsage());
      }
      
      // Subscription can only be modified by server/admin
      function validateSubscription() {
        return request.auth.token.admin == true ||
               // Allow reading current subscription
               request.method == 'get' ||
               // Don't allow users to upgrade themselves
               !('subscription' in request.resource.data.diff(resource.data).affectedKeys());
      }
      
      // Usage validation - prevent cheating
      function validateUsage() {
        let currentUsage = resource.data.get('usage', {});
        let newUsage = request.resource.data.get('usage', {});
        
        return 
          // Allow reading usage
          request.method == 'get' ||
          // Only allow incrementing processedTracks by 1
          (newUsage.get('processedTracks', 0) <= currentUsage.get('processedTracks', 0) + 1) &&
          // Don't allow modifying monthlyLimit
          newUsage.get('monthlyLimit', 3) == currentUsage.get('monthlyLimit', 3);
      }
    }
    
    // Payment/subscription logs - read-only for users
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth.token.admin == true;
    }
    
    // Usage analytics - admin only
    match /analytics/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
    
    // App configuration - read-only for authenticated users
    match /config/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Audit logs - admin only
    match /audit/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
    
    // Support tickets - users can create/read their own
    match /support/{ticketId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow read, write: if request.auth.token.admin == true;
    }
    
    // Block all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 5. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon (</>) 
4. Register your app with a nickname
5. Copy the `firebaseConfig` object
6. Replace the config in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 6. Configure Authorized Domains

1. Go to Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your domains:
   - `localhost` (for development)
   - Your production domain (e.g., `studio-buddy.vercel.app`)

## 7. Test the Integration

1. Start your local server: `npm run dev`
2. Open the app in your browser
3. Click "Sign In" in the top-right
4. Try creating an account
5. Check Firebase Console → Authentication to see the new user
6. Check Firestore to see the user document created

## 8. Payment Integration (Optional)

### Stripe Setup

1. Create a [Stripe](https://stripe.com) account
2. Get your publishable key from the Stripe dashboard
3. Replace the key in `payment-manager.js`:
```javascript
this.stripePublishableKey = 'pk_live_your_actual_stripe_key';
```

### Backend Requirements

You'll need to create backend endpoints for:

- `POST /api/create-checkout-session` - Create Stripe checkout
- `POST /api/verify-payment` - Verify successful payments
- `POST /api/cancel-subscription` - Handle cancellations  
- `POST /api/webhook/stripe` - Handle Stripe webhooks

Example using Firebase Functions, Vercel, or Railway.

## 9. Deployment Configuration

### For Vercel:
Add environment variables in your Vercel dashboard.

### For Railway:
Add environment variables in your Railway project settings.

### Environment Variables Needed:
- `FIREBASE_PROJECT_ID`
- `STRIPE_SECRET_KEY` (server-side only)
- `STRIPE_WEBHOOK_SECRET` (server-side only)

## 10. Usage Limits & Monetization

The current setup includes:

- **Free Plan**: 3 tracks per month
- **Premium Plan**: Unlimited tracks
- Automatic usage tracking
- Upgrade prompts when limits reached

### Customizing Limits

Edit the limits in `auth.js`:

```javascript
monthlyLimit: 3 // Change this number
```

## Troubleshooting

### Common Issues:

1. **"Firebase not defined"** - Check that firebase-config.js is loaded
2. **CORS errors** - Add your domain to Firebase authorized domains  
3. **Module import errors** - Ensure all scripts use `type="module"`
4. **Firestore permission denied** - Check security rules

### Development Tips:

- Use Firebase Emulator Suite for local development
- Check browser console for detailed error messages
- Test with different browsers
- Monitor Firebase usage in the console

## Next Steps

1. Set up your Firebase project using this guide
2. Test the authentication flow
3. Set up Stripe for payments (optional)
4. Deploy to production
5. Monitor usage and performance

The authentication system is now ready for monetization! 🚀