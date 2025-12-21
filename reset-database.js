const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpmartgW9gogPjz60wIVdTRlFNEec0QJo",
  authDomain: "cashflow-d07b5.firebaseapp.com",
  projectId: "cashflow-d07b5",
  storageBucket: "cashflow-d07b5.firebasestorage.app",
  messagingSenderId: "491355699088",
  appId: "1:491355699088:web:bcc04ef2120fa5b2186515"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetDatabase() {
  console.log('Starting database reset...');

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));

    if (usersSnapshot.empty) {
      console.log('No users found. Database is already empty.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} user(s) to delete...`);

    // Delete each user and all their subcollections
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Deleting user: ${userId}`);

      // Delete transactions subcollection
      const transactionsSnapshot = await getDocs(collection(db, 'users', userId, 'transactions'));
      for (const transactionDoc of transactionsSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userId, 'transactions', transactionDoc.id));
      }
      console.log(`  Deleted ${transactionsSnapshot.size} transactions`);

      // Delete categories subcollection
      const categoriesSnapshot = await getDocs(collection(db, 'users', userId, 'categories'));
      for (const categoryDoc of categoriesSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userId, 'categories', categoryDoc.id));
      }
      console.log(`  Deleted ${categoriesSnapshot.size} categories`);

      // Delete the user document
      await deleteDoc(doc(db, 'users', userId));
    }

    console.log('✅ Database reset successfully!');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

resetDatabase();