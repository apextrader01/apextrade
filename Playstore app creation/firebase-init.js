// firebase-init.js
// Initialize Firebase with your project configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyAH6axbLrzbC9nsZcd0YGXZYRiKGJ2IjDE",
    authDomain: "apextrade-live.firebaseapp.com",
    projectId: "apextrade-live",
    storageBucket: "apextrade-live.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "192611180862",
    measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

console.log("Firebase initialized successfully");

