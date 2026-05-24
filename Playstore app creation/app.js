import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// --- AUTH STATE MONITOR ---
onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById("auth-container");
    const desktopWrapper = document.querySelector(".desktop-wrapper");

    if (user) {
        authContainer?.classList.add("hidden");
        desktopWrapper?.classList.remove("hidden");
        // Load cloud profile
        await loadUserProfile(user.uid);
    } else {
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");
    }
});

// --- LOAD PROFILE FROM FIRESTORE ---
async function loadUserProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("profile-client-name").textContent = data.fullName;
            document.getElementById("profile-client-id").textContent = data.clientId;
            // Add other fields as needed
        } else {
            console.log("No profile found, initializing new user...");
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

// --- SIGNUP LOGIC (Saves to Firestore) ---
document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-username").value;
    const password = document.getElementById("auth-password").value;
    const fullName = document.getElementById("auth-fullname")?.value || "Trader";
    
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Save the profile to Firestore immediately
        await setDoc(doc(db, "users", userCred.user.uid), {
            fullName: fullName,
            clientId: fullName.substring(0, 2).toUpperCase() + "02X",
            email: email
        });
    } catch (err) { alert(err.message); }
});

// --- LOGOUT ---
document.getElementById("logout-btn")?.addEventListener("click", () => signOut(auth));
