// app.js - Live Stock Portfolio & Market Simulation

// Check if user session token exists in storage immediately to hide flicker
// 🔐 Sync Google User Session with the Dashboard Gate Instantly
if (localStorage.getItem('current_user') && localStorage.getItem('isLoggedIn') !== 'true') {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('login_status', 'true');
}

// 🛡️ Existing Route Guard Security Check
if (localStorage.getItem('isLoggedIn') !== 'true') {
    const style = document.createElement('style');
    style.innerHTML = '.desktop-wrapper { display: none !important; }';
    style.id = 'temp-auth-hide';
    document.head.appendChild(style);
}

// 🌟 GOOGLE AUTH CONFIGURATION
const GOOGLE_CLIENT_ID = "338294665324-uo4kj0ffgsk0eucvlbihj6nvkfmdipo9.apps.googleusercontent.com";

// 🚀 1. Initialize Google Auth when the page loads
window.onload = function () {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleAuthResponse
        });
        
        // Renders the official Google button inside the element with id "google-btn"
        const btnContainer = document.getElementById("google-btn");
        if (btnContainer) {
            google.accounts.id.renderButton(
                btnContainer,
                { theme: "outline", size: "large", width: "100%", text: "signin_with" }
            );
        }
        
        // Displays the native Google One-Tap prompt on the side
        google.accounts.id.prompt(); 
    }
};

// 🔄 2. Automatically handle the customer's Google profile response
function handleGoogleAuthResponse(response) {
    const responsePayload = decodeJwtToken(response.credential);

    // 1. Break down the incoming Google full name string as base parameters
    const nameParts = responsePayload.name.trim().split(/\s+/);
    const defaultFirstName = nameParts[0] || "";
    const defaultLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const defaultMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    // 2. Pre-fill name fields inside the visible popup form interface
    if(document.getElementById('setup-fname')) document.getElementById('setup-fname').value = defaultFirstName;
    if(document.getElementById('setup-mname')) document.getElementById('setup-mname').value = defaultMiddleName;
    if(document.getElementById('setup-lname')) document.getElementById('setup-lname').value = defaultLastName;

    // 3. Render the interactive modal container on screen
    const modal = document.getElementById('profile-setup-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Form submission behavior tracking
        document.getElementById('profile-setup-form').onsubmit = function(e) {
            e.preventDefault();
            
            // Build reconstructed full name based on clean manual user edits
            const prefix = document.getElementById('setup-title').value;
            const fName = document.getElementById('setup-fname').value.trim();
            const mName = document.getElementById('setup-mname').value.trim();
            const lName = document.getElementById('setup-lname').value.trim();
            const combinedFullName = `${prefix} ${fName} ${mName ? mName + ' ' : ''}${lName}`;
            
            // 4. Map completely customizable fields into the core customer profile package
            const customerUser = {
                username: responsePayload.email,
                fullName: combinedFullName,
                profilePic: responsePayload.picture,
                clientId: generateAutomatedClientId(fName),
                email: responsePayload.email,
                dob: document.getElementById('setup-dob').value,
                gender: document.getElementById('setup-gender').value,
                classification: document.getElementById('setup-class').value,
                traderType: document.getElementById('setup-tradertype').value,
                nomineeName: document.getElementById('setup-nominee-name').value.trim(),
                nomineeRelation: document.getElementById('setup-nominee-relation').value.trim(),
                salutation: prefix
            };
            
            // Commit comprehensive account structures into persistent session engines
            localStorage.setItem('user_credentials', JSON.stringify(customerUser));
            localStorage.setItem('current_user', JSON.stringify(customerUser));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('login_status', 'true');
            
            // Clear view frame and execute instant boot seq
            modal.style.display = 'none';
            alert(`Welcome, ${customerUser.fullName}! Security onboarding profile locked successfully.`);
            window.location.reload();
        };
    } else {
        // Safe operational fallback state if structural rendering is blocked
        const fallbackProfile = {
            username: responsePayload.email,
            fullName: "Mr. " + responsePayload.name,
            profilePic: responsePayload.picture,
            clientId: generateAutomatedClientId(responsePayload.name),
            email: responsePayload.email,
            dob: "2002-05-15",
            gender: "Male",
            classification: "Trader",
            traderType: "ACTIVE",
            nomineeName: "Not Registered",
            nomineeRelation: "N/A",
            salutation: "Mr."
        };
        localStorage.setItem('user_credentials', JSON.stringify(fallbackProfile));
        localStorage.setItem('current_user', JSON.stringify(fallbackProfile));
        localStorage.setItem('isLoggedIn', 'true');
        window.location.reload();
    }
}

