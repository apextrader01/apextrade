// ==========================================================================
// 1. IMPORTS & FIREBASE SETUP
// ==========================================================================
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ==========================================================================
// 2. STATE & MOCK DATA
// ==========================================================================
const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 205.20, change: -1.62 },
    { symbol: "ADANIPOWER", name: "Adani Power India Ltd.", price: 219.32, change: 0.77 },
    { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd.", price: 1367.90, change: -0.36 },
    { symbol: "WIPRO", name: "Wipro Ltd.", price: 202.97, change: 0.15 },
    { symbol: "GAIL", name: "GAIL India Ltd.", price: 160.77, change: 1.12 },
    { symbol: "KITEX", name: "Kitex Garments Ltd.", price: 157.86, change: 0.45 },
    { symbol: "APOLLOMICR", name: "Apollo Micro Systems Ltd.", price: 355.05, change: -0.85 },
];

INSTRUMENTS_DB.forEach(item => item.prevClose = item.price / (1 + item.change / 100));

let activeTab = "watchlist-tab";
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

let activeSearchQuery = "";
let selectedAsset = null;
let currentTransactionType = "BUY";
let authMode = "LOGIN";
let isDashboardInitialized = false;

// ==========================================================================
// 3. AUTHENTICATION CONTROLLER (THE GATEKEEPER)
// ==========================================================================
const authContainer = document.getElementById("auth-container");
const desktopWrapper = document.querySelector(".desktop-wrapper");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged In: Show Dashboard
        authContainer?.classList.add("hidden");
        desktopWrapper?.classList.remove("hidden");
        
        if (!isDashboardInitialized) {
            initializeDashboard();
            isDashboardInitialized = true;
        }
    } else {
        // Logged Out: Show Login Screen
        desktopWrapper?.classList.add("hidden");
        authContainer?.classList.remove("hidden");
    }
});

// ==========================================================================
// 4. LOGIN & SIGNUP FORMS
// ==========================================================================
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authToggleLink = document.getElementById("auth-toggle-link");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authErrorMsg = document.getElementById("auth-error-msg");

authToggleLink?.addEventListener("click", (e) => {
    e.preventDefault();
    authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
    
    const isLogin = authMode === "LOGIN";
    if (authTitle) authTitle.textContent = isLogin ? "Log In to ApexTrade" : "Create your Account";
    if (authSubmitBtn) authSubmitBtn.textContent = isLogin ? "LOG IN" : "SIGN UP";
    if (authToggleLink) authToggleLink.textContent = isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In";
    
    document.querySelectorAll(".signup-only").forEach(el => el.classList.toggle("hidden", isLogin));
    authErrorMsg?.classList.add("hidden");
});

authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    const fullName = document.getElementById("auth-fullname")?.value.trim() || "Trader";

    try {
        if (authMode === "SIGNUP") {
            await createUserWithEmailAndPassword(auth, email, password);
            localStorage.setItem("user_full_name", fullName); 
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        if (authErrorMsg) {
            authErrorMsg.textContent = "Error: " + error.message;
            authErrorMsg.classList.remove("hidden");
        } else {
            alert("Error: " + error.message);
        }
    }
});

// ==========================================================================
// 5. DASHBOARD INITIALIZATION
// ==========================================================================
function initializeDashboard() {
    console.log("ApexTrade Terminal Booting...");

    // Bind Logout
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

    // Bind Profile Nav
    document.querySelector(".profile-btn")?.addEventListener("click", () => showProfilePanel(true));
    document.getElementById("profile-back-btn")?.addEventListener("click", () => showProfilePanel(false));
    document.getElementById("back-to-dashboard-btn")?.addEventListener("click", () => showProfilePanel(false));

    // Avatar Upload Binding
    const cloudSyncBtn = document.getElementById("cloud-sync-btn");
    const avatarUpload = document.getElementById("avatar-upload");
    cloudSyncBtn?.addEventListener("click", () => {
        const file = avatarUpload?.files[0];
        if (!file) { alert("Please select a photo first."); return; }
        handleCloudAvatarUpload(file);
    });

    // Restore Avatar
    const savedAvatar = localStorage.getItem("user_avatar");
    const avatarContainer = document.getElementById("profile-avatar-img-container");
    if (savedAvatar && avatarContainer) {
        avatarContainer.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" id="profile-avatar-img">`;
    }

    setupTabs();
    updateUI();
    fetchNews();
}

