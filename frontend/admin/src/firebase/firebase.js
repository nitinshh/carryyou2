import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyBmidnBD5hndg8aVKX5BF5178t6p3XrQRg",
  authDomain: "divine-flute.firebaseapp.com",
  projectId: "divine-flute",
  storageBucket: "divine-flute.firebasestorage.app",
  messagingSenderId: "188431071564",
  appId: "1:188431071564:web:cee022addb3885f87d37e9",
  measurementId: "G-P950W8L911"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
export { messaging, getToken, onMessage };