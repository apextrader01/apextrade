import { auth, db } from './firebase-init.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// --- 1. AUTH STATE MONITOR ---
onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById("auth-container");
    const desktopWrapper = document.querySelector(".desktop-wrapper");

    if (user) {
        // Check if verified
        if (!user.emailVerified) {
            alert("Please verify your email address to access the terminal.");
            await signOut(auth);
            return;
        }
        authContainer?.classList.add("hidden");
        desktopWrapper?.classList.remove("hidden");
        await fetchAndRenderProfile(user.uid);
    } else {
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");
    }
});

// --- 2. SIGNUP LOGIC (With Email Verification & Firestore Sync) ---
document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    const fullName = document.getElementById("auth-fullname")?.value.trim() || "Trader";
    
    // Check if mode is Signup (detects if name field is visible)
    const isSignup = !document.getElementById("auth-fullname").parentElement.classList.contains("hidden");

    try {
        if (isSignup) {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCred.user);
            
            // Sync Profile to Firestore
            await setDoc(doc(db, "users", userCred.user.uid), {
                fullName: fullName,
                clientId: fullName.substring(0, 2).toUpperCase() + "02X",
                email: email,
                updatedAt: new Date().toISOString()
            });
            alert("Verification email sent! Check your inbox.");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (err) { alert(err.message); }
});

// --- 3. CLOUD PROFILE SYNC ---
async function fetchAndRenderProfile(uid) {
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("profile-client-name").textContent = data.fullName;
            document.getElementById("profile-client-id").textContent = data.clientId;
        }
    } catch (e) {
        console.error("Profile load error:", e);
    }
}
// 3. ADD THIS FUNCTION TO THE BOTTOM OF app.js
// This automatically logs them in when they click the link in their email
window.addEventListener('DOMContentLoaded', async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) email = window.prompt('Please confirm your email address to log in');
        
        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            alert("Login successful!");
        } catch (err) {
            alert("Error logging in with link: " + err.message);
        }
    }
});
