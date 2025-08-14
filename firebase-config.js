// Firebase configuration - using global Firebase object from CDN

// Your Firebase config - replace with your actual config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOsetq5Os3LbCDj3GhpJAmhzy0VCGX-ic",
  authDomain: "studio-buddy-478d5.firebaseapp.com",
  databaseURL: "https://studio-buddy-478d5-default-rtdb.firebaseio.com",
  projectId: "studio-buddy-478d5",
  storageBucket: "studio-buddy-478d5.firebasestorage.app",
  messagingSenderId: "1014923433141",
  appId: "1:1014923433141:web:ad852759e36fa44fc31afc",
  measurementId: "G-R981DMRVM5"
};

// Initialize Firebase using global objects
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = firebase.auth();

// Initialize Cloud Firestore and get a reference to the service  
const db = firebase.firestore();

// Export for use in other modules
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseApp = app;