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
    apiKey: "AIzaSyAn83KDy0gkoxVOB8QnLF_6yQpbNID-AQA",
    authDomain: "sparkdeck-8d613.firebaseapp.com",
    projectId: "sparkdeck-8d613",
    storageBucket: "sparkdeck-8d613.firebasestorage.app",
    messagingSenderId: "469530932966",
    appId: "1:469530932966:web:13af65048f7fbc10eaed27"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth available globally
const auth = firebase.auth();
