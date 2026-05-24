// ==========================================================================
// 1. IMPORTS & FIREBASE SETUP
// ==========================================================================
import { auth, db } from './firebase-init.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ==========================================================================
// 2. STATE & MOCK DATA
// ==========================================================================
const INSTRUMENTS_DB = [
    { symbol: "NIFTY50", name: "Nifty 50 Index", price: 22530.70, change: 0.45 },
    { symbol: "BANKNIFTY", name: "Nifty Bank Index", price: 48923.55, change: -0.12 },
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 205.20, change: -1.62 },
    { symbol: "WIPRO",     name: "Wipro Ltd.", price: 202.97, change: 0.15 },
    { symbol: "GAIL",      name: "GAIL India Ltd.", price: 160.77, change: 1.12 },
    { symbol: "RELIANCE",  name: "Reliance Ind.", price: 2930.10, change: 1.05 }
];

INSTRUMENTS_DB.forEach(item => item.prevClose = item.price / (1 + item.change / 100));

let activeTab = "watchlist-tab";
let watchlistSymbols = ["NIFTY50", "BANKNIFTY", "TATASTEEL", "WIPRO", "GAIL"];
let portfolioHoldings = [
    { symbol: "TATASTEEL", qty: 200, avgBuyPrice: 198.50 },
    { symbol: "WIPRO",     qty: 250, avgBuyPrice: 190.20 },
    { symbol: "GAIL",      qty: 332, avgBuyPrice: 148.50 },
];
let cashBalance = 145230.50;
let transactionLogs = [
    { type: "BUY", symbol: "TATASTEEL", qty: 200, price: 198.50, date: "2026-05-20" },
    { type: "BUY", symbol: "WIPRO",     qty: 250, price: 190.20, date: "2026-05-21" }
];

let selectedAsset = null;
let currentTransactionType = "BUY";
let authMode = "LOGIN";
let isDashboardInitialized = false;
let pendingUserId = null;
let isOtpVerified = false;

// ==========================================================================
// 3. SECURE AUTHENTICATION CONTROLLER (2-STEP FLOW)
// ==========================================================================
const authContainer = document.getElementById("auth-container");
const desktopWrapper = document.querySelector(".desktop-wrapper");
const authFormContainer = document.getElementById("auth-form");
const otpSection = document.getElementById("otp-section");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (!isOtpVerified) {
            // Logged in, but OTP not verified. Show OTP screen.
            authFormContainer?.classList.add("hidden");
            otpSection?.classList.remove("hidden");
            
            // Hide the "Don't have an account" toggle links on OTP screen
            const toggleContainer = document.querySelector(".auth-card > .auth-toggle-container");
            if (toggleContainer) toggleContainer.style.display = "none";
            return;
        }
        
        // Fully Verified: Load Dashboard
        authContainer?.classList.add("hidden");
        desktopWrapper?.classList.remove("hidden");
        await fetchAndRenderProfile(user.uid);
        
        if (!isDashboardInitialized) {
            initializeDashboard();
            isDashboardInitialized = true;
        }
    } else {
        // Logged Out
        isOtpVerified = false;
        pendingUserId = null;
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");
        authFormContainer?.classList.remove("hidden");
        otpSection?.classList.add("hidden");
        const toggleContainer = document.querySelector(".auth-card > .auth-toggle-container");
        if (toggleContainer) toggleContainer.style.display = "block";
    }
});

// --- TOGGLE LOGIN/SIGNUP ---
document.getElementById("auth-toggle-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
    
    const isLogin = authMode === "LOGIN";
    document.getElementById("auth-title").textContent = isLogin ? "Log In to ApexTrade" : "Register Account";
    document.getElementById("auth-submit-btn").textContent = isLogin ? "LOG IN" : "SIGN UP & SECURE ACCOUNT";
    document.getElementById("auth-toggle-text").textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    e.target.textContent = isLogin ? "Sign Up" : "Log In";
    
    document.querySelectorAll(".signup-only").forEach(el => el.classList.toggle("hidden", isLogin));
    document.querySelectorAll(".login-only").forEach(el => el.classList.toggle("hidden", !isLogin));
    document.getElementById("auth-error-msg")?.classList.add("hidden");
});

