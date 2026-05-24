// app.js - Optimized Premium Stock Portfolio & Terminal Router Engine

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
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"; 
let tokenClient;
let currentAccessToken = null;
const GOOGLE_CLIENT_ID = "338294665324-uo4kj0ffgsk0eucvlbihj6nvkfmdipo9.apps.googleusercontent.com";

// 🔄 Automatically handle the customer's Google profile response
function handleGoogleAuthResponse(response) {
    try {
        const responsePayload = decodeJwtToken(response.credential);
        const fullNameStr = responsePayload.name || "User";
        const nameParts = fullNameStr.trim().split(/\s+/);
        
        const defaultFirstName = nameParts[0] || "";
        const defaultLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
        const defaultMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

        if(document.getElementById('setup-fname')) document.getElementById('setup-fname').value = defaultFirstName;
        if(document.getElementById('setup-mname')) document.getElementById('setup-mname').value = defaultMiddleName;
        if(document.getElementById('setup-lname')) document.getElementById('setup-lname').value = defaultLastName;

        const modal = document.getElementById('profile-setup-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            document.getElementById('profile-setup-form').onsubmit = function(e) {
                e.preventDefault();
                const prefix = document.getElementById('setup-title').value;
                const fName = document.getElementById('setup-fname').value.trim();
                const mName = document.getElementById('setup-mname').value.trim();
                const lName = document.getElementById('setup-lname').value.trim();
                const combinedFullName = `${prefix} ${fName} ${mName ? mName + ' ' : ''}${lName}`;
                
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
                
                localStorage.setItem('user_credentials', JSON.stringify(customerUser));
                localStorage.setItem('current_user', JSON.stringify(customerUser));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('login_status', 'true');
                
                modal.style.display = 'none';
                alert(`Welcome, ${customerUser.fullName}! Security onboarding profile locked successfully.`);
                window.location.reload();
            };
        } else {
            const fallbackProfile = {
                username: responsePayload.email,
                fullName: "Mr. " + fullNameStr,
                profilePic: responsePayload.picture,
                clientId: generateAutomatedClientId(fullNameStr),
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
    } catch (err) {
        console.error("Google Login Parsing Error:", err);
    }
}

// 🛠️ Helper function to decode Google's secure token
function decodeJwtToken(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// 🛠️ Helper function to auto-generate a sleek Client ID
function generateAutomatedClientId(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${initials}${randomNum}V`;
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

// Seed default user credentials
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

// ==========================================================================
// 📊 DATABASE & STATE MANAGEMENT
// ==========================================================================

const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 205.20, change: -1.62 },
    { symbol: "ADANIPOWER", name: "Adani Power India Ltd.", price: 219.32, change: 0.77 },
    { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd.", price: 1367.90, change: -0.36 },
    { symbol: "WIPRO", name: "Wipro Ltd.", price: 202.97, change: 0.15 },
    { symbol: "GAIL", name: "GAIL India Ltd.", price: 160.77, change: 1.12 },
    { symbol: "KITEX", name: "Kitex Garments Ltd.", price: 157.86, change: 0.45 },
    { symbol: "APOLLOMICR", name: "Apollo Micro Systems Ltd.", price: 355.05, change: -0.85 }
];

INSTRUMENTS_DB.forEach(item => { item.prevClose = item.price / (1 + item.change / 100); });

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
INSTRUMENTS_DB.forEach(item => { previousPricesMap[item.symbol] = item.price; });

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
const authToggleLink = document.getElementById("auth-toggle-link");
const logoutBtn = document.getElementById("logout-btn");

// ==========================================================================
// 🛠️ CORE FUNCTIONS & UI RENDERERS
// ==========================================================================

function flattenString(str) { return str ? str.replace(/\s+/g, '').toUpperCase() : ""; }

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
    if (index > -1) { watchlistSymbols.splice(index, 1); } 
    else { watchlistSymbols.push(symbol); }
    renderWatchlist();
}

function renderWatchlist() {
    if(watchlistCountEl) watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    if (!watchlistList) return;
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
    if(!holdingsList) return;
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

    if(activityLogList) {
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
    }

    // Update Overall Stats
    const netPnl = totalCurrentValue - totalInvested;
    const netPnlPercent = totalInvested > 0 ? (netPnl / totalInvested) * 100 : 0;
    const netPnlClass = netPnl >= 0 ? "pnl-positive" : "pnl-negative";
    const netSign = netPnl >= 0 ? "+" : "";

    if(portfolioInvestedEl) portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if(portfolioPnlEl) {
        portfolioPnlEl.className = `stat-value ${netPnlClass}`;
        portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
    }
}

function updatePortfolioBalance() {
    let holdingsValue = 0;
    let dailyInvested = 0;
    let dailyChangeVal = 0;

    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) {
            holdingsValue += holding.qty * asset.price;
            dailyChangeVal += (holding.qty * asset.price - holding.qty * asset.prevClose);
            dailyInvested += holding.qty * asset.prevClose;
        }
    });

    const totalPortfolioValue = holdingsValue + cashBalance;
    if(portfolioBalanceEl) portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const dailyPercent = dailyInvested > 0 ? (dailyChangeVal / dailyInvested) * 100 : 0;
    const isPos = dailyChangeVal >= 0;
    if(portfolioChangeBadge) {
        portfolioChangeBadge.className = `change-badge ${isPos ? "pnl-positive" : "pnl-negative"}`;
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
    if(modalTicker) modalTicker.textContent = asset.symbol;
    if(modalName) modalName.textContent = asset.name;
    if(modalLivePrice) modalLivePrice.textContent = asset.price.toFixed(2);
    
    currentTransactionType = "BUY";
    if(toggleBuyBtn) toggleBuyBtn.classList.add("active");
    if(toggleSellBtn) toggleSellBtn.classList.remove("active");
    
    if(transactionQtyInput) {
        transactionQtyInput.value = "10";
        updateModalCalculations(asset.price);
    }
    if(transactionModal) transactionModal.classList.remove("hidden");
}

function updateModalCalculations(price) {
    if(!transactionQtyInput) return;
    const qty = parseInt(transactionQtyInput.value) || 0;
    const estVal = qty * price;
    const fee = estVal * 0.0005;
    
    if(modalOrderValue) modalOrderValue.textContent = estVal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if(modalTradingFee) modalTradingFee.textContent = fee.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    if (currentTransactionType === "BUY") {
        if(executeOrderBtn) {
            executeOrderBtn.className = "btn-execute-order btn-buy";
            executeOrderBtn.textContent = `CONFIRM BUY ORDER (₹${(estVal + fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        }
    } else {
        if(executeOrderBtn) {
            executeOrderBtn.className = "btn-execute-order btn-sell";
            executeOrderBtn.textContent = `CONFIRM SELL ORDER (₹${(estVal - fee).toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
        }
    }
}

function closeOrderModal() {
    if(transactionModal) transactionModal.classList.add("hidden");
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

function showProfilePanel(show) {
    const profilePanel = document.getElementById("profile-panel");
    const dashboardMainView = document.getElementById("dashboard-main-view");
    
    if (show) {
        if (dashboardMainView) {
            dashboardMainView.classList.add("hidden");
            dashboardMainView.style.setProperty('display', 'none', 'important');
        }
        if (profilePanel) {
            profilePanel.classList.remove("hidden");
            profilePanel.classList.add("active");
            profilePanel.style.setProperty('display', 'block', 'important');
        }
        renderProfileDetails();
    } else {
        if (profilePanel) {
            profilePanel.classList.add("hidden");
            profilePanel.classList.remove("active");
            profilePanel.style.setProperty('display', 'none', 'important');
        }
        if (dashboardMainView) {
            dashboardMainView.classList.remove("hidden");
            dashboardMainView.style.setProperty('display', 'block', 'important');
        }
        
        document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
        const defaultWatchTab = document.querySelector('button[data-tab="watchlist-tab"]');
        if(defaultWatchTab) defaultWatchTab.classList.add("active");
    }
}

function renderProfileDetails() {
    const creds = JSON.parse(localStorage.getItem('current_user') || localStorage.getItem('user_credentials'));
    if (!creds) return;

    if (document.getElementById("profile-client-name")) document.getElementById("profile-client-name").textContent = creds.fullName || "Hari Krishnan I V";
    if (document.getElementById("profile-dob-display")) document.getElementById("profile-dob-display").textContent = creds.dob || "2002-03-19";
    if (document.getElementById("profile-email-display")) document.getElementById("profile-email-display").textContent = creds.username || creds.email || "appwebsitetester@gmail.com";
    if (document.getElementById("profile-client-id")) document.getElementById("profile-client-id").textContent = creds.clientId || "HA02V";
    if (document.getElementById("profile-gender-display")) document.getElementById("profile-gender-display").textContent = creds.gender || "Male";
    if (document.getElementById("profile-verification-status")) {
        const vBadge = document.getElementById("profile-verification-status");
        vBadge.textContent = "✓ VERIFIED ACCOUNT";
        vBadge.className = "verification-badge verified";
    }
}

function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.onclick = function() {
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
        };
    });
}

// ==========================================================================
// 🔐 AUTHENTICATION & INITIALIZATION LOGIC
// ==========================================================================

function switchFormState() {
    if (authMode === "LOGIN") {
        if(authTitle) authTitle.textContent = "Log In to ApexTrade";
        if(authSubmitBtn) authSubmitBtn.textContent = "LOG IN";
        document.querySelectorAll(".signup-only").forEach(el => el.classList.add("hidden"));
    } else {
        if(authTitle) authTitle.textContent = "Create your Account";
        if(authSubmitBtn) authSubmitBtn.textContent = "SIGN UP";
        document.querySelectorAll(".signup-only").forEach(el => el.classList.remove("hidden"));
    }
}

function showAuthError(message) {
    if(authErrorMsg) {
        authErrorMsg.textContent = message;
        authErrorMsg.classList.remove("hidden");
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();
    if(!authUsernameInput || !authPasswordInput) return;
    
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;
    
    if (authMode === "SIGNUP") {
        const fullNameInput = document.getElementById("auth-fullname");
        const dobInput = document.getElementById("auth-dob");
        const fullName = fullNameInput ? fullNameInput.value.trim() : "New User";
        const dob = dobInput ? dobInput.value : "2000-01-01";
        
        localStorage.setItem('user_credentials', JSON.stringify({ username, password, fullName, dob, clientId: "Pending", classification: "Trader", traderType: "ACTIVE" }));
        
        current_otp = Math.floor(1000 + Math.random() * 9000);
        alert(`[ApexTrade Security] Your One-Time Password (OTP) is: ${current_otp}`);
        
        if(authForm) authForm.classList.add("hidden");
        if(authTitle) authTitle.classList.add("hidden");
        if(authSubtitle) authSubtitle.classList.add("hidden");
        const otpContainer = document.getElementById("otp-container");
        if(otpContainer) otpContainer.classList.remove("hidden");
    } else {
        const storedCreds = JSON.parse(localStorage.getItem('user_credentials'));
        if (storedCreds && storedCreds.username === username && storedCreds.password === password) {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.reload(); 
        } else {
            showAuthError("Invalid username or password.");
        }
    }
}

function handleVerifyOtp() {
    const otp1 = document.getElementById("otp-1");
    const otp2 = document.getElementById("otp-2");
    const otp3 = document.getElementById("otp-3");
    const otp4 = document.getElementById("otp-4");
    if(!otp1 || !otp2 || !otp3 || !otp4) return;

    const typedOtp = otp1.value + otp2.value + otp3.value + otp4.value;
    if (typedOtp === String(current_otp)) {
        localStorage.setItem('isLoggedIn', 'true');
        const creds = JSON.parse(localStorage.getItem('user_credentials'));
        creds.clientId = generateClientId(creds.fullName, creds.dob);
        localStorage.setItem('user_credentials', JSON.stringify(creds));
        window.location.reload(); 
    } else {
        const otpErrorMsg = document.getElementById("otp-error-msg");
        if(otpErrorMsg) otpErrorMsg.classList.remove("hidden");
    }
}

function performLogout() {
    localStorage.clear();
    window.location.reload();
}

function initializeApp() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        if(desktopWrapper) desktopWrapper.classList.add("hidden");
        if(authContainer) authContainer.classList.remove("hidden");
        
        if (!authListenersBound && authForm) {
            authForm.addEventListener("submit", handleAuthSubmit);
            if(authToggleLink) {
                authToggleLink.onclick = function(e) {
                    e.preventDefault();
                    authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
                    switchFormState();
                };
            }
            const otpVerifyBtn = document.getElementById("otp-verify-btn");
            if(otpVerifyBtn) otpVerifyBtn.onclick = handleVerifyOtp;
            authListenersBound = true;
        }
        return;
    }

    // --- LOGGED IN SECURE STATE ---
    const tempHideStyle = document.getElementById('temp-auth-hide');
    if(tempHideStyle) tempHideStyle.remove();

    if(desktopWrapper) desktopWrapper.classList.remove("hidden");
    if(authContainer) authContainer.classList.add("hidden");
    
    const savedAvatar = localStorage.getItem("user_avatar");
    if (savedAvatar) {
        const avatarContainer = document.getElementById("profile-avatar-img-container");
        if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${savedAvatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" id="profile-avatar-img">`;
        }
    }

    const headerProfileBtn = document.querySelector(".profile-btn");
    if (headerProfileBtn) headerProfileBtn.onclick = () => showProfilePanel(true);
    const profileBackBtn = document.getElementById("profile-back-btn");
    if (profileBackBtn) profileBackBtn.onclick = () => showProfilePanel(false);
    const backToDashboardBtn = document.getElementById("back-to-dashboard-btn");
    if (backToDashboardBtn) backToDashboardBtn.onclick = () => showProfilePanel(false);
    
    // 📸 NEW: Bound direct button to handle Google Drive logic cleanly
    const avatarUpload = document.getElementById("avatar-upload");
    const cloudSyncBtn = document.getElementById("cloud-sync-btn");
    if (cloudSyncBtn && avatarUpload) {
        cloudSyncBtn.onclick = function() {
            const file = avatarUpload.files[0];
            if (!file) {
                alert("Please select a photo first!");
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please choose a valid image file layout.');
                return;
            }
            // Button securely clicked, triggers Google
            handleCloudAvatarUpload(file);
        };
    }

    initializeGoogleTokenEngine();
    if(logoutBtn) logoutBtn.onclick = performLogout;
    
    if(searchInput) searchInput.addEventListener("input", handleSearch);
    if(modalCloseBtn) modalCloseBtn.addEventListener("click", closeOrderModal);
    if(executeOrderBtn) executeOrderBtn.addEventListener("click", executeTransaction);

    setupTabs();
    updateUI();
}

// ==========================================================================
// ☁️ GOOGLE DRIVE 15GB FREE STORAGE MANAGEMENT SYSTEM
// ==========================================================================

function initializeGoogleTokenEngine() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_DRIVE_SCOPE,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    currentAccessToken = tokenResponse.access_token;
                    localStorage.setItem('google_access_token', currentAccessToken);
                    console.log("Google Drive 15GB Stream Storage Authenticated.");
                }
            },
        });
    }
}

