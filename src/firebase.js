
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBgtz8VoGz8CaLx0xQ4XdZmT1Q_ojWmew",
  authDomain: "pczone-2edac.firebaseapp.com",
  projectId: "pczone-2edac",
  storageBucket: "pczone-2edac.firebasestorage.app",
  messagingSenderId: "38934693383",
  appId: "1:38934693383:web:a2f174b601118166ed4ca2",
  measurementId: "G-2C6ZVSGJ7C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