// --- STEP 1: PASSWORD LOGIN / REGISTRATION ---
authFormContainer?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorMsg = document.getElementById("auth-error-msg");
    const submitBtn = document.getElementById("auth-submit-btn");

    try {
        errorMsg.classList.add("hidden");
        submitBtn.textContent = "AUTHENTICATING...";
        submitBtn.disabled = true;

        let userCred;
        if (authMode === "SIGNUP") {
            const fullName = document.getElementById("auth-fullname")?.value.trim() || "Trader";
            const dob = document.getElementById("auth-dob")?.value || "";
            
            userCred = await createUserWithEmailAndPassword(auth, email, password);
            
            // Save initial profile
            await setDoc(doc(db, "users", userCred.user.uid), {
                fullName: fullName,
                clientId: fullName.substring(0, 2).toUpperCase() + "02X",
                email: email,
                dob: dob,
                createdAt: new Date().toISOString()
            });
        } else {
            userCred = await signInWithEmailAndPassword(auth, email, password);
        }

        pendingUserId = userCred.user.uid;

        // Generate Secure 6-Digit Code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to Firestore for verification
        await setDoc(doc(db, "users", pendingUserId), {
            currentOtp: otpCode,
            otpTimestamp: new Date().toISOString()
        }, { merge: true });

        // Initialize and send with a small delay
        setTimeout(async () => {
            try {
                await window.emailjs.send(
                    "service_apextrade",
                    "template_qfe0n8c",
                    {
                        to_email: email,
                        otp_code: otpCode
                    },
                    "C-D1EFjOx7iG0bKbs" // Adding the Public Key directly here is safer!
                );
                console.log("Email sent successfully!");
            } catch (err) {
                console.error("Transmission Error:", err);
            }
        }, 500);
        
        // Force UI update to transition to the OTP input view
        onAuthStateChanged(auth, () => {});

    } catch (err) { 
        errorMsg.textContent = "Error: " + err.message;
        errorMsg.classList.remove("hidden");
    } finally {
        submitBtn.textContent = authMode === "LOGIN" ? "LOG IN" : "SIGN UP & SECURE ACCOUNT";
        submitBtn.disabled = false;
    }
});

// --- STEP 2: OTP VERIFICATION ---
document.getElementById("verify-otp-btn")?.addEventListener("click", async () => {
    const userEnteredOtp = document.getElementById("auth-otp").value.trim();
    const btn = document.getElementById("verify-otp-btn");
    
    if (!pendingUserId || userEnteredOtp.length !== 6) {
        alert("Please enter a valid 6-digit code.");
        return;
    }

    try {
        btn.textContent = "VERIFYING...";
        const docSnap = await getDoc(doc(db, "users", pendingUserId));
        
        if (docSnap.exists() && docSnap.data().currentOtp === userEnteredOtp) {
            isOtpVerified = true;
            // Erase OTP from DB for security
            await setDoc(doc(db, "users", pendingUserId), { currentOtp: null }, { merge: true });
            
            btn.textContent = "VERIFIED!";
            btn.style.background = "#fff";
            
            setTimeout(() => {
                onAuthStateChanged(auth, () => {}); // Triggers dashboard load
            }, 500);
        } else {
            alert("Invalid or expired OTP code.");
            btn.textContent = "VERIFY & ENTER TERMINAL";
        }
    } catch (err) {
        console.error("Verification error:", err);
        btn.textContent = "VERIFY & ENTER TERMINAL";
    }
});

// --- STEP 2.5: CANCEL OTP & FORCE FIREBASE LOGOUT ---
document.getElementById("otp-back-link")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        const backBtn = document.getElementById("otp-back-link");
        backBtn.textContent = "Canceling...";
        
        // This explicitly breaks the persistent login token cache session
        await signOut(auth); 
        
        isOtpVerified = false;
        pendingUserId = null;
        
        window.location.reload();
    } catch (err) {
        console.error("Error during cancel logout:", err);
        window.location.reload();
    }
});