async function handleCloudAvatarUpload(file) {
    if (!tokenClient) {
        initializeGoogleTokenEngine();
    }
    if (!currentAccessToken) {
        currentAccessToken = localStorage.getItem('google_access_token');
    }
    
    if (!currentAccessToken && tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
    } else if (!tokenClient) {
        alert("Google's security script is being blocked by your browser or is still loading. Please refresh the page and try again.");
        return;
    }

    try {
        let folderId = localStorage.getItem('google_drive_folder_id');
        if (!folderId) {
            folderId = await getOrCreateDriveFolder(currentAccessToken);
            if (folderId) localStorage.setItem('google_drive_folder_id', folderId);
        }
        await sendFileStreamToGoogleDrive(file, folderId, currentAccessToken);
    } catch (error) {
        console.error("Cloud Storage Pipeline Intercept Fault:", error);
        tokenClient.requestAccessToken({ prompt: 'none' });
    }
}

async function getOrCreateDriveFolder(accessToken) {
    const query = encodeURIComponent("name = 'ApexTrade_Terminal_Assets' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}`;
    const response = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();
    if (data.files && data.files.length > 0) return data.files[0].id;
    
    const folderMetadata = { name: 'ApexTrade_Terminal_Assets', mimeType: 'application/vnd.google-apps.folder' };
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(folderMetadata)
    });
    const folderData = await createResponse.json();
    return folderData.id;
}

