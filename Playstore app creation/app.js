// Ensure this is imported at the top of app.js
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// Inside your Signup event listener:
try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    
    // THIS IS THE TRIGGER
    await sendEmailVerification(userCred.user);
    
    alert("Verification email sent! Please check your inbox (and spam folder).");
} catch (err) {
    console.error("Registration error:", err);
    alert(err.message);
}

// 1. SAVE PROFILE TO CLOUD (Call this after a successful upload or profile edit)
async function saveUserProfileToCloud(uid, data) {
    try {
        await setDoc(doc(db, "users", uid), {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("Profile synced to cloud!");
    } catch (e) {
        console.error("Sync error:", e);
    }
}

// 2. LOAD PROFILE FROM CLOUD (Call this inside initializeDashboard)
async function fetchAndRenderProfile(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Update your UI fields here
        document.getElementById("profile-client-name").textContent = data.fullName;
        document.getElementById("profile-client-id").textContent = data.clientId;
        // If you store the image URL in the DB, load it here:
        if (data.avatarUrl) {
             const avatarImg = document.getElementById("profile-avatar-img");
             if (avatarImg) avatarImg.src = data.avatarUrl;
        }
    }
}
// Add these imports to the top of your app.js
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// ... (your existing code)

// 2. REPLACE YOUR SUBMIT HANDLER WITH THIS:
authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-username").value.trim();
    
    // This sends the "OTP" (The Magic Link)
    const actionCodeSettings = {
        url: window.location.href, // This returns the user to the current page
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        alert("Success! We've sent a verification link to your email. Click it to log in.");
    } catch (err) {
        alert("Error: " + err.message);
    }
});

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
