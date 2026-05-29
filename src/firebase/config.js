import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAffnTV_5E3uFRWXj927gpZOQKZVzhzsFs",
  authDomain: "atom-align-portal.firebaseapp.com",
  projectId: "atom-align-portal",
  storageBucket: "atom-align-portal.firebasestorage.app",
  messagingSenderId: "451045196529",
  appId: "1:451045196529:web:e83b9d6ecc3a4ac7295f50",
  measurementId: "G-LQ91E9YRTX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
