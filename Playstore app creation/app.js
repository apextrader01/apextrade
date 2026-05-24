// app.js - ApexTrade | Premium Stock Portfolio & Terminal Router
// Architecture: Custom ID/Password Auth + Admin Bridge (Google Apps Script)

// ==========================================================================
// ROUTE GUARD — Runs immediately, before DOM is ready
// Hides the dashboard shell during the auth check to prevent flash-of-content.
// ==========================================================================
// app.js - ApexTrade | Premium Stock Portfolio & Terminal Router
// Architecture: Custom ID/Password Auth + Admin Bridge (Google Apps Script)

// [INSERT YOUR FIREBASE IMPORT HERE]
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

// ================================================================
// ROUTE GUARD - Runs immediately, before DOM is ready
// ================================================================


      // ================================================================
// ROUTE GUARD - Runs immediately using Firebase Auth
// ================================================================

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // No user logged in: Hide the shell
        const style = document.createElement('style');
        style.id = 'temp-auth-hide';
        style.textContent = '.desktop-wrapper { display: none !important; }';
        document.head.appendChild(style);
        console.log("Auth: Access denied, redirecting...");
    } else {
        // User is logged in: Ensure content is visible
        const existingStyle = document.getElementById('temp-auth-hide');
        if (existingStyle) {
            existingStyle.remove();
        }
        console.log("Auth: Access granted for user:", user.email);
    }
});

// ==========================================================================
// DATABASE & STATE
// ==========================================================================

const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL",   name: "Tata Steel Ltd.",               price: 205.20,  change: -1.62 },
    { symbol: "ADANIPOWER",  name: "Adani Power India Ltd.",         price: 219.32,  change:  0.77 },
    { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd.",    price: 1367.90, change: -0.36 },
    { symbol: "WIPRO",       name: "Wipro Ltd.",                     price: 202.97,  change:  0.15 },
    { symbol: "GAIL",        name: "GAIL India Ltd.",                price: 160.77,  change:  1.12 },
    { symbol: "KITEX",       name: "Kitex Garments Ltd.",            price: 157.86,  change:  0.45 },
    { symbol: "APOLLOMICR",  name: "Apollo Micro Systems Ltd.",      price: 355.05,  change: -0.85 },
];

// Derive prevClose from price and change% so daily P&L calculations are accurate
INSTRUMENTS_DB.forEach(item => {
    item.prevClose = item.price / (1 + item.change / 100);
});