// 🛠️ Helper function to decode Google's secure token
function decodeJwtToken(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// 🛠️ Helper function to auto-generate a sleek Client ID for new users
function generateAutomatedClientId(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${initials}${randomNum}V`;
}

// Seed default user credentials if none exist, so the user can log in immediately
if (!localStorage.getItem('user_credentials')) {
    localStorage.setItem('user_credentials', JSON.stringify({
        username: "trader101",
        password: "password123",
        fullName: "Hari Krishnan I V",
        dob: "2002-05-15",
        clientId: "HA02V",
        classification: "Trader",
        traderType: "ACTIVE"
    }));
}

// Helper: generate unique client ID using formula
function generateClientId(fullName, dob) {
    if (!fullName || !dob) return "";
    const cleanedName = fullName.trim();
    if (cleanedName.length < 2) return "";
    
    const firstTwo = cleanedName.substring(0, 2).toUpperCase();
    
    let birthYear = "";
    if (dob.includes("-")) {
        const parts = dob.split("-");
        birthYear = parts[0].length === 4 ? parts[0] : parts[parts.length - 1];
    } else {
        birthYear = new Date(dob).getFullYear().toString();
    }
    const lastTwoYear = birthYear.slice(-2);
    const lastLetter = cleanedName.slice(-1).toUpperCase();
    
    return `${firstTwo}${lastTwoYear}${lastLetter}`;
}

// Instruments Database
const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 205.20, change: -1.62 },
    { symbol: "ADANIPOWER", name: "Adani Power India Ltd.", price: 219.32, change: 0.77 },
    { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd.", price: 1367.90, change: -0.36 },
    { symbol: "WIPRO", name: "Wipro Ltd.", price: 202.97, change: 0.15 },
    { symbol: "GAIL", name: "GAIL India Ltd.", price: 160.77, change: 1.12 },
    { symbol: "KITEX", name: "Kitex Garments Ltd.", price: 157.86, change: 0.45 },
    { symbol: "APOLLOMICR", name: "Apollo Micro Systems Ltd.", price: 355.05, change: -0.85 }
];

INSTRUMENTS_DB.forEach(item => {
    item.prevClose = item.price / (1 + item.change / 100);
});

let activeTab = "watchlist-tab";
let watchlistSymbols = ["TATASTEEL", "ADANIPOWER", "WIPRO", "GAIL", "KITEX"];

let portfolioHoldings = [
    { symbol: "TATASTEEL", qty: 200, avgBuyPrice: 198.50 },
    { symbol: "WIPRO", qty: 250, avgBuyPrice: 190.20 },
    { symbol: "GAIL", qty: 332, avgBuyPrice: 148.50 }
];

let cashBalance = 72.36; 

let transactionLogs = [
    { type: "BUY", symbol: "TATASTEEL", qty: 200, price: 198.50, date: "2026-05-20" },
    { type: "BUY", symbol: "WIPRO", qty: 250, price: 190.20, date: "2026-05-21" },
    { type: "BUY", symbol: "GAIL", qty: 332, price: 148.50, date: "2026-05-22" }
];

let previousPricesMap = {};
INSTRUMENTS_DB.forEach(item => {
    previousPricesMap[item.symbol] = item.price;
});

let lastTotalPortfolioValue = 145230.50;
let activeSearchQuery = "";
let selectedAsset = null;
let currentTransactionType = "BUY";

// DOM Elements Link
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear-btn");
const searchDropdown = document.getElementById("search-dropdown");
const searchDropdownList = document.getElementById("search-dropdown-list");
const watchlistList = document.getElementById("watchlist-list");
const holdingsList = document.getElementById("holdings-list");
const activityLogList = document.getElementById("activity-log-list");
const portfolioBalanceEl = document.getElementById("portfolio-balance");
const portfolioChangeBadge = document.getElementById("portfolio-change-badge");
const balanceCard = document.getElementById("balance-card");
const statusTimeEl = document.getElementById("status-time");
const portfolioInvestedEl = document.getElementById("portfolio-invested");
const portfolioPnlEl = document.getElementById("portfolio-pnl");
const watchlistCountEl = document.getElementById("watchlist-count");

// Transaction Modal Elements
const transactionModal = document.getElementById("transaction-modal");
const modalTicker = document.getElementById("modal-ticker");
const modalName = document.getElementById("modal-name");
const modalLivePrice = document.getElementById("modal-live-price");
const modalCloseBtn = document.getElementById("modal-close-btn");
const toggleBuyBtn = document.getElementById("toggle-buy-btn");
const toggleSellBtn = document.getElementById("toggle-sell-btn");
const transactionQtyInput = document.getElementById("transaction-qty");
const qtyMinusBtn = document.getElementById("qty-minus");
const qtyPlusBtn = document.getElementById("qty-plus");
const modalOrderValue = document.getElementById("modal-order-value");
const modalTradingFee = document.getElementById("modal-trading-fee");
const executeOrderBtn = document.getElementById("execute-order-btn");

// Auth Overlay Elements
let authMode = "LOGIN"; 
let authListenersBound = false;
let current_otp = null;

const authContainer = document.getElementById("auth-container");
const desktopWrapper = document.querySelector(".desktop-wrapper");
const authForm = document.getElementById("auth-form");
const authUsernameInput = document.getElementById("auth-username");
const authPasswordInput = document.getElementById("auth-password");
const authErrorMsg = document.getElementById("auth-error-msg");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authToggleText = document.getElementById("auth-toggle-text");
const authToggleLink = document.getElementById("auth-toggle-link");
const logoutBtn = document.getElementById("logout-btn");

function flattenString(str) {
    if (!str) return "";
    return str.replace(/\s+/g, '').toUpperCase();
}

function handleSearch(event) {
    const rawValue = event.target.value;
    activeSearchQuery = rawValue;

    if (rawValue.length > 0) {
        searchClearBtn.classList.remove("hidden");
    } else {
        searchClearBtn.classList.add("hidden");
    }

    const query = flattenString(rawValue);
    if (query === "") {
        searchDropdown.classList.add("hidden");
        return;
    }

    const filteredResults = INSTRUMENTS_DB.filter(item => {
        return flattenString(item.symbol).includes(query) || flattenString(item.name).includes(query);
    });

    renderSearchResults(filteredResults);
}

function renderSearchResults(results) {
    if (results.length === 0) {
        searchDropdownList.innerHTML = `<div class="dropdown-empty">No assets matching search</div>`;
        searchDropdown.classList.remove("hidden");
        return;
    }

    searchDropdownList.innerHTML = "";
    results.forEach(item => {
        const isPositive = item.change >= 0;
        const changeClass = isPositive ? "text-positive" : "text-negative";
        const sign = isPositive ? "+" : "";
        const isWatched = watchlistSymbols.includes(item.symbol);
        
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
                <button class="action-icon-btn ${isWatched ? 'watched' : ''}" data-symbol="${item.symbol}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="${isWatched ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                </button>
            </div>
        `;
        searchDropdownList.appendChild(row);
    });

    searchDropdownList.querySelectorAll(".action-icon-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleWatchlist(btn.getAttribute("data-symbol"));
        });
    });
    searchDropdown.classList.remove("hidden");
}

