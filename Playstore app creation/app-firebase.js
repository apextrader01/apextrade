// app.js — ApexTrade Terminal Engine
// Firebase + EmailJS OTP Auth + Trading Dashboard
// ============================================================

import { auth, db } from './firebase-init.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ============================================================
// GLOBAL STATE
// ============================================================

const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL",   name: "Tata Steel Ltd.",               price: 205.20,  change: -1.62 },
    { symbol: "ADANIPOWER",  name: "Adani Power India Ltd.",         price: 219.32,  change:  0.77 },
    { symbol: "ADANIENSOL",  name: "Adani Energy Solutions Ltd.",    price: 1367.90, change: -0.36 },
    { symbol: "WIPRO",       name: "Wipro Ltd.",                     price: 202.97,  change:  0.15 },
    { symbol: "GAIL",        name: "GAIL India Ltd.",                price: 160.77,  change:  1.12 },
    { symbol: "KITEX",       name: "Kitex Garments Ltd.",            price: 157.86,  change:  0.45 },
    { symbol: "APOLLOMICR",  name: "Apollo Micro Systems Ltd.",      price: 355.05,  change: -0.85 },
];

INSTRUMENTS_DB.forEach(item => {
    item.prevClose = item.price / (1 + item.change / 100);
});

let watchlistSymbols = ["TATASTEEL", "ADANIPOWER", "WIPRO", "GAIL", "KITEX"];
let portfolioHoldings = [
    { symbol: "TATASTEEL", qty: 200, avgBuyPrice: 198.50 },
    { symbol: "WIPRO",     qty: 250, avgBuyPrice: 190.20 },
    { symbol: "GAIL",      qty: 332, avgBuyPrice: 148.50 },
];
let cashBalance = 72.36;
let transactionLogs = [
    { type: "BUY", symbol: "TATASTEEL", qty: 200, price: 198.50, date: "2026-05-20" },
    { type: "BUY", symbol: "WIPRO",     qty: 250, price: 190.20, date: "2026-05-21" },
    { type: "BUY", symbol: "GAIL",      qty: 332, price: 148.50, date: "2026-05-22" },
];

let activeTab = "watchlist-tab";
let selectedAsset = null;
let currentTransactionType = "BUY";

// Auth state
let authMode = "LOGIN";
let authListenersBound = false;
let pendingUserId = null;
let isOtpVerified = false;
let isDashboardInitialized = false;

// ============================================================
// DOM REFERENCES
// ============================================================

const authContainer = document.getElementById("auth-container");
const desktopWrapper = document.querySelector(".desktop-wrapper");
const authForm = document.getElementById("auth-form");
const otpSection = document.getElementById("otp-section");
const authTitle = document.getElementById("auth-title");
const authToggleLink = document.getElementById("auth-toggle-link");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authErrorMsg = document.getElementById("auth-error-msg");

const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear-btn");
const searchDropdown = document.getElementById("search-dropdown");
const searchDropdownList = document.getElementById("search-dropdown-list");
const watchlistList = document.getElementById("watchlist-list");
const holdingsList = document.getElementById("holdings-list");
const activityLogList = document.getElementById("activity-log-list");
const portfolioBalanceEl = document.getElementById("portfolio-balance");
const portfolioChangeBadge = document.getElementById("portfolio-change-badge");
const portfolioInvestedEl = document.getElementById("portfolio-invested");
const portfolioPnlEl = document.getElementById("portfolio-pnl");
const watchlistCountEl = document.getElementById("watchlist-count");

const transactionModal = document.getElementById("transaction-modal");
const modalTicker = document.getElementById("modal-ticker");
const modalName = document.getElementById("modal-name");
const modalLivePrice = document.getElementById("modal-live-price");
const modalCloseBtn = document.getElementById("modal-close-btn");
const toggleBuyBtn = document.getElementById("toggle-buy-btn");
const toggleSellBtn = document.getElementById("toggle-sell-btn");
const transactionQtyInput = document.getElementById("transaction-qty");
const modalOrderValue = document.getElementById("modal-order-value");
const modalTradingFee = document.getElementById("modal-trading-fee");
const executeOrderBtn = document.getElementById("execute-order-btn");