// ==========================================================================
// 4. CLOUD PROFILE SYNC
// ==========================================================================
async function fetchAndRenderProfile(uid) {
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const setField = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
            
            setField("profile-client-name", data.fullName);
            setField("profile-client-id", data.clientId);
            setField("profile-email-display", data.email);
            setField("profile-dob-display", data.dob || "Not Provided");
            
            if (data.avatarUrl) {
                const avatarContainer = document.getElementById("profile-avatar-img-container");
                if (avatarContainer) avatarContainer.innerHTML = `<img src="${data.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
        }
    } catch (e) { console.error("Cloud Profile Error:", e); }
}

// ==========================================================================
// 5. DASHBOARD & UI INITIALIZATION
// ==========================================================================
function initializeDashboard() {
    console.log("ApexTrade Terminal Active.");
    
    document.getElementById("logout-btn")?.addEventListener("click", () => signOut(auth));

    // Bind Search
    const searchInput = document.getElementById("search-input");
    const searchClearBtn = document.getElementById("search-clear-btn");
    searchInput?.addEventListener("input", handleSearch);
    searchClearBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        handleSearch({ target: { value: "" } });
    });

    // Bind Modals
    document.getElementById("modal-close-btn")?.addEventListener("click", closeOrderModal);
    document.getElementById("execute-order-btn")?.addEventListener("click", executeTransaction);
    
    const toggleBuyBtn = document.getElementById("toggle-buy-btn");
    const toggleSellBtn = document.getElementById("toggle-sell-btn");
    const transactionQtyInput = document.getElementById("transaction-qty");

    toggleBuyBtn?.addEventListener("click", () => {
        currentTransactionType = "BUY";
        toggleBuyBtn.classList.add("active");
        toggleSellBtn?.classList.remove("active");
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });

    toggleSellBtn?.addEventListener("click", () => {
        currentTransactionType = "SELL";
        toggleSellBtn.classList.add("active");
        toggleBuyBtn?.classList.remove("active");
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });

    transactionQtyInput?.addEventListener("input", () => {
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });

    // Bind Profile Navigation
    document.querySelector(".profile-btn")?.addEventListener("click", () => showProfilePanel(true));
    document.getElementById("profile-back-btn")?.addEventListener("click", () => showProfilePanel(false));

    setupTabs();
    updateUI();
}

// ==========================================================================
// 6. TERMINAL & TRADING LOGIC
// ==========================================================================
function flattenString(str) { return str ? str.replace(/\s+/g, '').toUpperCase() : ""; }

function handleSearch(event) {
    const rawValue = event.target.value;
    const searchClearBtn = document.getElementById("search-clear-btn");
    const searchDropdown = document.getElementById("search-dropdown");
    const searchDropdownList = document.getElementById("search-dropdown-list");

    searchClearBtn?.classList.toggle("hidden", rawValue.length === 0);

    const query = flattenString(rawValue);
    if (query === "") { searchDropdown?.classList.add("hidden"); return; }

    const results = INSTRUMENTS_DB.filter(item =>
        flattenString(item.symbol).includes(query) || flattenString(item.name).includes(query)
    );
    
    if (results.length === 0) {
        if(searchDropdownList) searchDropdownList.innerHTML = `<div class="dropdown-empty" style="padding: 15px; color: #8A92A6;">No assets matching search</div>`;
        searchDropdown?.classList.remove("hidden");
        return;
    }

    if(searchDropdownList) searchDropdownList.innerHTML = "";
    results.forEach(item => renderInstrumentRow(item, searchDropdownList));
    searchDropdown?.classList.remove("hidden");
}

function renderInstrumentRow(item, container) {
    const isPositive = item.change >= 0;
    const changeClass = isPositive ? "text-positive" : "text-negative";
    const sign = isPositive ? "+" : "";
    const isWatched = watchlistSymbols.includes(item.symbol);
    const starFill = isWatched ? '#F59E0B' : 'none';

    const row = document.createElement("div");
    row.className = "instrument-row";
    row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color);";

    row.addEventListener("click", e => {
        if (e.target.closest(".action-icon-btn")) return;
        row.style.backgroundColor = "var(--bg-secondary)";
        setTimeout(() => row.style.backgroundColor = "transparent", 200);
        openOrderModal(item);
    });

    row.innerHTML = `
        <div class="instrument-left" style="display: flex; flex-direction: column;">
            <span class="instrument-ticker" style="font-weight: 600; color: #fff;">${item.symbol}</span>
            <span class="instrument-name" style="font-size: 11px; color: #8A92A6;">${item.name}</span>
        </div>
        <div class="instrument-right" style="display: flex; align-items: center; gap: 15px;">
            <div class="instrument-metrics" style="text-align: right; display: flex; flex-direction: column;">
                <span class="instrument-price" style="font-weight: 500; color: #fff;">₹${item.price.toFixed(2)}</span>
                <span class="instrument-change ${changeClass}" style="font-size: 12px;">${sign}${item.change.toFixed(2)}%</span>
            </div>
            <button class="action-icon-btn" style="background:none; border:none; color: ${isWatched ? '#F59E0B' : '#8A92A6'}; cursor:pointer;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="${starFill}" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </button>
        </div>
    `;

    row.querySelector(".action-icon-btn").addEventListener("click", e => {
        e.stopPropagation();
        toggleWatchlist(item.symbol);
    });

    container.appendChild(row);
}

function toggleWatchlist(symbol) {
    const index = watchlistSymbols.indexOf(symbol);
    if (index > -1) watchlistSymbols.splice(index, 1);
    else watchlistSymbols.push(symbol);
    renderWatchlist();
}

function renderWatchlist() {
    const watchlistCountEl = document.getElementById("watchlist-count");
    const watchlistList = document.getElementById("watchlist-list");
    
    if (watchlistCountEl) watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    if (!watchlistList) return;

    if (watchlistSymbols.length === 0) {
        watchlistList.innerHTML = `<div class="empty-holdings" style="padding: 20px; text-align: center; color: #8A92A6; grid-column: span 2;">Watchlist empty.</div>`;
        return;
    }

    watchlistList.innerHTML = "";
    watchlistSymbols.forEach(symbol => {
        const item = INSTRUMENTS_DB.find(i => i.symbol === symbol);
        if (item) renderInstrumentRow(item, watchlistList);
    });
}

function renderPortfolio() {
    const holdingsList = document.getElementById("holdings-list");
    if (!holdingsList) return;

    let totalInvested = 0;
    let totalCurrentValue = 0;

    if (portfolioHoldings.length === 0) {
        holdingsList.innerHTML = `<div class="empty-holdings" style="padding: 20px; text-align: center; color: #8A92A6;">No active stock holdings.</div>`;
    } else {
        holdingsList.innerHTML = "";
        portfolioHoldings.forEach(holding => {
            const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
            if (!asset) return;

            const currentVal  = holding.qty * asset.price;
            const investedVal = holding.qty * holding.avgBuyPrice;
            totalInvested     += investedVal;
            totalCurrentValue += currentVal;

            const pnl        = currentVal - investedVal;
            const pnlPercent = (pnl / investedVal) * 100;
            const pnlClass   = pnl >= 0 ? "pnl-positive" : "pnl-negative";
            const sign       = pnl >= 0 ? "+" : "";

            const card = document.createElement("div");
            card.className = "holding-card";
            card.style.cssText = "background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 12px; cursor: pointer; display: flex; justify-content: space-between;";
            card.addEventListener("click", () => openOrderModal(asset));

            card.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: bold; color: #fff;">${holding.symbol}</span>
                    <span style="font-size: 12px; color: #8A92A6;">${holding.qty} Shares • Avg: ₹${holding.avgBuyPrice.toFixed(2)}</span>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column;">
                    <span style="font-weight: 600; color: #fff;">₹${currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span class="${pnlClass}" style="font-size: 12px; font-weight: 500;">${sign}₹${pnl.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)</span>
                </div>
            `;
            holdingsList.appendChild(card);
        });
    }

    renderActivityLog();

    const netPnl        = totalCurrentValue - totalInvested;
    const netPnlPercent = totalInvested > 0 ? (netPnl / totalInvested) * 100 : 0;
    const netPnlClass   = netPnl >= 0 ? "pnl-positive" : "pnl-negative";
    const netSign       = netPnl >= 0 ? "+" : "";

    const portfolioInvestedEl = document.getElementById("portfolio-invested");
    const portfolioPnlEl = document.getElementById("portfolio-pnl");

    if (portfolioInvestedEl) portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (portfolioPnlEl) {
        portfolioPnlEl.className   = `stat-value ${netPnlClass}`;
        portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
    }
}