function toggleWatchlist(symbol) {
    const index = watchlistSymbols.indexOf(symbol);
    if (index > -1) {
        watchlistSymbols.splice(index, 1);
    } else {
        watchlistSymbols.push(symbol);
    }
    renderWatchlist();
}

function renderWatchlist() {
    watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    if (watchlistSymbols.length === 0) {
        watchlistList.innerHTML = `<div class="empty-holdings" style="grid-column: span 2;">Watchlist empty.</div>`;
        return;
    }

    watchlistList.innerHTML = "";
    watchlistSymbols.forEach(symbol => {
        const item = INSTRUMENTS_DB.find(i => i.symbol === symbol);
        if (!item) return;

        const isPositive = item.change >= 0;
        const changeClass = isPositive ? "text-positive" : "text-negative";
        const sign = isPositive ? "+" : "";

        const row = document.createElement("div");
        row.className = `instrument-row`;
        row.addEventListener("click", (e) => {
            if (e.target.closest(".action-icon-btn")) return;
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
                <button class="action-icon-btn watched" data-symbol="${item.symbol}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                </button>
            </div>
        `;
        watchlistList.appendChild(row);
    });

    watchlistList.querySelectorAll(".action-icon-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleWatchlist(btn.getAttribute("data-symbol"));
        });
    });
}

function renderPortfolio() {
    if (portfolioHoldings.length === 0) {
        holdingsList.innerHTML = `<div class="empty-holdings">No active stock holdings.</div>`;
    } else {
        holdingsList.innerHTML = "";
        portfolioHoldings.forEach(holding => {
            const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
            if (!asset) return;

            const currentVal = holding.qty * asset.price;
            const investedVal = holding.qty * holding.avgBuyPrice;
            const pnl = currentVal - investedVal;
            const pnlPercent = (pnl / investedVal) * 100;
            const pnlClass = pnl >= 0 ? "pnl-positive" : "pnl-negative";
            const sign = pnl >= 0 ? "+" : "";

            const card = document.createElement("div");
            card.className = `holding-card`;
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

    activityLogList.innerHTML = "";
    if (transactionLogs.length === 0) {
        activityLogList.innerHTML = `<div class="dropdown-empty">No transaction history</div>`;
    } else {
        transactionLogs.slice(-5).reverse().forEach(log => {
            const isBuy = log.type === "BUY";
            const total = log.qty * log.price;
            
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

    let totalInvested = 0;
    let totalCurrentValue = 0;
    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) {
            totalInvested += holding.qty * holding.avgBuyPrice;
            totalCurrentValue += holding.qty * asset.price;
        }
    });

    const netPnl = totalCurrentValue - totalInvested;
    const netPnlPercent = totalInvested > 0 ? (netPnl / totalInvested) * 100 : 0;
    const netPnlClass = netPnl >= 0 ? "pnl-positive" : "pnl-negative";
    const netSign = netPnl >= 0 ? "+" : "";

    portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    portfolioPnlEl.className = `stat-value ${netPnlClass}`;
    portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
}

function updateUI() {
    renderWatchlist();
    renderPortfolio();
    updatePortfolioBalance();
}

function updatePortfolioBalance() {
    let holdingsValue = 0;
    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) holdingsValue += holding.qty * asset.price;
    });

    const totalPortfolioValue = holdingsValue + cashBalance;
    portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    let dailyInvested = 0;
    let dailyChangeVal = 0;
    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) {
            dailyChangeVal += (holding.qty * asset.price - holding.qty * asset.prevClose);
            dailyInvested += holding.qty * asset.prevClose;
        }
    });

    const dailyPercent = dailyInvested > 0 ? (dailyChangeVal / dailyInvested) * 100 : 0;
    const isPos = dailyChangeVal >= 0;
    portfolioChangeBadge.className = `change-badge ${isPos ? "pnl-positive" : "pnl-negative"}`;
    portfolioChangeBadge.textContent = `${isPos ? "+" : ""}₹${Math.abs(dailyChangeVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${isPos ? "+" : ""}${dailyPercent.toFixed(2)}%)`;
}

function startLiveTicker() {}

function openOrderModal(asset) {
    selectedAsset = asset;
    modalTicker.textContent = asset.symbol;
    modalName.textContent = asset.name;
    modalLivePrice.textContent = asset.price.toFixed(2);
    
    currentTransactionType = "BUY";
    toggleBuyBtn.classList.add("active");
    toggleSellBtn.classList.remove("active");
    
    transactionQtyInput.value = "10";
    updateModalCalculations(asset.price);
    transactionModal.classList.remove("hidden");
}

function updateModalCalculations(price) {
    const qty = parseInt(transactionQtyInput.value) || 0;
    const estVal = qty * price;
    const fee = estVal * 0.0005;
    
    modalOrderValue.textContent = estVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    modalTradingFee.textContent = fee.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    if (currentTransactionType === "BUY") {
        executeOrderBtn.className = "btn-execute-order btn-buy";
        executeOrderBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
    } else {
        executeOrderBtn.className = "btn-execute-order btn-sell";
        executeOrderBtn.textContent = `CONFIRM SELL ORDER (₹${(estVal - fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
    }
}

function closeOrderModal() {
    transactionModal.classList.add("hidden");
    selectedAsset = null;
}

function executeTransaction() {
    if (!selectedAsset) return;
    const qty = parseInt(transactionQtyInput.value);
    if (!qty || qty <= 0) return alert("Please enter a valid quantity.");
    
    const liveAsset = INSTRUMENTS_DB.find(i => i.symbol === selectedAsset.symbol);
    const executionPrice = liveAsset.price;
    const orderVal = qty * executionPrice;
    const fee = orderVal * 0.0005;
    
    if (currentTransactionType === "BUY") {
        cashBalance -= (orderVal + fee);
        const existingHolding = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (existingHolding) {
            const oldCost = existingHolding.qty * existingHolding.avgBuyPrice;
            existingHolding.qty += qty;
            existingHolding.avgBuyPrice = parseFloat(((oldCost + orderVal) / existingHolding.qty).toFixed(2));
        } else {
            portfolioHoldings.push({ symbol: liveAsset.symbol, qty: qty, avgBuyPrice: executionPrice });
        }
        // ==========================================================================
// 📊 MASTER PROFILE PANEL NAVIGATION & LAYOUT OVERLAY ROUTER
// ==========================================================================

// Override and patch renderProfileDetails to safely sync Google payloads with DOM nodes
function renderProfileDetails() {
    const nameDisplay = document.getElementById("profile-client-name");
    const dobDisplay = document.getElementById("profile-dob-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const clientIdDisplay = document.getElementById("profile-client-id");
    const verificationStatus = document.getElementById("profile-verification-status");
    const genderDisplay = document.getElementById("profile-gender-display");
    const experienceDisplay = document.getElementById("profile-experience-display");
    const segmentsDisplay = document.getElementById("profile-segments-display");
    
    // Retrieve dynamic active user storage keys or standard fallbacks
    const targetSession = localStorage.getItem('current_user') || localStorage.getItem('user_credentials');
    let creds = {};
    if (targetSession) {
        creds = JSON.parse(targetSession);
    }
    
    // Extract properties safely with production fallbacks
    const fullName = creds.fullName || "Hari Krishnan I V";
    const dob = creds.dob || "2002-03-19";
    const email = creds.email || creds.username || "appwebsitetester@gmail.com";
    const clientId = creds.clientId || "HA02V";
    const gender = creds.gender || "Male";
    const experience = creds.experience || "1-3 Years";
    const segments = creds.segments || ["Cash", "Derivatives"];
    
    // Mount text fields to DOM structures safely if nodes are present
    if (nameDisplay) nameDisplay.textContent = fullName;
    if (dobDisplay) dobDisplay.textContent = dob;
    if (emailDisplay) emailDisplay.textContent = email;
    if (clientIdDisplay) clientIdDisplay.textContent = clientId;
    if (genderDisplay) genderDisplay.textContent = gender;
    if (experienceDisplay) experienceDisplay.textContent = experience;
    if (segmentsDisplay) segmentsDisplay.textContent = (Array.isArray(segments) ? segments.join(", ") : segments);
    
    // Render custom profile avatar base64 or secure asset links
    const userAvatar = localStorage.getItem('user_avatar') || creds.profilePic;
    const avatarContainer = document.getElementById("profile-avatar-img-container");
    if (avatarContainer) {
        if (userAvatar) {
            avatarContainer.innerHTML = `<img src="${userAvatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" id="profile-avatar-img">`;
        } else {
            avatarContainer.innerHTML = `
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
        }
    }
    
    if (verificationStatus) {
        verificationStatus.textContent = "✓ VERIFIED ACCOUNT";
        verificationStatus.className = "verification-badge verified";
    }
}

// Global UI Live Real-Time Registration Event Binder
document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        renderProfileDetails();
    }
});
    } else {
        const existingHolding = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (!existingHolding || existingHolding.qty < qty) return alert("Insufficient holdings!");
        
        cashBalance += (orderVal - fee);
        existingHolding.qty -= qty;
        if (existingHolding.qty === 0) portfolioHoldings = portfolioHoldings.filter(h => h.symbol !== liveAsset.symbol);
    }
    
    transactionLogs.push({ type: currentTransactionType, symbol: liveAsset.symbol, qty: qty, price: executionPrice, date: new Date().toISOString().split('T')[0] });
    updateUI();
    closeOrderModal();
}

function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.getAttribute("data-tab");
            if (targetTab === "profile-panel") {
                showProfilePanel(true);
            } else {
                showProfilePanel(false);
                document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                activeTab = targetTab;
                document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
                if (document.getElementById(targetTab)) document.getElementById(targetTab).classList.add("active");
                updateUI();
            }
        });
    });
}

function showProfilePanel(show) {
    const profilePanel = document.getElementById("profile-panel");
    const dashboardMainView = document.getElementById("dashboard-main-view");
    
    if (show) {
        if (dashboardMainView) dashboardMainView.classList.add("hidden");
        if (profilePanel) {
            profilePanel.classList.remove("hidden");
            profilePanel.classList.add("active");
            profilePanel.style.display = "block";
        }
        renderProfileDetails();
    } else {
        if (profilePanel) {
            profilePanel.classList.add("hidden");
            profilePanel.classList.remove("active");
            profilePanel.style.display = "none";
        }
        if (dashboardMainView) {
            dashboardMainView.classList.remove("hidden");
            dashboardMainView.style.display = "block";
        }
    }
}

function startClock() {
    function updateClock() {
        const now = new Date();
        let hours = String(now.getHours()).padStart(2, '0');
        let minutes = String(now.getMinutes()).padStart(2, '0');
        statusTimeEl.textContent = `${hours}:${minutes}`;
    }
    updateClock();
    setInterval(updateClock, 60000);
}

function handleAuthSubmit(event) {
    event.preventDefault();
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;
    
    if (authMode === "SIGNUP") {
        const fullName = document.getElementById("auth-fullname").value.trim();
        const dob = document.getElementById("auth-dob").value;
        localStorage.setItem('user_credentials', JSON.stringify({ username, password, fullName, dob, clientId: "Pending", classification: "Trader", traderType: "ACTIVE" }));
        
        current_otp = Math.floor(1000 + Math.random() * 9000);
        alert(`[ApexTrade Security] Your One-Time Password (OTP) is: ${current_otp}`);
        
        authForm.classList.add("hidden");
        authTitle.classList.add("hidden");
        authSubtitle.classList.add("hidden");
        document.getElementById("otp-container").classList.remove("hidden");
    } else {
        const storedCreds = JSON.parse(localStorage.getItem('user_credentials'));
        if (storedCreds && storedCreds.username === username && storedCreds.password === password) {
            localStorage.setItem('isLoggedIn', 'true');
            initializeApp();
        } else {
            showAuthError("Invalid username or password.");
        }
    }
}

function handleVerifyOtp() {
    const typedOtp = document.getElementById("otp-1").value + document.getElementById("otp-2").value + document.getElementById("otp-3").value + document.getElementById("otp-4").value;
    if (typedOtp === String(current_otp)) {
        localStorage.setItem('isLoggedIn', 'true');
        const creds = JSON.parse(localStorage.getItem('user_credentials'));
        creds.clientId = generateClientId(creds.fullName, creds.dob);
        localStorage.setItem('user_credentials', JSON.stringify(creds));
        
        document.getElementById("otp-container").classList.add("hidden");
        authForm.classList.remove("hidden");
        authTitle.classList.remove("hidden");
        authSubtitle.classList.remove("hidden");
        authMode = "LOGIN";
        switchFormState();
        initializeApp();
    } else {
        document.getElementById("otp-error-msg").classList.remove("hidden");
    }
}

function showAuthError(message) {
    authErrorMsg.textContent = message;
    authErrorMsg.classList.remove("hidden");
}

function switchFormState() {
    if (authMode === "LOGIN") {
        authTitle.textContent = "Log In to ApexTrade";
        authSubmitBtn.textContent = "LOG IN";
        document.querySelectorAll(".signup-only").forEach(el => el.classList.add("hidden"));
    } else {
        authTitle.textContent = "Create your Account";
        authSubmitBtn.textContent = "SIGN UP";
        document.querySelectorAll(".signup-only").forEach(el => el.classList.remove("hidden"));
    }
}

function renderProfileDetails() {
    const creds = JSON.parse(localStorage.getItem('current_user') || localStorage.getItem('user_credentials'));
    if (!creds) return;

    if (document.getElementById("profile-client-name")) document.getElementById("profile-client-name").textContent = creds.fullName;
    if (document.getElementById("profile-dob-display")) document.getElementById("profile-dob-display").textContent = creds.dob || "—";
    if (document.getElementById("profile-email-display")) document.getElementById("profile-email-display").textContent = creds.username || creds.email;
    if (document.getElementById("profile-client-id")) document.getElementById("profile-client-id").textContent = creds.clientId || "HA02V";
    if (document.getElementById("profile-gender-display")) document.getElementById("profile-gender-display").textContent = creds.gender || "Male";
    if (document.getElementById("profile-verification-status")) document.getElementById("profile-verification-status").textContent = "✓ VERIFIED ACCOUNT";
}

function performLogout() {
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('current_user');
    window.location.reload();
}

function initializeApp() {
    if (!authListenersBound) {
        authForm.addEventListener("submit", handleAuthSubmit);
        authToggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
            switchFormState();
        });
        logoutBtn.addEventListener("click", performLogout);
        document.getElementById("otp-verify-btn").addEventListener("click", handleVerifyOtp);
        authListenersBound = true;
    }

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        desktopWrapper.classList.add("hidden");
        authContainer.classList.remove("hidden");
        return;
    }

    desktopWrapper.classList.remove("hidden");
    authContainer.classList.add("hidden");
    
    startClock();
    setupTabs();
    updateUI();
}

// 📊 Global UI Real-Time Registration Render Engine
document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const userData = JSON.parse(localStorage.getItem('current_user') || localStorage.getItem('user_credentials'));
        if (userData) {
            // Update Core Layout Dashboard Indicators
            if (document.getElementById('profile-client-name')) document.getElementById('profile-client-name').innerText = userData.fullName || "—";
            if (document.getElementById('profile-dob-display')) document.getElementById('profile-dob-display').innerText = userData.dob || "—";
            if (document.getElementById('profile-gender-display')) document.getElementById('profile-gender-display').innerText = userData.gender || "Male";
            if (document.getElementById('profile-email-display')) document.getElementById('profile-email-display').innerText = userData.email || userData.username || "—";
        }
    }
});

window.addEventListener("DOMContentLoaded", initializeApp);
