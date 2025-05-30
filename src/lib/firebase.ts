
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage'; // Added FirebaseStorage
import { FIREBASE_CONFIG } from './constants';

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage; // Added storage

if (typeof window !== 'undefined' && !getApps().length) {
  firebaseApp = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp); // Initialize storage
} else if (typeof window !== 'undefined') {
  firebaseApp = getApp();
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp); // Initialize storage
} else {
  // For server-side rendering or environments where window is not defined,
  // you might need a different initialization strategy or rely on Admin SDK.
  // For this client-focused app, we assume client-side execution.
  // Fallback to initialize if called on server (though client components should prevent this for auth/db)
  if (!getApps().length) {
     firebaseApp = initializeApp(FIREBASE_CONFIG);
  } else {
     firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp); // Initialize storage even in SSR fallback (though client uploads are typical)
}


export { firebaseApp, auth, db, storage }; // Export storage