function renderActivityLog() {
    const activityLogList = document.getElementById("activity-log-list");
    if (!activityLogList) return;

    if (transactionLogs.length === 0) {
        activityLogList.innerHTML = `<div class="dropdown-empty" style="padding: 20px; text-align: center; color: #8A92A6;">No transaction history</div>`;
        return;
    }

    activityLogList.innerHTML = "";
    [...transactionLogs].slice(-5).reverse().forEach(log => {
        const isBuy  = log.type === "BUY";
        const total  = log.qty * log.price;
        const color  = isBuy ? "var(--green-vivid)" : "var(--red-vivid)";
        
        const logRow = document.createElement("div");
        logRow.style.cssText = "display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;";
        logRow.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${log.type}</span>
                <span style="font-weight: 500; color: #fff;">${log.symbol}</span>
            </div>
            <div style="color: #8A92A6;">${log.qty} @ ₹${log.price.toFixed(2)}</div>
            <div style="font-weight: 500; color: #fff;">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        `;
        activityLogList.appendChild(logRow);
    });
}

function updatePortfolioBalance() {
    let holdingsValue = 0;
    let dailyChangeVal = 0;
    let dailyInvested  = 0;

    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (!asset) return;
        holdingsValue  += holding.qty * asset.price;
        dailyChangeVal += holding.qty * (asset.price - asset.prevClose);
        dailyInvested  += holding.qty * asset.prevClose;
    });

    const totalPortfolioValue = holdingsValue + cashBalance;
    const portfolioBalanceEl = document.getElementById("portfolio-balance");
    const portfolioChangeBadge = document.getElementById("portfolio-change-badge");

    if (portfolioBalanceEl) portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const dailyPercent = dailyInvested > 0 ? (dailyChangeVal / dailyInvested) * 100 : 0;
    const isPos        = dailyChangeVal >= 0;
    if (portfolioChangeBadge) {
        portfolioChangeBadge.className   = `change-badge ${isPos ? "pnl-positive" : "pnl-negative"}`;
        portfolioChangeBadge.textContent = `${isPos ? "+" : ""}₹${Math.abs(dailyChangeVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${isPos ? "+" : ""}${dailyPercent.toFixed(2)}%)`;
    }
}

function updateUI() {
    renderWatchlist();
    renderPortfolio();
    updatePortfolioBalance();
}

function openOrderModal(asset) {
    selectedAsset = asset;
    document.getElementById("modal-ticker").textContent = asset.symbol;
    document.getElementById("modal-name").textContent = asset.name;
    document.getElementById("modal-live-price").textContent = asset.price.toFixed(2);

    currentTransactionType = "BUY";
    document.getElementById("toggle-buy-btn")?.classList.add("active");
    document.getElementById("toggle-sell-btn")?.classList.remove("active");

    const qtyInput = document.getElementById("transaction-qty");
    if (qtyInput) {
        qtyInput.value = "10";
        updateModalCalculations(asset.price);
    }
    document.getElementById("transaction-modal")?.classList.remove("hidden");
}

function updateModalCalculations(price) {
    const qtyInput = document.getElementById("transaction-qty");
    if (!qtyInput) return;
    const qty    = parseInt(qtyInput.value) || 0;
    const estVal = qty * price;
    const fee    = estVal * 0.0005;

    document.getElementById("modal-order-value").textContent = estVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById("modal-trading-fee").textContent = fee.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const executeBtn = document.getElementById("execute-order-btn");
    if (executeBtn) {
        if (currentTransactionType === "BUY") {
            executeBtn.className   = "btn-execute-order btn-buy";
            executeBtn.style.background = "var(--green-vivid)";
            executeBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        } else {
            executeBtn.className   = "btn-execute-order btn-sell";
            executeBtn.style.background = "var(--red-vivid)";
            executeBtn.textContent = `CONFIRM SELL ORDER (₹${(estVal - fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        }
    }
}

function closeOrderModal() {
    document.getElementById("transaction-modal")?.classList.add("hidden");
    selectedAsset = null;
}

function executeTransaction() {
    if (!selectedAsset) return;
    const qty = parseInt(document.getElementById("transaction-qty")?.value);
    if (!qty || qty <= 0) { alert("Please enter a valid quantity."); return; }

    const liveAsset      = INSTRUMENTS_DB.find(i => i.symbol === selectedAsset.symbol);
    const executionPrice = liveAsset.price;
    const orderVal       = qty * executionPrice;
    const fee            = orderVal * 0.0005;

    if (currentTransactionType === "BUY") {
        cashBalance -= (orderVal + fee);
        const existing = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (existing) {
            const oldCost         = existing.qty * existing.avgBuyPrice;
            existing.qty         += qty;
            existing.avgBuyPrice  = parseFloat(((oldCost + orderVal) / existing.qty).toFixed(2));
        } else {
            portfolioHoldings.push({ symbol: liveAsset.symbol, qty, avgBuyPrice: executionPrice });
        }
    } else {
        const existing = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (!existing || existing.qty < qty) { alert("Insufficient holdings!"); return; }

        cashBalance += (orderVal - fee);
        existing.qty -= qty;
        if (existing.qty === 0) portfolioHoldings = portfolioHoldings.filter(h => h.symbol !== liveAsset.symbol);
    }

    transactionLogs.push({
        type:   currentTransactionType,
        symbol: liveAsset.symbol,
        qty,
        price:  executionPrice,
        date:   new Date().toISOString().split('T')[0],
    });

    updateUI();
    closeOrderModal();
}

function showProfilePanel(show) {
    const profilePanel       = document.getElementById("profile-panel");
    const dashboardMainView  = document.getElementById("dashboard-main-view");

    if (show) {
        dashboardMainView?.classList.add("hidden");
        profilePanel?.classList.remove("hidden");
    } else {
        profilePanel?.classList.add("hidden");
        dashboardMainView?.classList.remove("hidden");
    }
}

function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.onclick = function () {
            const targetTab = tab.getAttribute("data-tab");
            if (targetTab === "profile-panel") { showProfilePanel(true); return; }

            showProfilePanel(false);
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeTab = targetTab;

            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            document.getElementById(targetTab)?.classList.add("active");
            updateUI();
        };
    });
}