const logoutBtn = document.getElementById("logout-btn");
const profileBtn = document.querySelector(".profile-btn");
const profilePanel = document.getElementById("profile-panel");
const profileBackBtn = document.getElementById("profile-back-btn");
const backToDashboardBtn = document.getElementById("back-to-dashboard-btn");
const dashboardMainView = document.getElementById("dashboard-main-view");

// ============================================================
// FIREBASE AUTH LISTENER
// ============================================================

onAuthStateChanged(auth, async (user) => {
    if (user && isOtpVerified) {
        // Logged in + OTP verified
        authContainer?.classList.add("hidden");
        desktopWrapper?.classList.remove("hidden");
        if (!isDashboardInitialized) {
            await fetchAndRenderProfile(user.uid);
            initializeDashboard();
            isDashboardInitialized = true;
        }
    } else if (user) {
        // Logged in but OTP pending
        authForm?.classList.add("hidden");
        otpSection?.classList.remove("hidden");
    } else {
        // Logged out
        isOtpVerified = false;
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");
        authForm?.classList.remove("hidden");
        otpSection?.classList.add("hidden");
    }
});

// ============================================================
// AUTH: STEP 1 — LOGIN / SIGNUP FORM
// ============================================================

authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;

    if (!email || !password) {
        showAuthError("Please enter email and password.");
        return;
    }

    if (authSubmitBtn) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = "AUTHENTICATING...";
    }

    try {
        let userCred;
        if (authMode === "SIGNUP") {
            userCred = await createUserWithEmailAndPassword(auth, email, password);
        } else {
            userCred = await signInWithEmailAndPassword(auth, email, password);
        }

        pendingUserId = userCred.user.uid;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Firestore
        await setDoc(doc(db, "users", pendingUserId), { currentOtp: otpCode }, { merge: true });

        // Send OTP via EmailJS
        await window.emailjs.send(
            "service_apextrade",
            "template_qfe0n8c",
            { email: email, otp_code: otpCode },
            "C-D1EFjOx7iG0bKbs"
        );

        authForm?.classList.add("hidden");
        otpSection?.classList.remove("hidden");

    } catch (err) {
        console.error("Auth error:", err);
        let errorMsg = "Authentication failed.";
        if (err.code === "auth/email-already-in-use") {
            errorMsg = "Email already registered. Try logging in.";
        } else if (err.code === "auth/invalid-email") {
            errorMsg = "Invalid email address.";
        } else if (err.code === "auth/weak-password") {
            errorMsg = "Password must be at least 6 characters.";
        } else if (err.code === "auth/user-not-found") {
            errorMsg = "User not found. Try signing up.";
        } else if (err.code === "auth/wrong-password") {
            errorMsg = "Incorrect password.";
        }
        showAuthError(errorMsg);
    } finally {
        if (authSubmitBtn) {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = authMode === "LOGIN" ? "LOG IN" : "SIGN UP";
        }
    }
});

// ============================================================
// AUTH: STEP 2 — OTP VERIFICATION
// ============================================================

