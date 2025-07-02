import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // You'll need to replace these with your actual Firebase config
  apiKey: "AIzaSyCOiFIBRrX7fpgu5ymNSxo8E_FeqzEOacg",
  authDomain: "invoicepro-8552b.firebaseapp.com",
  projectId: "invoicepro-8552b",
  storageBucket: "invoicepro-8552b.firebasestorage.app",
  messagingSenderId: "764582750732",
  appId: "1:764582750732:web:3f592edc7959017b93dc29"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
