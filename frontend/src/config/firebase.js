import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMjunwLhERG7VrDcNAy9Gxohj0I3yaOVU",
  authDomain: "portfolio-manager-1b772.firebaseapp.com",
  projectId: "portfolio-manager-1b772",
  storageBucket: "portfolio-manager-1b772.firebasestorage.app",
  messagingSenderId: "120363367294",
  appId: "1:120363367294:web:cbee341f2c7d79fc8dd12f",
  measurementId: "G-P9JTG955VT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
