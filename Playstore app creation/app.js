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