let activeTab           = "watchlist-tab";
let watchlistSymbols    = ["TATASTEEL", "ADANIPOWER", "WIPRO", "GAIL", "KITEX"];
let portfolioHoldings   = [
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

let activeSearchQuery    = "";
let selectedAsset        = null;
let currentTransactionType = "BUY";

// Auth state
let authMode            = "LOGIN";
let authListenersBound  = false;
let current_otp         = null;

// ==========================================================================
// SEED DEFAULT CREDENTIALS (only if first run)
// NOTE: Passwords in localStorage are plaintext. For a production deployment,
// replace this with a hashed credential system or a server-side auth endpoint.
// ==========================================================================

if (!localStorage.getItem('user_credentials')) {
    localStorage.setItem('user_credentials', JSON.stringify({
        username:       "trader101",
        password:       "password123",
        fullName:       "Hari Krishnan I V",
        dob:            "2002-05-15",
        clientId:       "HA02V",
        classification: "Trader",
        traderType:     "ACTIVE",
    }));
}

// ==========================================================================
// DOM REFERENCES
// ==========================================================================

const searchInput          = document.getElementById("search-input");
const searchClearBtn       = document.getElementById("search-clear-btn");
const searchDropdown       = document.getElementById("search-dropdown");
const searchDropdownList   = document.getElementById("search-dropdown-list");
const watchlistList        = document.getElementById("watchlist-list");
const holdingsList         = document.getElementById("holdings-list");
const activityLogList      = document.getElementById("activity-log-list");
const portfolioBalanceEl   = document.getElementById("portfolio-balance");
const portfolioChangeBadge = document.getElementById("portfolio-change-badge");
const portfolioInvestedEl  = document.getElementById("portfolio-invested");
const portfolioPnlEl       = document.getElementById("portfolio-pnl");
const watchlistCountEl     = document.getElementById("watchlist-count");

const transactionModal     = document.getElementById("transaction-modal");
const modalTicker          = document.getElementById("modal-ticker");
const modalName            = document.getElementById("modal-name");
const modalLivePrice       = document.getElementById("modal-live-price");
const modalCloseBtn        = document.getElementById("modal-close-btn");
const toggleBuyBtn         = document.getElementById("toggle-buy-btn");
const toggleSellBtn        = document.getElementById("toggle-sell-btn");
const transactionQtyInput  = document.getElementById("transaction-qty");
const modalOrderValue      = document.getElementById("modal-order-value");
const modalTradingFee      = document.getElementById("modal-trading-fee");
const executeOrderBtn      = document.getElementById("execute-order-btn");

const authContainer         = document.getElementById("auth-container");
const desktopWrapper        = document.querySelector(".desktop-wrapper");
const authForm              = document.getElementById("auth-form");
const authUsernameInput     = document.getElementById("auth-username");
const authPasswordInput     = document.getElementById("auth-password");
const authErrorMsg          = document.getElementById("auth-error-msg");
const authSubmitBtn         = document.getElementById("auth-submit-btn");
const authTitle             = document.getElementById("auth-title");
const authSubtitle          = document.getElementById("auth-subtitle");
const authToggleLink        = document.getElementById("auth-toggle-link");
const logoutBtn             = document.getElementById("logout-btn");

// ==========================================================================
// UTILITY HELPERS
// ==========================================================================

/** Normalise a string for fuzzy search (removes spaces, uppercases). */
function flattenString(str) {
    return str ? str.replace(/\s+/g, '').toUpperCase() : "";
}

/**
 * Generates a deterministic Client ID from a full name and date-of-birth.
 * Format: [First2LettersOfName][Last2DigitsOfYear][LastLetterOfName]
 * Example: "Hari Krishnan", "2002-05-15" → "HA02N"
 */
function generateClientId(fullName, dob) {
    if (!fullName || !dob) return "";
    const cleaned = fullName.trim();
    if (cleaned.length < 2) return "";

    const firstTwo  = cleaned.substring(0, 2).toUpperCase();
    const lastLetter = cleaned.slice(-1).toUpperCase();

    let birthYear = "";
    if (dob.includes("-")) {
        const parts = dob.split("-");
        birthYear = parts[0].length === 4 ? parts[0] : parts[parts.length - 1];
    } else {
        birthYear = new Date(dob).getFullYear().toString();
    }
    const lastTwoYear = birthYear.slice(-2);

    return `${firstTwo}${lastTwoYear}${lastLetter}`;
}

/** Returns the stored credentials object, preferring the active session key. */
function getStoredCredentials() {
    const raw = localStorage.getItem('current_user') || localStorage.getItem('user_credentials');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ==========================================================================
// SEARCH
// ==========================================================================

function handleSearch(event) {
    const rawValue = event.target.value;
    activeSearchQuery = rawValue;

    searchClearBtn.classList.toggle("hidden", rawValue.length === 0);

    const query = flattenString(rawValue);
    if (query === "") {
        searchDropdown.classList.add("hidden");
        return;
    }

    const results = INSTRUMENTS_DB.filter(item =>
        flattenString(item.symbol).includes(query) ||
        flattenString(item.name).includes(query)
    );
    renderSearchResults(results);
}

function renderSearchResults(results) {
    if (results.length === 0) {
        searchDropdownList.innerHTML = `<div class="dropdown-empty">No assets matching search</div>`;
        searchDropdown.classList.remove("hidden");
        return;
    }

    searchDropdownList.innerHTML = "";
    results.forEach(item => renderInstrumentRow(item, searchDropdownList, true));
    searchDropdown.classList.remove("hidden");
}

// ==========================================================================
// SHARED INSTRUMENT ROW RENDERER
// Extracted so watchlist and search use identical markup without duplication.
// ==========================================================================

function renderInstrumentRow(item, container, showAddRemoveStar = false) {
    const isPositive = item.change >= 0;
    const changeClass = isPositive ? "text-positive" : "text-negative";
    const sign        = isPositive ? "+" : "";
    const isWatched   = watchlistSymbols.includes(item.symbol);
    const starFill    = isWatched ? 'currentColor' : 'none';

    const row = document.createElement("div");
    row.className = "instrument-row";

    row.addEventListener("click", e => {
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
            <button class="action-icon-btn ${isWatched ? 'watched' : ''}" data-symbol="${item.symbol}" aria-label="${isWatched ? 'Remove from watchlist' : 'Add to watchlist'}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="${starFill}" stroke="currentColor" stroke-width="2">
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

// ==========================================================================
// WATCHLIST
// ==========================================================================

function toggleWatchlist(symbol) {
    const index = watchlistSymbols.indexOf(symbol);
    if (index > -1) { watchlistSymbols.splice(index, 1); }
    else            { watchlistSymbols.push(symbol); }
    renderWatchlist();
}

function renderWatchlist() {
    if (watchlistCountEl) watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    if (!watchlistList) return;

    if (watchlistSymbols.length === 0) {
        watchlistList.innerHTML = `<div class="empty-holdings" style="grid-column: span 2;">Watchlist empty.</div>`;
        return;
    }

    watchlistList.innerHTML = "";
    watchlistSymbols.forEach(symbol => {
        const item = INSTRUMENTS_DB.find(i => i.symbol === symbol);
        if (item) renderInstrumentRow(item, watchlistList, true);
    });
}

// ==========================================================================
// PORTFOLIO & ACTIVITY LOG
// ==========================================================================

function renderPortfolio() {
    if (!holdingsList) return;

    let totalInvested     = 0;
    let totalCurrentValue = 0;

    if (portfolioHoldings.length === 0) {
        holdingsList.innerHTML = `<div class="empty-holdings">No active stock holdings.</div>`;
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
                    <span class="holding-val">₹${currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span class="holding-pnl ${pnlClass}">${sign}₹${pnl.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)</span>
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

    if (portfolioInvestedEl) {
        portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    if (portfolioPnlEl) {
        portfolioPnlEl.className   = `stat-value ${netPnlClass}`;
        portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
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
        const isBuy  = log.type === "BUY";
        const total  = log.qty * log.price;
        const logRow = document.createElement("div");
        logRow.className = "log-item";
        logRow.innerHTML = `
            <div class="log-left">
                <span class="log-badge ${isBuy ? 'buy' : 'sell'}">${log.type}</span>
                <span class="log-ticker">${log.symbol}</span>
            </div>
            <div class="log-middle">${log.qty} shares @ ₹${log.price.toFixed(2)}</div>
            <div class="log-right">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
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
    if (portfolioBalanceEl) {
        portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }

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

// ==========================================================================
// ORDER MODAL
// ==========================================================================

function openOrderModal(asset) {
    selectedAsset = asset;

    if (modalTicker)    modalTicker.textContent    = asset.symbol;
    if (modalName)      modalName.textContent      = asset.name;
    if (modalLivePrice) modalLivePrice.textContent = asset.price.toFixed(2);

    currentTransactionType = "BUY";
    if (toggleBuyBtn)  toggleBuyBtn.classList.add("active");
    if (toggleSellBtn) toggleSellBtn.classList.remove("active");

    if (transactionQtyInput) {
        transactionQtyInput.value = "10";
        updateModalCalculations(asset.price);
    }

    if (transactionModal) transactionModal.classList.remove("hidden");
}

function updateModalCalculations(price) {
    if (!transactionQtyInput) return;
    const qty    = parseInt(transactionQtyInput.value) || 0;
    const estVal = qty * price;
    const fee    = estVal * 0.0005;

    if (modalOrderValue) modalOrderValue.textContent = estVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (modalTradingFee) modalTradingFee.textContent = fee.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    if (executeOrderBtn) {
        if (currentTransactionType === "BUY") {
            executeOrderBtn.className   = "btn-execute-order btn-buy";
            executeOrderBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        } else {
            executeOrderBtn.className   = "btn-execute-order btn-sell";
            executeOrderBtn.textContent = `CONFIRM SELL ORDER (₹${(estVal - fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        }
    }
}

function closeOrderModal() {
    if (transactionModal) transactionModal.classList.add("hidden");
    selectedAsset = null;
}

function executeTransaction() {
    if (!selectedAsset) return;

    const qty = parseInt(transactionQtyInput.value);
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
        if (existing.qty === 0) {
            portfolioHoldings = portfolioHoldings.filter(h => h.symbol !== liveAsset.symbol);
        }
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

// ==========================================================================
// PROFILE PANEL
// ==========================================================================

function showProfilePanel(show) {
    const profilePanel       = document.getElementById("profile-panel");
    const dashboardMainView  = document.getElementById("dashboard-main-view");

    if (show) {
        dashboardMainView?.classList.add("hidden");
        profilePanel?.classList.remove("hidden");
        profilePanel?.classList.add("active");
        renderProfileDetails();
    } else {
        profilePanel?.classList.add("hidden");
        profilePanel?.classList.remove("active");
        dashboardMainView?.classList.remove("hidden");

        document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
        document.querySelector('button[data-tab="watchlist-tab"]')?.classList.add("active");
    }
}

function renderProfileDetails() {
    const creds = getStoredCredentials();
    if (!creds) return;

    const setField = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
    };

    setField("profile-client-name",        creds.fullName);
    setField("profile-dob-display",        creds.dob);
    setField("profile-email-display",      creds.username || creds.email);
    setField("profile-client-id",          creds.clientId);
    setField("profile-gender-display",     creds.gender);

    const vBadge = document.getElementById("profile-verification-status");
    if (vBadge) {
        vBadge.textContent = "✓ VERIFIED ACCOUNT";
        vBadge.className   = "verification-badge verified";
    }
}

// ==========================================================================
// TAB NAVIGATION
// ==========================================================================

function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.onclick = function () {
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
        };
    });
}

// ==========================================================================
// AUTHENTICATION
// ==========================================================================

function switchFormState() {
    const isLogin = authMode === "LOGIN";
    if (authTitle)     authTitle.textContent     = isLogin ? "Log In to ApexTrade" : "Create your Account";
    if (authSubmitBtn) authSubmitBtn.textContent  = isLogin ? "LOG IN" : "SIGN UP";
    document.querySelectorAll(".signup-only").forEach(el => el.classList.toggle("hidden", isLogin));
}

function showAuthError(message) {
    if (authErrorMsg) {
        authErrorMsg.textContent = message;
        authErrorMsg.classList.remove("hidden");
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();
    if (!authUsernameInput || !authPasswordInput) return;

    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    if (authMode === "SIGNUP") {
        const fullNameInput = document.getElementById("auth-fullname");
        const dobInput      = document.getElementById("auth-dob");
        const fullName      = fullNameInput?.value.trim() || "New User";
        const dob           = dobInput?.value || "2000-01-01";

        localStorage.setItem('user_credentials', JSON.stringify({
            username, password, fullName, dob,
            clientId:       "Pending",
            classification: "Trader",
            traderType:     "ACTIVE",
        }));

        // OTP is generated and shown via alert.
        // TODO: Replace with a server-side delivery mechanism (email/SMS) before production.
        current_otp = Math.floor(1000 + Math.random() * 9000);
        alert(`[ApexTrade Security] Your One-Time Password (OTP) is: ${current_otp}`);

        authForm?.classList.add("hidden");
        authTitle?.classList.add("hidden");
        authSubtitle?.classList.add("hidden");
        document.getElementById("otp-container")?.classList.remove("hidden");

    } else {
        const stored = JSON.parse(localStorage.getItem('user_credentials'));
        if (stored && stored.username === username && stored.password === password) {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.reload();
        } else {
            showAuthError("Invalid username or password.");
        }
    }
}

function handleVerifyOtp() {
    const digits = ["otp-1", "otp-2", "otp-3", "otp-4"].map(id => document.getElementById(id)?.value || "");
    const typedOtp = digits.join("");

    if (typedOtp === String(current_otp)) {
        const creds     = JSON.parse(localStorage.getItem('user_credentials'));
        creds.clientId  = generateClientId(creds.fullName, creds.dob);
        localStorage.setItem('user_credentials', JSON.stringify(creds));
        localStorage.setItem('isLoggedIn', 'true');
        window.location.reload();
    } else {
        document.getElementById("otp-error-msg")?.classList.remove("hidden");
    }
}

function performLogout() {
    localStorage.clear();
    window.location.reload();
}

// ==========================================================================
// ADMIN BRIDGE — Secure Cloud Storage (Google Apps Script)
// The frontend POSTs base64-encoded file data to the Apps Script web app.
// The Apps Script runs as Admin and writes to Google Drive server-side.
// No OAuth popup is ever triggered for the end user.
// ==========================================================================

const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwKWfkH0yGcH-wf0IE7NByB_ZqqbZPaalaQMuNuGVClzYeBpIeCvrbYTGjq6s5amugh/exec";

async function handleCloudAvatarUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please choose a valid image file.");
        return;
    }

    const cloudBtn = document.getElementById("cloud-sync-btn");
    if (cloudBtn) cloudBtn.textContent = "⏳ Uploading securely...";

    const creds      = getStoredCredentials();
    const customerId = creds?.clientId || "Unknown_Customer";

    const reader = new FileReader();
    reader.onload = async function () {
        const base64String = reader.result.split(',')[1];
        const payload = {
            filename: `${customerId}_profile_photo.jpg`,
            mimeType: file.type || 'image/jpeg',
            base64:   base64String,
        };

        try {
            const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: "POST",
                body:   JSON.stringify(payload),
            });
            const result = await response.json();

            if (result.status === 'success') {
             
if (result.status === 'success') {
            localStorage.setItem("user_avatar", reader.result);
            const avatarContainer = document.getElementById("profile-avatar-img-container");
            if (avatarContainer) {
                avatarContainer.innerHTML = `<img src="${reader.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" id="profile-avatar-img">`;
            }
            alert("Photo updated!"); // Success path
        } else {
            alert("Photo upload failed."); // Failure path
        }
            }
        } catch (error) {
            console.error("Bridge Transmission Error:", error);
            alert("Network error. Please check your connection and try again.");
        } finally {
            if (cloudBtn) cloudBtn.textContent = "☁️ Save to Google Drive";
        }
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// APP INITIALIZATION
// ==========================================================================

function initializeApp() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");

        if (!authListenersBound && authForm) {
            authForm.addEventListener("submit", handleAuthSubmit);
            authToggleLink?.addEventListener("click", e => {
                e.preventDefault();
                authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
                switchFormState();
            });
            document.getElementById("otp-verify-btn")?.addEventListener("click", handleVerifyOtp);
            authListenersBound = true;
        }
        return;
    }

    // --- AUTHENTICATED STATE ---
    document.getElementById('temp-auth-hide')?.remove();
    desktopWrapper?.classList.remove("hidden");
    authContainer?.classList.add("hidden");

    // Restore saved avatar if present
    const savedAvatar = localStorage.getItem("user_avatar");
    if (savedAvatar) {
        const avatarContainer = document.getElementById("profile-avatar-img-container");
        if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" id="profile-avatar-img">`;
        }
    }

    // Navigation bindings
    document.querySelector(".profile-btn")?.addEventListener("click", () => showProfilePanel(true));
    document.getElementById("profile-back-btn")?.addEventListener("click",    () => showProfilePanel(false));
    document.getElementById("back-to-dashboard-btn")?.addEventListener("click", () => showProfilePanel(false));

    // Cloud avatar upload — bound here once; the global binding below is removed.
    const cloudSyncBtn = document.getElementById("cloud-sync-btn");
    const avatarUpload = document.getElementById("avatar-upload");
    if (cloudSyncBtn && avatarUpload) {
        cloudSyncBtn.addEventListener("click", () => {
            const file = avatarUpload.files[0];
            if (!file) { alert("Please select a photo first."); return; }
            handleCloudAvatarUpload(file);
        });
    }

    // Core dashboard bindings
    logoutBtn?.addEventListener("click", performLogout);
    searchInput?.addEventListener("input", handleSearch);
    modalCloseBtn?.addEventListener("click", closeOrderModal);
    executeOrderBtn?.addEventListener("click", executeTransaction);

    if (toggleBuyBtn) {
        toggleBuyBtn.addEventListener("click", () => {
            currentTransactionType = "BUY";
            toggleBuyBtn.classList.add("active");
            toggleSellBtn?.classList.remove("active");
            if (selectedAsset) updateModalCalculations(selectedAsset.price);
        });
    }
    if (toggleSellBtn) {
        toggleSellBtn.addEventListener("click", () => {
            currentTransactionType = "SELL";
            toggleSellBtn.classList.add("active");
            toggleBuyBtn?.classList.remove("active");
            if (selectedAsset) updateModalCalculations(selectedAsset.price);
        });
    }
    if (transactionQtyInput) {
        transactionQtyInput.addEventListener("input", () => {
            if (selectedAsset) updateModalCalculations(selectedAsset.price);
        });
    }

    setupTabs();
    updateUI();
}

window.addEventListener("DOMContentLoaded", initializeApp);