document.getElementById("verify-otp-btn")?.addEventListener("click", async () => {
    const otpInput = document.getElementById("auth-otp");
    const userEnteredOtp = otpInput?.value.replace(/\s/g, "").trim();
    const btn = document.getElementById("verify-otp-btn");

    if (!pendingUserId) {
        alert("Session expired. Please log in again.");
        return;
    }

    if (!userEnteredOtp || userEnteredOtp.length !== 6) {
        alert("Please enter a valid 6-digit code.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = "VERIFYING...";
    }

    try {
        const docSnap = await getDoc(doc(db, "users", pendingUserId));

        if (docSnap.exists() && String(docSnap.data().currentOtp) === userEnteredOtp) {
            isOtpVerified = true;
            // Clear OTP from database
            await setDoc(doc(db, "users", pendingUserId), { currentOtp: null }, { merge: true });

            authContainer?.classList.add("hidden");
            desktopWrapper?.classList.remove("hidden");

            if (!isDashboardInitialized) {
                await fetchAndRenderProfile(pendingUserId);
                initializeDashboard();
                isDashboardInitialized = true;
            }
        } else {
            alert("Invalid OTP. Please check and try again.");
            if (otpInput) otpInput.value = "";
        }
    } catch (err) {
        console.error("OTP verification error:", err);
        alert("Verification failed. Please try again.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "VERIFY & ENTER TERMINAL";
        }
    }
});

// ============================================================
// AUTH: OTP BACK LINK
// ============================================================

document.getElementById("otp-back-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    otpSection?.classList.add("hidden");
    authForm?.classList.remove("hidden");
    const otpInput = document.getElementById("auth-otp");
    if (otpInput) otpInput.value = "";
});

// ============================================================
// AUTH: LOGIN / SIGNUP TOGGLE
// ============================================================

authToggleLink?.addEventListener("click", (e) => {
    e.preventDefault();
    authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";

    if (authTitle) {
        authTitle.textContent = authMode === "LOGIN" ? "Log In to ApexTrade" : "Create your Account";
    }
    if (authSubmitBtn) {
        authSubmitBtn.textContent = authMode === "LOGIN" ? "LOG IN" : "SIGN UP";
    }

    document.querySelectorAll(".signup-only").forEach(el => {
        el.classList.toggle("hidden", authMode === "LOGIN");
    });

    if (authErrorMsg) authErrorMsg.classList.add("hidden");
});

// ============================================================
// FETCH & RENDER PROFILE FROM FIRESTORE
// ============================================================

async function fetchAndRenderProfile(uid) {
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const profileClientName = document.getElementById("profile-client-name");
            const profileEmail = document.getElementById("profile-email-display");
            const profileClientId = document.getElementById("profile-client-id");
            const verificationBadge = document.getElementById("profile-verification-status");

            if (profileClientName) profileClientName.textContent = userData.fullName || "User";
            if (profileEmail) profileEmail.textContent = userData.email || auth.currentUser?.email;
            if (profileClientId) profileClientId.textContent = userData.clientId || "—";
            if (verificationBadge) {
                verificationBadge.textContent = "✓ VERIFIED ACCOUNT";
                verificationBadge.className = "verification-badge verified";
            }
        }
    } catch (err) {
        console.error("Error fetching profile:", err);
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function flattenString(str) {
    return str ? str.replace(/\s+/g, "").toUpperCase() : "";
}

function showAuthError(message) {
    if (authErrorMsg) {
        authErrorMsg.textContent = message;
        authErrorMsg.classList.remove("hidden");
    }
}

// ============================================================
// SEARCH
// ============================================================

function handleSearch(event) {
    const rawValue = event.target.value;
    searchClearBtn?.classList.toggle("hidden", rawValue.length === 0);

    const query = flattenString(rawValue);
    if (query === "") {
        searchDropdown?.classList.add("hidden");
        return;
    }

    const results = INSTRUMENTS_DB.filter(item =>
        flattenString(item.symbol).includes(query) ||
        flattenString(item.name).includes(query)
    );

    renderSearchResults(results);
}

function renderSearchResults(results) {
    if (!searchDropdownList) return;

    if (results.length === 0) {
        searchDropdownList.innerHTML = `<div class="dropdown-empty">No assets matching search</div>`;
        searchDropdown?.classList.remove("hidden");
        return;
    }

    searchDropdownList.innerHTML = "";
    results.forEach(item => renderInstrumentRow(item, searchDropdownList));
    searchDropdown?.classList.remove("hidden");
}

function renderInstrumentRow(item, container) {
    const isPositive = item.change >= 0;
    const changeClass = isPositive ? "text-positive" : "text-negative";
    const sign = isPositive ? "+" : "";
    const isWatched = watchlistSymbols.includes(item.symbol);
    const starFill = isWatched ? "currentColor" : "none";

    const row = document.createElement("div");
    row.className = "instrument-row";

    row.addEventListener("click", (e) => {
        if (e.target.closest(".action-icon-btn")) return;
        row.classList.add("active-click");
        setTimeout(() => row.classList.remove("active-click"), 200);
        openOrderModal(item);
    });

    row.innerHTML = `
        <div class="instrument-left">
            <span class="instrument-ticker">${item.symbol}</span>
            <span class="instrument-name">${item.name}</span>
        </div>
        <div class="instrument-right">
            <div class="instrument-metrics">
                <span class="instrument-price">₹${item.price.toFixed(2)}</span>
                <span class="instrument-change ${changeClass}">${sign}${item.change.toFixed(2)}%</span>
            </div>
            <button class="action-icon-btn ${isWatched ? "watched" : ""}" data-symbol="${item.symbol}" aria-label="${isWatched ? "Remove from watchlist" : "Add to watchlist"}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="${starFill}" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </button>
        </div>
    `;

    row.querySelector(".action-icon-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWatchlist(item.symbol);
    });

    container.appendChild(row);
}

