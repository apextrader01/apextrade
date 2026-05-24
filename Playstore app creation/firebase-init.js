import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAH6axbLrzbC9nsZcd0YGXZYRiKGJ2IjDE", 
  authDomain: "apextrade-live.firebaseapp.com",
  projectId: "apextrade-live",
  storageBucket: "apextrade-live.appspot.com",
  messagingSenderId: "192611180862",
  appId: "1:192611180862:web:f6f306d3886cea95ec0c6f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
