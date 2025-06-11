// Test Firestore database operations
require('dotenv').config();

async function testFirestore() {
  try {
    console.log('Testing Firestore Database...');
    
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firestore initialized');
    
    // Test 1: Try to read from brand_analyses collection
    console.log('\n📖 Testing READ from brand_analyses...');
    const analysesRef = collection(db, 'brand_analyses');
    const analysesSnapshot = await getDocs(analysesRef);
    console.log(`✅ READ successful - Found ${analysesSnapshot.size} documents`);
    
    // Test 2: Try to write to brand_analyses collection
    console.log('\n✏️ Testing WRITE to brand_analyses...');
    const testDoc = {
      brandName: 'test-brand',
      analysis: { score: 100 },
      timestamp: new Date(),
      testDocument: true
    };
    
    const docRef = await addDoc(analysesRef, testDoc);
    console.log('✅ WRITE successful - Document ID:', docRef.id);
    
    // Test 3: Try analytics collection
    console.log('\n📊 Testing analytics collection...');
    const analyticsRef = collection(db, 'usage_analytics');
    const analyticsDoc = {
      action: 'test',
      timestamp: new Date(),
      testDocument: true
    };
    
    const analyticsDocRef = await addDoc(analyticsRef, analyticsDoc);
    console.log('✅ Analytics WRITE successful - Document ID:', analyticsDocRef.id);
    
    console.log('\n🎉 All Firestore tests passed!');
    
  } catch (error) {
    console.error('❌ Firestore test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testFirestore(); 