function toggleWatchlist(symbol) {
    const index = watchlistSymbols.indexOf(symbol);
    if (index > -1) { watchlistSymbols.splice(index, 1); }
    else { watchlistSymbols.push(symbol); }
    renderWatchlist();
}

// ============================================================
// WATCHLIST
// ============================================================

function renderWatchlist() {
    if (watchlistCountEl) watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    if (!watchlistList) return;

    if (watchlistSymbols.length === 0) {
        watchlistList.innerHTML = `<div class="empty-holdings">Watchlist empty.</div>`;
        return;
    }

    watchlistList.innerHTML = "";
    watchlistSymbols.forEach(symbol => {
        const item = INSTRUMENTS_DB.find(i => i.symbol === symbol);
        if (item) renderInstrumentRow(item, watchlistList);
    });
}

// ============================================================
// PORTFOLIO
// ============================================================

function renderPortfolio() {
    if (!holdingsList) return;

    let totalInvested = 0;
    let totalCurrentValue = 0;

    if (portfolioHoldings.length === 0) {
        holdingsList.innerHTML = `<div class="empty-holdings">No active stock holdings.</div>`;
    } else {
        holdingsList.innerHTML = "";
        portfolioHoldings.forEach(holding => {
            const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
            if (!asset) return;

            const currentVal = holding.qty * asset.price;
            const investedVal = holding.qty * holding.avgBuyPrice;
            totalInvested += investedVal;
            totalCurrentValue += currentVal;

            const pnl = currentVal - investedVal;
            const pnlPercent = (pnl / investedVal) * 100;
            const pnlClass = pnl >= 0 ? "pnl-positive" : "pnl-negative";
            const sign = pnl >= 0 ? "+" : "";

            const card = document.createElement("div");
            card.className = "holding-card";
            card.addEventListener("click", () => openOrderModal(asset));

            card.innerHTML = `
                <div class="holding-left">
                    <span class="holding-ticker">${holding.symbol}</span>
                    <span class="holding-qty">${holding.qty} Shares</span>
                </div>
                <div class="holding-middle">
                    <span class="holding-avg">Avg: ₹${holding.avgBuyPrice.toFixed(2)}</span>
                    <span class="holding-price-live">LTP: ₹${asset.price.toFixed(2)}</span>
                </div>
                <div class="holding-right">
                    <span class="holding-val">₹${currentVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span class="holding-pnl ${pnlClass}">${sign}₹${pnl.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)</span>
                </div>
            `;
            holdingsList.appendChild(card);
        });
    }

    renderActivityLog();

    const netPnl = totalCurrentValue - totalInvested;
    const netPnlPercent = totalInvested > 0 ? (netPnl / totalInvested) * 100 : 0;
    const netPnlClass = netPnl >= 0 ? "pnl-positive" : "pnl-negative";
    const netSign = netPnl >= 0 ? "+" : "";

    if (portfolioInvestedEl) {
        portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }
    if (portfolioPnlEl) {
        portfolioPnlEl.className = `stat-value ${netPnlClass}`;
        portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
    }
}

