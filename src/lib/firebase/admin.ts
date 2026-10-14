import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  // Replace escaped newlines if passed through environment variable strings
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    app = getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export { app, adminAuth, adminDb };