function sendFileStreamToGoogleDrive(file, folderId, accessToken) {
    return new Promise((resolve, reject) => {
        const boundary = 'apex_terminal_cloud_boundary';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delimiter = "\r\n--" + boundary + "--";
        const metadata = { 'name': `avatar_${Date.now()}.jpg`, 'mimeType': file.type || 'image/jpeg', 'parents': [folderId] };

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function() {
            const base64Data = btoa(new Uint8Array(reader.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            const multipartRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter + `Content-Type: ${file.type || 'image/jpeg'}\r\n` + 'Content-Transfer-Encoding: base64\r\n\r\n' + base64Data + close_delimiter;

            fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'multipart/related; boundary=' + boundary },
                body: multipartRequestBody
            })
            .then(res => res.json())
            .then(fileMetadata => {
                if (fileMetadata.id) {
                    const localReader = new FileReader();
                    localReader.onload = function(evt) {
                        localStorage.setItem("user_avatar", evt.target.result);
                        if (document.getElementById("profile-avatar-img-container")) {
                            document.getElementById("profile-avatar-img-container").innerHTML = `<img src="${evt.target.result}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" id="profile-avatar-img">`;
                        }
                    };
                    localReader.readAsDataURL(file);
                    alert("Profile photo synchronized permanently to your Google Server 15GB storage cloud!");
                    resolve(fileMetadata);
                } else { reject(fileMetadata); }
            }).catch(err => reject(err));
        };
    });
}

// Global UI Initialization
window.addEventListener("DOMContentLoaded", initializeApp);
