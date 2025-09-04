import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkw00bo9gFkfqjqm1awVD8UzlOjiaqhJo",
  authDomain: "padel-league-8a123.firebaseapp.com",
  projectId: "padel-league-8a123",
  storageBucket: "padel-league-8a123.firebasestorage.app",
  messagingSenderId: "678520318345",
  appId: "1:678520318345:web:28646097c5e3f5f134d958"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