function renderActivityLog() {
    if (!activityLogList) return;

    if (transactionLogs.length === 0) {
        activityLogList.innerHTML = `<div class="dropdown-empty">No transaction history</div>`;
        return;
    }

    activityLogList.innerHTML = "";
    [...transactionLogs].slice(-5).reverse().forEach(log => {
        const isBuy = log.type === "BUY";
        const total = log.qty * log.price;
        const logRow = document.createElement("div");
        logRow.className = "log-item";
        logRow.innerHTML = `
            <div class="log-left">
                <span class="log-badge ${isBuy ? "buy" : "sell"}">${log.type}</span>
                <span class="log-ticker">${log.symbol}</span>
            </div>
            <div class="log-middle">${log.qty} shares @ ₹${log.price.toFixed(2)}</div>
            <div class="log-right">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        `;
        activityLogList.appendChild(logRow);
    });
}

function updatePortfolioBalance() {
    let holdingsValue = 0;
    let dailyChangeVal = 0;
    let dailyInvested = 0;

    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (!asset) return;
        holdingsValue += holding.qty * asset.price;
        dailyChangeVal += holding.qty * (asset.price - asset.prevClose);
        dailyInvested += holding.qty * asset.prevClose;
    });

    const totalPortfolioValue = holdingsValue + cashBalance;
    if (portfolioBalanceEl) {
        portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    }

    const dailyPercent = dailyInvested > 0 ? (dailyChangeVal / dailyInvested) * 100 : 0;
    const isPos = dailyChangeVal >= 0;
    if (portfolioChangeBadge) {
        portfolioChangeBadge.className = `change-badge ${isPos ? "pnl-positive" : "pnl-negative"}`;
        portfolioChangeBadge.textContent = `${isPos ? "+" : ""}₹${Math.abs(dailyChangeVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${isPos ? "+" : ""}${dailyPercent.toFixed(2)}%)`;
    }
}

function updateUI() {
    renderWatchlist();
    renderPortfolio();
    updatePortfolioBalance();
}

// ============================================================
// TRANSACTION MODAL
// ============================================================

function openOrderModal(asset) {
    selectedAsset = asset;

    if (modalTicker) modalTicker.textContent = asset.symbol;
    if (modalName) modalName.textContent = asset.name;
    if (modalLivePrice) modalLivePrice.textContent = asset.price.toFixed(2);

    currentTransactionType = "BUY";
    if (toggleBuyBtn) toggleBuyBtn.classList.add("active");
    if (toggleSellBtn) toggleSellBtn.classList.remove("active");

    if (transactionQtyInput) {
        transactionQtyInput.value = "10";
        updateModalCalculations(asset.price);
    }

    if (transactionModal) transactionModal.classList.remove("hidden");
}

