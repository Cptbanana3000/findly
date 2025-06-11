// Test Firebase connection
require('dotenv').config();

console.log('Testing Firebase Configuration...');
console.log('Environment variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'Set' : 'Missing');
console.log('FIREBASE_AUTH_DOMAIN:', process.env.FIREBASE_AUTH_DOMAIN);

try {
  const { initializeApp } = require('firebase/app');
  const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,  
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  console.log('\nInitializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully!');
  console.log('Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:');
  console.error(error.message);
  console.error('\nCheck your .env file configuration!');
} 