// firebase-config.js
// ====================
// Firebase configuration for SparkDeck.
//
// IMPORTANT: You must fill in YOUR values below.
// These values come from the Firebase Console:
//   1. Go to https://console.firebase.google.com
//   2. Select your project → gear icon → Project settings
//   3. Scroll to "Your apps" → Web app → copy each value
//
// NOTE: Firebase config values are PUBLIC identifiers, not secrets.
// They identify your Firebase project but don't grant access by themselves.
// Security is enforced by Firebase Security Rules and server-side token verification.
// It is safe for these to be in your frontend code.

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth available globally
const auth = firebase.auth();