function updateModalCalculations(price) {
    if (!transactionQtyInput) return;
    const qty = parseInt(transactionQtyInput.value) || 0;
    const estVal = qty * price;
    const fee = estVal * 0.0005;

    if (modalOrderValue) modalOrderValue.textContent = estVal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    if (modalTradingFee) modalTradingFee.textContent = fee.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    if (executeOrderBtn) {
        if (currentTransactionType === "BUY") {
            executeOrderBtn.className = "btn-execute-order btn-buy";
            executeOrderBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString("en-IN", { maximumFractionDigits: 2 })})`;
        } else {
            executeOrderBtn.className = "btn-execute-order btn-sell";
            executeOrderBtn.textContent = `CONFIRM SELL ORDER (₹${(estVal - fee).toLocaleString("en-IN", { maximumFractionDigits: 2 })})`;
        }
    }
}

function closeOrderModal() {
    if (transactionModal) transactionModal.classList.add("hidden");
    selectedAsset = null;
}

function executeTransaction() {
    if (!selectedAsset) return;

    const qty = parseInt(transactionQtyInput?.value);
    if (!qty || qty <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    const liveAsset = INSTRUMENTS_DB.find(i => i.symbol === selectedAsset.symbol);
    const executionPrice = liveAsset.price;
    const orderVal = qty * executionPrice;
    const fee = orderVal * 0.0005;

    if (currentTransactionType === "BUY") {
        cashBalance -= (orderVal + fee);
        const existing = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (existing) {
            const oldCost = existing.qty * existing.avgBuyPrice;
            existing.qty += qty;
            existing.avgBuyPrice = parseFloat(((oldCost + orderVal) / existing.qty).toFixed(2));
        } else {
            portfolioHoldings.push({ symbol: liveAsset.symbol, qty, avgBuyPrice: executionPrice });
        }
    } else {
        const existing = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (!existing || existing.qty < qty) {
            alert("Insufficient holdings!");
            return;
        }

        cashBalance += (orderVal - fee);
        existing.qty -= qty;
        if (existing.qty === 0) {
            portfolioHoldings = portfolioHoldings.filter(h => h.symbol !== liveAsset.symbol);
        }
    }

    transactionLogs.push({
        type: currentTransactionType,
        symbol: liveAsset.symbol,
        qty,
        price: executionPrice,
        date: new Date().toISOString().split("T")[0],
    });

    updateUI();
    closeOrderModal();
}

// ============================================================
// PROFILE PANEL
// ============================================================

function showProfilePanel(show) {
    if (show) {
        dashboardMainView?.classList.add("hidden");
        profilePanel?.classList.remove("hidden");
    } else {
        profilePanel?.classList.add("hidden");
        dashboardMainView?.classList.remove("hidden");
    }
}

// ============================================================
// TABS
// ============================================================

function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.addEventListener("click", function () {
            const targetTab = tab.getAttribute("data-tab");

            if (targetTab === "profile-panel") {
                showProfilePanel(true);
                return;
            }

            showProfilePanel(false);
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeTab = targetTab;

            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            document.getElementById(targetTab)?.classList.add("active");

            updateUI();
        });
    });
}

// ============================================================
// DASHBOARD INITIALIZATION
// ============================================================

function initializeDashboard() {
    console.log("ApexTrade Terminal Active.");

    // Logout
    logoutBtn?.addEventListener("click", () => signOut(auth));

    // Search
    searchInput?.addEventListener("input", handleSearch);
    searchClearBtn?.addEventListener("click", () => {
        if (searchInput) {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
        }
    });

    // Modal
    modalCloseBtn?.addEventListener("click", closeOrderModal);
    executeOrderBtn?.addEventListener("click", executeTransaction);

    // Buy/Sell toggle
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

    // Qty input
    transactionQtyInput?.addEventListener("input", () => {
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });

    // Qty +/−
    document.getElementById("qty-minus")?.addEventListener("click", () => {
        if (transactionQtyInput) {
            const current = parseInt(transactionQtyInput.value) || 1;
            if (current > 1) {
                transactionQtyInput.value = current - 1;
                if (selectedAsset) updateModalCalculations(selectedAsset.price);
            }
        }
    });

    document.getElementById("qty-plus")?.addEventListener("click", () => {
        if (transactionQtyInput) {
            const current = parseInt(transactionQtyInput.value) || 0;
            transactionQtyInput.value = current + 1;
            if (selectedAsset) updateModalCalculations(selectedAsset.price);
        }
    });

    // Profile navigation
    profileBtn?.addEventListener("click", () => showProfilePanel(true));
    profileBackBtn?.addEventListener("click", () => showProfilePanel(false));
    backToDashboardBtn?.addEventListener("click", () => showProfilePanel(false));

    // Support ticket
    document.getElementById("support-ticket-btn")?.addEventListener("click", () => {
        const ticketId = Math.floor(100000 + Math.random() * 900000);
        alert(`Support ticket initialized.\nAssigned ticket ID: #${ticketId}`);
    });

    setupTabs();
    updateUI();
}

// ============================================================
// INIT
// ============================================================

if (!authListenersBound && authForm) {
    authListenersBound = true;
}