// ==========================================================================
// 6. TERMINAL LOGIC
// ==========================================================================
async function fetchNews() {
    try {
        const newsSnapshot = await getDocs(collection(db, "news"));
        newsSnapshot.forEach((doc) => console.log("News:", doc.data().headline));
    } catch (e) {
        console.log("No news found.");
    }
}

function flattenString(str) { return str ? str.replace(/\s+/g, '').toUpperCase() : ""; }

function handleSearch(event) {
    const rawValue = event.target.value;
    activeSearchQuery = rawValue;
    const searchClearBtn = document.getElementById("search-clear-btn");
    const searchDropdown = document.getElementById("search-dropdown");
    const searchDropdownList = document.getElementById("search-dropdown-list");

    searchClearBtn?.classList.toggle("hidden", rawValue.length === 0);

    const query = flattenString(rawValue);
    if (query === "") {
        searchDropdown?.classList.add("hidden");
        return;
    }

    const results = INSTRUMENTS_DB.filter(item =>
        flattenString(item.symbol).includes(query) || flattenString(item.name).includes(query)
    );
    
    if (results.length === 0) {
        if(searchDropdownList) searchDropdownList.innerHTML = `<div class="dropdown-empty">No assets matching search</div>`;
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
    const starFill = isWatched ? 'currentColor' : 'none';

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
            <button class="action-icon-btn ${isWatched ? 'watched' : ''}" data-symbol="${item.symbol}">
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
        watchlistList.innerHTML = `<div class="empty-holdings" style="grid-column: span 2;">Watchlist empty.</div>`;
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
            executeBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        } else {
            executeBtn.className   = "btn-execute-order btn-sell";
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
    const user = auth.currentUser;
    if (!user) return;

    const email = user.email;
    const fullName = localStorage.getItem("user_full_name") || "Trader";
    const clientId = fullName.substring(0, 2).toUpperCase() + "02X"; 

    const setField = (id, value) => {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
    };

    setField("profile-client-name", fullName);
    setField("profile-email-display", email);
    setField("profile-client-id", clientId);
    setField("profile-dob-display", "2002-05-15"); 
    setField("profile-gender-display", "Male"); 
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

const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwKWfkH0yGcH-wf0IE7NByB_ZqqbZPaalaQMuNuGVClzYeBpIeCvrbYTGjq6s5amugh/exec";

async function handleCloudAvatarUpload(file) {
    if (!file.type.startsWith('image/')) { alert("Please choose a valid image file."); return; }

    const cloudBtn = document.getElementById("cloud-sync-btn");
    if (cloudBtn) cloudBtn.textContent = "⏳ Uploading securely...";

    const reader = new FileReader();
    reader.onload = async function () {
        const base64String = reader.result.split(',')[1];
        const payload = {
            filename: `profile_photo.jpg`,
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
                localStorage.setItem("user_avatar", reader.result);
                const avatarContainer = document.getElementById("profile-avatar-img-container");
                if (avatarContainer) avatarContainer.innerHTML = `<img src="${reader.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" id="profile-avatar-img">`;
                alert("Photo updated to Google Drive successfully!"); 
            } else { alert("Photo upload failed."); }
        } catch (error) { alert("Network error. Please try again."); } 
        finally { if (cloudBtn) cloudBtn.textContent = "☁️ Save to Google Drive"; }
    };
    reader.readAsDataURL(file);
}
