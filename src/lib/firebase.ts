import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

// Double-check config parameters from Vite environment variables prefixed with VITE_
// Auto-provisioned fallback credentials so it runs perfectly out-of-the-box without user entering anything
const PROVISIONED_FALLBACK = {
  apiKey: "AIzaSyAUzZZPs3kbHBGaZ8TvGj6MJDd6li_FZi8",
  authDomain: "ai-studio-applet-webapp-35df3.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-35df3",
  storageBucket: "ai-studio-applet-webapp-35df3.firebasestorage.app",
  messagingSenderId: "128426411314",
  appId: "1:128426411314:web:416c55df4a9ffbb5e2032b",
  databaseId: "ai-studio-89b6c064-d50f-453c-9843-a2919799e255"
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || PROVISIONED_FALLBACK.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || PROVISIONED_FALLBACK.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PROVISIONED_FALLBACK.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || PROVISIONED_FALLBACK.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || PROVISIONED_FALLBACK.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || PROVISIONED_FALLBACK.appId
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || PROVISIONED_FALLBACK.databaseId;

// Check if variables exist to activate Firebase Firestore integration
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

// Lazy initialization of Firebase to avoid crash/blocking if parameters are not yet provided
let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    console.log("🔥 Firebase Firestore initialized successfully for Sovereign Sync!");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase SDK:", error);
  }
} else {
  console.log("ℹ️ Firebase credentials not detected. Operating in standalone Offline LocalStorage Mode.");
}

export { db };

// Interface for Transaction Synchronization
export interface FirebaseTxRecord {
  tx: string;
  timestamp: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  deliveryMode: string;
  status: string;
  signature: string;
  hash: string;
  syncedAt?: any;
}

/**
 * Pushes a local peer transaction sequence to the global Firestore cloud ledger
 */
export async function pushTransactionToFirestore(tx: any): Promise<boolean> {
  if (!db) {
    // If not configured, we successfully simulate back-up locally
    return false;
  }
  try {
    const txCol = collection(db, "transactions");
    await addDoc(txCol, {
      ...tx,
      syncedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error("Firestore Upload Error:", e);
    return false;
  }
}

/**
 * Pulls all transaction listings from Firestore to audit and match offline balances
 */
export async function pullTransactionsFromFirestore(): Promise<any[]> {
  if (!db) return [];
  try {
    const txCol = collection(db, "transactions");
    const q = query(txCol, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Firestore Download Error:", e);
    return [];
  }
}
