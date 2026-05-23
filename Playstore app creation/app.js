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

    function handleGoogleAuthResponse(response) {
    const responsePayload = decodeJwtToken(response.credential);

    // 1. Break down the incoming Google full name string as base parameters
    const nameParts = responsePayload.name.trim().split(/\s+/);
    const defaultFirstName = nameParts[0] || "";
    const defaultLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const defaultMiddleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    // 2. Pre-fill name fields inside the visible popup form interface
    document.getElementById('setup-fname').value = defaultFirstName;
    document.getElementById('setup-mname').value = defaultMiddleName;
    document.getElementById('setup-lname').value = defaultLastName;

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
                nomineeRelation: document.getElementById('setup-nominee-relation').value.trim()
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
            nomineeRelation: "N/A"
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
        clientId: "HA02V"
    }));
}

// Helper: generate unique client ID using formula
function generateClientId(fullName, dob) {
    if (!fullName || !dob) return "";
    const cleanedName = fullName.trim();
    if (cleanedName.length < 2) return "";
    
    // First 2 letters of Full Name (UPPERCASE)
    const firstTwo = cleanedName.substring(0, 2).toUpperCase();
    
    // Last 2 digits of Birth Year
    let birthYear = "";
    if (dob.includes("-")) {
        const parts = dob.split("-");
        if (parts[0].length === 4) {
            birthYear = parts[0]; // YYYY-MM-DD
        } else if (parts[parts.length - 1].length === 4) {
            birthYear = parts[parts.length - 1]; // DD-MM-YYYY
        } else {
            birthYear = parts[0]; // fallback
        }
    } else {
        birthYear = new Date(dob).getFullYear().toString();
    }
    const lastTwoYear = birthYear.slice(-2);
    
    // Absolute last letter of Full Name (UPPERCASE)
    const lastLetter = cleanedName.slice(-1).toUpperCase();
    
    return `${firstTwo}${lastTwoYear}${lastLetter}`;
}

// 1. Single global array source of truth exactly as requested
const INSTRUMENTS_DB = [
    { symbol: "TATASTEEL", name: "Tata Steel Ltd.", price: 205.20, change: -1.62 },
    { symbol: "ADANIPOWER", name: "Adani Power India Ltd.", price: 219.32, change: 0.77 },
    { symbol: "ADANIENSOL", name: "Adani Energy Solutions Ltd.", price: 1367.90, change: -0.36 },
    { symbol: "WIPRO", name: "Wipro Ltd.", price: 202.97, change: 0.15 },
    { symbol: "GAIL", name: "GAIL India Ltd.", price: 160.77, change: 1.12 },
    { symbol: "KITEX", name: "Kitex Garments Ltd.", price: 157.86, change: 0.45 },
    { symbol: "APOLLOMICR", name: "Apollo Micro Systems Ltd.", price: 355.05, change: -0.85 }
];

// Pre-calculate previous day close for accurate live percentage changes
INSTRUMENTS_DB.forEach(item => {
    item.prevClose = item.price / (1 + item.change / 100);
});

// App State
let activeTab = "watchlist-tab";
let watchlistSymbols = ["TATASTEEL", "ADANIPOWER", "WIPRO", "GAIL", "KITEX"];

// Initial holdings to match the user's requested balance (~₹1,45,230.50)
let portfolioHoldings = [
    { symbol: "TATASTEEL", qty: 200, avgBuyPrice: 198.50 },
    { symbol: "WIPRO", qty: 250, avgBuyPrice: 190.20 },
    { symbol: "GAIL", qty: 332, avgBuyPrice: 148.50 }
];

// Dynamic cash to hit exactly ₹1,45,230.50 at startup
let cashBalance = 72.36; 

// Transaction history
let transactionLogs = [
    { type: "BUY", symbol: "TATASTEEL", qty: 200, price: 198.50, date: "2026-05-20" },
    { type: "BUY", symbol: "WIPRO", qty: 250, price: 190.20, date: "2026-05-21" },
    { type: "BUY", symbol: "GAIL", qty: 332, price: 148.50, date: "2026-05-22" }
];

// Price ticks tracking to handle green/red highlight classes
let previousPricesMap = {};
INSTRUMENTS_DB.forEach(item => {
    previousPricesMap[item.symbol] = item.price;
});

let lastTotalPortfolioValue = 145230.50;

// Search state
let activeSearchQuery = "";

// Modal transaction state
let selectedAsset = null;
let currentTransactionType = "BUY"; // "BUY" or "SELL"

// Dom Elements
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

// Portfolio Tab Metrics
const portfolioInvestedEl = document.getElementById("portfolio-invested");
const portfolioPnlEl = document.getElementById("portfolio-pnl");
const watchlistCountEl = document.getElementById("watchlist-count");

// Modal Elements
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

// Auth State & Elements
let authMode = "LOGIN"; // "LOGIN" or "SIGNUP"
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

// Helper: space-agnostic flattener (converts "tata  steel" to "TATASTEEL")
function flattenString(str) {
    if (!str) return "";
    return str.replace(/\s+/g, '').toUpperCase();
}

// 2. Space-agnostic fuzzy search input handler
function handleSearch(event) {
    const rawValue = event.target.value;
    activeSearchQuery = rawValue;

    // Toggle search clear button
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

    // Filter instruments
    const filteredResults = INSTRUMENTS_DB.filter(item => {
        const flatSymbol = flattenString(item.symbol);
        const flatName = flattenString(item.name);
        return flatSymbol.includes(query) || flatName.includes(query);
    });

    renderSearchResults(filteredResults);
}

// 3. Structure renderSearchResults(results) binding price to live array property
function renderSearchResults(results) {
    if (results.length === 0) {
        searchDropdownList.innerHTML = `<div class="dropdown-empty">No assets matching search</div>`;
        searchDropdown.classList.remove("hidden");
        return;
    }

    searchDropdownList.innerHTML = "";
    results.forEach(item => {
        // Retrieve live price & change indicators directly
        const isPositive = item.change >= 0;
        const changeClass = isPositive ? "text-positive" : "text-negative";
        const sign = isPositive ? "+" : "";
        const isWatched = watchlistSymbols.includes(item.symbol);
        
        // Creating the row
        const row = document.createElement("div");
        row.className = "instrument-row";
        
        // Add active click animation feedback
        row.addEventListener("click", (e) => {
            // Prevent modal popup if clicking the watch icon
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
                    <!-- Bind price directly to item's live .price property -->
                    <span class="instrument-price">₹${item.price.toFixed(2)}</span>
                    <span class="instrument-change ${changeClass}">${sign}${item.change.toFixed(2)}%</span>
                </div>
                <button class="action-icon-btn ${isWatched ? 'watched' : ''}" data-symbol="${item.symbol}" title="${isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="${isWatched ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        searchDropdownList.appendChild(row);
    });

    // Bind event listeners for watchlist buttons inside dropdown
    searchDropdownList.querySelectorAll(".action-icon-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const symbol = btn.getAttribute("data-symbol");
            toggleWatchlist(symbol);
        });
    });

    searchDropdown.classList.remove("hidden");
}

// Watchlist toggle handler
function toggleWatchlist(symbol) {
    const index = watchlistSymbols.indexOf(symbol);
    if (index > -1) {
        watchlistSymbols.splice(index, 1);
    } else {
        watchlistSymbols.push(symbol);
    }
    renderWatchlist();
    // Re-render search if dropdown is open to update the star state
    if (activeSearchQuery.length > 0) {
        const query = flattenString(activeSearchQuery);
        const filteredResults = INSTRUMENTS_DB.filter(item => {
            return flattenString(item.symbol).includes(query) || flattenString(item.name).includes(query);
        });
        renderSearchResults(filteredResults);
    }
}

// Render Watchlist Panel
function renderWatchlist() {
    watchlistCountEl.textContent = `${watchlistSymbols.length} items`;
    
    if (watchlistSymbols.length === 0) {
        watchlistList.innerHTML = `
            <div class="empty-holdings" style="grid-column: span 2; border-style: solid;">
                Watchlist is empty. Search assets above to add them.
            </div>
        `;
        return;
    }

    watchlistList.innerHTML = "";
    watchlistSymbols.forEach(symbol => {
        const item = INSTRUMENTS_DB.find(i => i.symbol === symbol);
        if (!item) return;

        const isPositive = item.change >= 0;
        const changeClass = isPositive ? "text-positive" : "text-negative";
        const sign = isPositive ? "+" : "";
        
        // Identify live price tick changes to flash row backgrounds
        const prevPrice = previousPricesMap[symbol] || item.price;
        let flashClass = "";
        if (item.price > prevPrice) {
            flashClass = "item-flash-green";
        } else if (item.price < prevPrice) {
            flashClass = "item-flash-red";
        }

        const row = document.createElement("div");
        row.className = `instrument-row ${flashClass}`;
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
                <button class="action-icon-btn watched" data-symbol="${item.symbol}">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        watchlistList.appendChild(row);
    });

    // Watchlist row remove listener
    watchlistList.querySelectorAll(".action-icon-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const symbol = btn.getAttribute("data-symbol");
            toggleWatchlist(symbol);
        });
    });
}

// Render Portfolio Tab
function renderPortfolio() {
    // Render holdings list
    if (portfolioHoldings.length === 0) {
        holdingsList.innerHTML = `<div class="empty-holdings">No active stock holdings. Use Buy option above.</div>`;
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

            const prevPrice = previousPricesMap[holding.symbol] || asset.price;
            let flashClass = "";
            if (asset.price > prevPrice) {
                flashClass = "item-flash-green";
            } else if (asset.price < prevPrice) {
                flashClass = "item-flash-red";
            }

            const card = document.createElement("div");
            card.className = `holding-card ${flashClass}`;
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
                    <span class="holding-val">₹${currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span class="holding-pnl ${pnlClass}">${sign}₹${pnl.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)</span>
                </div>
            `;
            holdingsList.appendChild(card);
        });
    }

    // Render Transaction Logs
    activityLogList.innerHTML = "";
    if (transactionLogs.length === 0) {
        activityLogList.innerHTML = `<div class="dropdown-empty">No transaction history</div>`;
    } else {
        // Show last 5 logs reversed
        const recentLogs = transactionLogs.slice(-5).reverse();
        recentLogs.forEach(log => {
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
                <div class="log-right">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            `;
            activityLogList.appendChild(logRow);
        });
    }

    // Render Invested & P&L Totals
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

    portfolioInvestedEl.textContent = `₹${totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    portfolioPnlEl.className = `stat-value ${netPnlClass}`;
    portfolioPnlEl.textContent = `${netSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${netSign}${netPnlPercent.toFixed(2)}%)`;
}

// Central UI Render router to update all active views
function updateUI() {
    // Render search results if there is an active search query
    if (activeSearchQuery.length > 0) {
        const query = flattenString(activeSearchQuery);
        const filteredResults = INSTRUMENTS_DB.filter(item => {
            return flattenString(item.symbol).includes(query) || flattenString(item.name).includes(query);
        });
        renderSearchResults(filteredResults);
    }

    // Always render watchlist & portfolio to keep lists updated
    renderWatchlist();
    renderPortfolio();

    // Update total balance
    updatePortfolioBalance();
}

// Update Portfolio Total Balance Header Component
function updatePortfolioBalance() {
    let holdingsValue = 0;
    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) {
            holdingsValue += holding.qty * asset.price;
        }
    });

    const totalPortfolioValue = holdingsValue + cashBalance;
    portfolioBalanceEl.textContent = totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Calculate absolute daily returns for the header badge
    // Daily return is based on current price changes of holdings
    let dailyInvested = 0;
    let dailyChangeVal = 0;
    portfolioHoldings.forEach(holding => {
        const asset = INSTRUMENTS_DB.find(i => i.symbol === holding.symbol);
        if (asset) {
            const holdingPrevPrice = asset.prevClose;
            const holdingPriceVal = holding.qty * asset.price;
            const holdingPrevPriceVal = holding.qty * holdingPrevPrice;
            dailyChangeVal += (holdingPriceVal - holdingPrevPriceVal);
            dailyInvested += holdingPrevPriceVal;
        }
    });

    const dailyPercent = dailyInvested > 0 ? (dailyChangeVal / dailyInvested) * 100 : 0;
    const isPos = dailyChangeVal >= 0;
    const badgeClass = isPos ? "pnl-positive" : "pnl-negative";
    const badgeSign = isPos ? "+" : "";

    portfolioChangeBadge.className = `change-badge ${badgeClass}`;
    portfolioChangeBadge.textContent = `${badgeSign}₹${Math.abs(dailyChangeVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${badgeSign}${dailyPercent.toFixed(2)}%)`;

    // Flashing Animation for the main balance card on price tick changes
    if (totalPortfolioValue > lastTotalPortfolioValue + 0.05) {
        balanceCard.classList.remove("flash-green", "flash-red");
        void balanceCard.offsetWidth; // Trigger reflow
        balanceCard.classList.add("flash-green");
        lastTotalPortfolioValue = totalPortfolioValue;
    } else if (totalPortfolioValue < lastTotalPortfolioValue - 0.05) {
        balanceCard.classList.remove("flash-green", "flash-red");
        void balanceCard.offsetWidth; // Trigger reflow
        balanceCard.classList.add("flash-red");
        lastTotalPortfolioValue = totalPortfolioValue;
    }
}

// 4. Set up the high-frequency startLiveTicker() loop (disabled for frozen values)
function startLiveTicker() {
    /*
    setInterval(() => {
        // Store current prices in temp mapping before updating
        INSTRUMENTS_DB.forEach(item => {
            previousPricesMap[item.symbol] = item.price;
        });

        // Step through each asset and apply micro-fluctuations (+/- 0.02%)
        INSTRUMENTS_DB.forEach(item => {
            // Apply micro fluctuations: random float between -0.02% and +0.02%
            const pct = (Math.random() - 0.5) * 2 * 0.0002;
            item.price = parseFloat((item.price * (1 + pct)).toFixed(2));
            
            // Recalculate daily percentage change
            item.change = parseFloat(((item.price - item.prevClose) / item.prevClose * 100).toFixed(2));
        });

        // Update modal price if modal is open for currently selected asset
        if (selectedAsset && transactionModal.style.display !== "none") {
            const liveAsset = INSTRUMENTS_DB.find(i => i.symbol === selectedAsset.symbol);
            if (liveAsset) {
                modalLivePrice.textContent = liveAsset.price.toFixed(2);
                updateModalCalculations(liveAsset.price);
            }
        }

        // Re-render views immediately based on active panels & query
        updateUI();
    }, 300);
    */
}

// Transaction Modal Logic
function openOrderModal(asset) {
    selectedAsset = asset;
    modalTicker.textContent = asset.symbol;
    modalName.textContent = asset.name;
    modalLivePrice.textContent = asset.price.toFixed(2);
    
    // Set active class
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
    const fee = estVal * 0.0005; // 0.05% fee
    
    modalOrderValue.textContent = estVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    modalTradingFee.textContent = fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Update button text
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

// Execute transaction
function executeTransaction() {
    if (!selectedAsset) return;
    
    const qty = parseInt(transactionQtyInput.value);
    if (!qty || qty <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }
    
    const liveAsset = INSTRUMENTS_DB.find(i => i.symbol === selectedAsset.symbol);
    const executionPrice = liveAsset.price;
    const orderVal = qty * executionPrice;
    const fee = orderVal * 0.0005;
    
    if (currentTransactionType === "BUY") {
        const totalCost = orderVal + fee;
        if (cashBalance < totalCost && cashBalance >= 0) {
            // Note: For simulation purposes we'll allow transaction but deduct cash balance below zero
            // or warn user. Let's make it add a nice visual alert.
        }
        
        // Deduct Cash
        cashBalance -= totalCost;
        
        // Add or adjust holding
        const existingHolding = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (existingHolding) {
            const oldCost = existingHolding.qty * existingHolding.avgBuyPrice;
            const newCost = orderVal; // fees not added to avg cost base for simplicity
            const totalQty = existingHolding.qty + qty;
            existingHolding.avgBuyPrice = parseFloat(((oldCost + newCost) / totalQty).toFixed(2));
            existingHolding.qty = totalQty;
        } else {
            portfolioHoldings.push({
                symbol: liveAsset.symbol,
                qty: qty,
                avgBuyPrice: parseFloat(executionPrice.toFixed(2))
            });
        }
    } else {
        // SELL execution
        const existingHolding = portfolioHoldings.find(h => h.symbol === liveAsset.symbol);
        if (!existingHolding || existingHolding.qty < qty) {
            alert(`Insufficient holdings! You only own ${existingHolding ? existingHolding.qty : 0} shares of ${liveAsset.symbol}.`);
            return;
        }
        
        // Add to cash
        cashBalance += (orderVal - fee);
        
        // Reduce holdings
        existingHolding.qty -= qty;
        if (existingHolding.qty === 0) {
            portfolioHoldings = portfolioHoldings.filter(h => h.symbol !== liveAsset.symbol);
        }
    }
    
    // Add transaction log
    const today = new Date().toISOString().split('T')[0];
    transactionLogs.push({
        type: currentTransactionType,
        symbol: liveAsset.symbol,
        qty: qty,
        price: executionPrice,
        date: today
    });
    
    // Update views & Close Modal
    updateUI();
    closeOrderModal();
}

// Bind Tabs events
function setupTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.getAttribute("data-tab");
            
            if (targetTab === "profile-panel") {
                showProfilePanel(true);
            } else {
                // Keep track of the active trading tab
                tabs.forEach(t => {
                    if (t.getAttribute("data-tab") !== "profile-panel") {
                        t.classList.remove("prev-active");
                    }
                });
                tab.classList.add("prev-active");
                
                showProfilePanel(false);
                
                tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                activeTab = targetTab;
                
                document.querySelectorAll(".tab-panel").forEach(panel => {
                    panel.classList.remove("active");
                });
                const panelEl = document.getElementById(targetTab);
                if (panelEl) panelEl.classList.add("active");
                
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
        }
        
        // Sync tabs active state
        document.querySelectorAll(".tab-btn").forEach(btn => {
            if (btn.getAttribute("data-tab") === "profile-panel") {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        
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
        
        // Restore last active trading tab
        let activeTradingTab = "watchlist-tab";
        const portfolioTabBtn = document.querySelector('button[data-tab="portfolio-tab"]');
        if (portfolioTabBtn && portfolioTabBtn.classList.contains("prev-active")) {
            activeTradingTab = "portfolio-tab";
        }
        
        document.querySelectorAll(".tab-btn").forEach(btn => {
            const target = btn.getAttribute("data-tab");
            if (target === activeTradingTab) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        
        document.querySelectorAll(".tab-panel").forEach(panel => {
            if (panel.id === activeTradingTab) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });
        
        updateUI();
    }
}

// Status bar clock
function startClock() {
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        statusTimeEl.textContent = `${hours}:${minutes}`;
    }
    updateClock();
    setInterval(updateClock, 60000);
}

// Secure authentication form submission and validation
function handleAuthSubmit(event) {
    event.preventDefault();
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;
    
    if (!username || !password) {
        showAuthError("Please fill out all fields.");
        return;
    }
    
    if (authMode === "SIGNUP") {
        const nameInput = document.getElementById("auth-fullname");
        const dobInput = document.getElementById("auth-dob");
        const fullName = nameInput ? nameInput.value.trim() : "";
        const dob = dobInput ? dobInput.value : "";
        
        if (!fullName || !dob) {
            showAuthError("Please fill out all fields.");
            return;
        }
        
        const clientId = "Pending Verification";
        
        // Sign Up Step: Save credentials under user_credentials key in localStorage
        localStorage.setItem('user_credentials', JSON.stringify({ 
            username, 
            password,
            fullName,
            dob,
            clientId
        }));
        
        // Generate a random 4-digit token inside current_otp variable
        current_otp = Math.floor(1000 + Math.random() * 9000);
        
        // Display this generated code to the user instantly using a native web pop-up alert
        alert(`[ApexTrade Security] Your One-Time Password (OTP) is: ${current_otp}`);
        
        // Hide the signup form elements and display the 'otp-container' layout
        authForm.classList.add("hidden");
        authTitle.classList.add("hidden");
        authSubtitle.classList.add("hidden");
        document.querySelector(".auth-toggle-container").classList.add("hidden");
        
        const otpContainer = document.getElementById("otp-container");
        otpContainer.classList.remove("hidden");
        
        // Reset/empty OTP digits inputs and focus the first box
        document.querySelectorAll(".otp-digit").forEach(input => input.value = "");
        document.getElementById("otp-1").focus();
        document.getElementById("otp-error-msg").classList.add("hidden");
    } else {
        // Log In Step: Verify inputs match local user database credentials
        const storedCredsRaw = localStorage.getItem('user_credentials');
        if (!storedCredsRaw) {
            showAuthError("No registered account found. Please sign up first.");
            return;
        }
        
        const storedCreds = JSON.parse(storedCredsRaw);
        if (storedCreds.username === username && storedCreds.password === password) {
            // Save authentication success key
            localStorage.setItem('isLoggedIn', 'true');
            authContainer.classList.add("hidden");
            desktopWrapper.classList.remove("hidden");
            authErrorMsg.classList.add("hidden");
            
            // Re-run initialization to bind elements and start simulation
            initializeApp();
        } else {
            showAuthError("Invalid username or password.");
        }
    }
}

// Click handler for the "VERIFY OTP" button
function handleVerifyOtp() {
    const digit1 = document.getElementById("otp-1").value.trim();
    const digit2 = document.getElementById("otp-2").value.trim();
    const digit3 = document.getElementById("otp-3").value.trim();
    const digit4 = document.getElementById("otp-4").value.trim();
    const typedOtp = digit1 + digit2 + digit3 + digit4;
    const otpErrorMsg = document.getElementById("otp-error-msg");
    
    if (typedOtp.length !== 4) {
        otpErrorMsg.textContent = "Please enter all 4 digits.";
        otpErrorMsg.classList.remove("hidden");
        return;
    }
    
    // Check if the typed code matches 'current_otp'
    if (typedOtp === String(current_otp)) {
        // SaveLoggedIn session state and clear overlays
        localStorage.setItem('isLoggedIn', 'true');
        authContainer.classList.add("hidden");
        desktopWrapper.classList.remove("hidden");
        otpErrorMsg.classList.add("hidden");
        
        // Generate and save Client ID from credentials on OTP handshake completion
        const credsRaw = localStorage.getItem('user_credentials');
        if (credsRaw) {
            const creds = JSON.parse(credsRaw);
            const fullName = creds.fullName || "Hari Krishnan I V";
            const dob = creds.dob || "19-03-2002";
            creds.clientId = generateClientId(fullName, dob);
            localStorage.setItem('user_credentials', JSON.stringify(creds));
        }
        
        // Hide otp container and restore login state for future logins
        document.getElementById("otp-container").classList.add("hidden");
        authForm.classList.remove("hidden");
        authTitle.classList.remove("hidden");
        authSubtitle.classList.remove("hidden");
        document.querySelector(".auth-toggle-container").classList.remove("hidden");
        
        // Reset form layout to Login Mode
        authMode = "LOGIN";
        switchFormState();
        
        // Clear fields
        authUsernameInput.value = "";
        authPasswordInput.value = "";
        
        // Initialize dashboard UI components
        initializeApp();
    } else {
        // Display mismatch error in red
        otpErrorMsg.textContent = "Invalid OTP. Please try again.";
        otpErrorMsg.classList.remove("hidden");
    }
}

function showAuthError(message) {
    authErrorMsg.textContent = message;
    authErrorMsg.className = "auth-error-msg"; // Red error feedback styling
    authErrorMsg.style.borderColor = "";
    authErrorMsg.style.backgroundColor = "";
    authErrorMsg.classList.remove("hidden");
}

// Switches form labels, input placeholders, and button texts between LOGIN & SIGNUP
function switchFormState() {
    authErrorMsg.classList.add("hidden");
    const usernameLabel = document.querySelector('label[for="auth-username"]');
    const passwordLabel = document.querySelector('label[for="auth-password"]');
    const signupOnlyEls = document.querySelectorAll(".signup-only");
    
    if (authMode === "LOGIN") {
        authTitle.textContent = "Log In to ApexTrade";
        authSubtitle.textContent = "Enter your credentials to access your trading dashboard";
        
        if (usernameLabel) usernameLabel.textContent = "Email or Username";
        authUsernameInput.placeholder = "e.g. trader101";
        
        if (passwordLabel) passwordLabel.textContent = "Password";
        authPasswordInput.placeholder = "••••••••";
        
        signupOnlyEls.forEach(el => el.classList.add("hidden"));
        const loginOnlyEls = document.querySelectorAll(".login-only");
        loginOnlyEls.forEach(el => el.classList.remove("hidden"));
        const nameInput = document.getElementById("auth-fullname");
        const dobInput = document.getElementById("auth-dob");
        if (nameInput) nameInput.removeAttribute("required");
        if (dobInput) dobInput.removeAttribute("required");
        
        authSubmitBtn.textContent = "LOG IN";
        authToggleText.textContent = "Don't have an account?";
        authToggleLink.textContent = "Sign Up";
    } else {
        authTitle.textContent = "Create your Account";
        authSubtitle.textContent = "Sign up now to start tracking your stock portfolios";
        
        if (usernameLabel) usernameLabel.textContent = "Choose Username";
        authUsernameInput.placeholder = "e.g. newtrader99";
        
        if (passwordLabel) passwordLabel.textContent = "Create Password";
        authPasswordInput.placeholder = "Min. 8 characters";
        
        signupOnlyEls.forEach(el => el.classList.remove("hidden"));
        const loginOnlyEls = document.querySelectorAll(".login-only");
        loginOnlyEls.forEach(el => el.classList.add("hidden"));
        const nameInput = document.getElementById("auth-fullname");
        const dobInput = document.getElementById("auth-dob");
        if (nameInput) nameInput.setAttribute("required", "required");
        if (dobInput) dobInput.setAttribute("required", "required");
        
        authSubmitBtn.textContent = "SIGN UP";
        authToggleText.textContent = "Already have an account?";
        authToggleLink.textContent = "Log In";
    }
}

// Extract credentials and update details for the User Profile screen
function renderProfileDetails() {
    const nameDisplay = document.getElementById("profile-client-name");
    const dobDisplay = document.getElementById("profile-dob-display");
    const emailDisplay = document.getElementById("profile-email-display");
    const clientIdDisplay = document.getElementById("profile-client-id");
    const verificationStatus = document.getElementById("profile-verification-status");
    const genderDisplay = document.getElementById("profile-gender-display");
    const experienceDisplay = document.getElementById("profile-experience-display");
    const segmentsDisplay = document.getElementById("profile-segments-display");
    
    const credsRaw = localStorage.getItem('user_credentials');
    let creds = {};
    if (credsRaw) {
        creds = JSON.parse(credsRaw);
    }
    
    const fullName = creds.fullName || "Hari Krishnan I V";
    const dob = creds.dob || "19-03-2002";
    const email = creds.username || "appwebsitetester@gmail.com";
    const clientId = creds.clientId || generateClientId(fullName, dob) || "HA02V";
    const salutation = creds.salutation || "Mr.";
    const gender = (salutation === "Mr.") ? "Male" : "Female";
    const experience = creds.experience || "1-3 Years";
    const segments = creds.segments || ["Cash", "Derivatives"];
    
    if (nameDisplay) {
        nameDisplay.textContent = salutation + " " + fullName;
    }
    if (dobDisplay) {
        dobDisplay.textContent = dob;
    }
    if (emailDisplay) {
        emailDisplay.textContent = email;
    }
    if (clientIdDisplay) {
        clientIdDisplay.textContent = clientId;
    }
    if (genderDisplay) {
        genderDisplay.textContent = gender;
    }
    if (experienceDisplay) {
        experienceDisplay.textContent = experience;
    }
    if (segmentsDisplay) {
        segmentsDisplay.textContent = segments.join(", ");
    }
    
    // Render custom profile avatar base64
    const userAvatar = localStorage.getItem('user_avatar');
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
    
    // Check validation state
    if (localStorage.getItem('isLoggedIn') === 'true') {
        if (verificationStatus) {
            verificationStatus.textContent = "✓ VERIFIED ACCOUNT";
            verificationStatus.classList.add("verified");
        }
    } else {
        if (verificationStatus) {
            verificationStatus.textContent = "UNVERIFIED ACCOUNT";
            verificationStatus.classList.remove("verified");
        }
    }
}

// Clears user session and instantly redirects user back to lock card window
function performLogout() {
    localStorage.setItem('isLoggedIn', 'false');
    desktopWrapper.classList.add("hidden");
    authContainer.classList.remove("hidden");
    authMode = "LOGIN";
    switchFormState();
    
    // Reset view to trading dashboard
    showProfilePanel(false);
    
    // Clear credentials fields
    authUsernameInput.value = "";
    authPasswordInput.value = "";
}

// Setup Event Listeners
function initializeApp() {
    // Bind authentication overlay events (only once)
    if (!authListenersBound) {
        authForm.addEventListener("submit", handleAuthSubmit);
        authToggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            authMode = authMode === "LOGIN" ? "SIGNUP" : "LOGIN";
            switchFormState();
        });
        logoutBtn.addEventListener("click", performLogout);
        
        // Forgot Password Handler
        const forgotPasswordLink = document.getElementById("forgot-password-link");
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener("click", (e) => {
                e.preventDefault();
                const credsRaw = localStorage.getItem('user_credentials');
                if (credsRaw) {
                    try {
                        const creds = JSON.parse(credsRaw);
                        alert(`Account Recovery: Your registered password is ${creds.password}`);
                    } catch(err) {
                        alert("No account found on this device. Please Sign Up first.");
                    }
                } else {
                    alert("No account found on this device. Please Sign Up first.");
                }
            });
        }

        // OTP screen button handlers
        document.getElementById("otp-verify-btn").addEventListener("click", handleVerifyOtp);
        document.getElementById("otp-back-link").addEventListener("click", (e) => {
            e.preventDefault();
            
            // Restore signup form elements
            authForm.classList.remove("hidden");
            authTitle.classList.remove("hidden");
            authSubtitle.classList.remove("hidden");
            document.querySelector(".auth-toggle-container").classList.remove("hidden");
            document.getElementById("otp-container").classList.add("hidden");
            
            // Reset to Signup
            authMode = "SIGNUP";
            switchFormState();
        });
        
        // Automatic cursor navigation for OTP single-digit inputs
        const otpDigits = document.querySelectorAll(".otp-digit");
        otpDigits.forEach((digit, idx) => {
            digit.addEventListener("input", (e) => {
                if (e.target.value.length === 1 && idx < otpDigits.length - 1) {
                    otpDigits[idx + 1].focus();
                }
            });
            digit.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && e.target.value.length === 0 && idx > 0) {
                    otpDigits[idx - 1].focus();
                }
            });
        });

        authListenersBound = true;
    }

    // Verify session credentials
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        desktopWrapper.classList.add("hidden");
        authContainer.classList.remove("hidden");
        const tempHide = document.getElementById("temp-auth-hide");
        if (tempHide) tempHide.remove();
        return; // Terminate dashboard components build
    }

    // Show dashboard and clean lock elements
    desktopWrapper.classList.remove("hidden");
    authContainer.classList.add("hidden");
    const tempHide = document.getElementById("temp-auth-hide");
    if (tempHide) tempHide.remove();

    // Map dynamic user profile details
    renderProfileDetails();

    // Set initial prev-active tab button
    const defaultTabBtn = document.querySelector('button[data-tab="watchlist-tab"]');
    if (defaultTabBtn) {
        defaultTabBtn.classList.add("prev-active");
    }

    const profileBackBtn = document.getElementById("profile-back-btn");
    if (profileBackBtn) {
        profileBackBtn.addEventListener("click", () => {
            showProfilePanel(false);
        });
    }

    const backToDashboardBtn = document.getElementById("back-to-dashboard-btn");
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener("click", () => {
            showProfilePanel(false);
        });
    }

    // Bind profile edit/save toggle click action
    const profileEditBtn = document.getElementById("profile-edit-btn");
    if (profileEditBtn) {
        profileEditBtn.addEventListener("click", () => {
            const profilePanel = document.getElementById("profile-panel");
            if (!profilePanel) return;
            
            const isEditing = profilePanel.classList.contains("edit-active");
            
            if (!isEditing) {
                // Switch to Edit Mode
                profilePanel.classList.add("edit-active");
                profileEditBtn.textContent = "Save Changes";
                profileEditBtn.classList.remove("btn-buy");
                profileEditBtn.classList.add("btn-sell");
                profileEditBtn.style.boxShadow = "0 2px 8px var(--red-glow)";
                
                const actionBar = document.querySelector(".profile-action-bar-wrapper");
                if (actionBar) actionBar.style.display = "none";
                
                // Populate edit fields from current credentials
                const credsRaw = localStorage.getItem('user_credentials');
                let creds = {};
                if (credsRaw) {
                    creds = JSON.parse(credsRaw);
                }
                
                const fullName = creds.fullName || "Hari Krishnan I V";
                const dob = creds.dob || "19-03-2002";
                const email = creds.username || "appwebsitetester@gmail.com";
                const salutation = creds.salutation || "Mr.";
                const experience = creds.experience || "1-3 Years";
                const segments = creds.segments || ["Cash", "Derivatives"];
                
                const editFullname = document.getElementById("edit-fullname");
                const editDob = document.getElementById("edit-dob");
                const editEmail = document.getElementById("edit-email");
                const editSalutation = document.getElementById("edit-salutation");
                const editExperience = document.getElementById("edit-experience");
                
                if (editFullname) editFullname.value = fullName;
                if (editEmail) editEmail.value = email;
                
                if (editDob) {
                    let formattedDob = dob;
                    if (dob.includes("-") && dob.split("-")[0].length !== 4) {
                        // DD-MM-YYYY to YYYY-MM-DD
                        const parts = dob.split("-");
                        formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    editDob.value = formattedDob;
                }
                
                if (editSalutation) editSalutation.value = salutation;
                if (editExperience) editExperience.value = experience;
                
                document.querySelectorAll('input[name="segments"]').forEach(chk => {
                    chk.checked = segments.includes(chk.value);
                });
            } else {
                // Save Changes & Switch back to Read Mode
                const editFullname = document.getElementById("edit-fullname");
                const editDob = document.getElementById("edit-dob");
                const editEmail = document.getElementById("edit-email");
                const editSalutation = document.getElementById("edit-salutation");
                const editExperience = document.getElementById("edit-experience");
                
                const newFullname = editFullname ? editFullname.value.trim() : "Hari Krishnan I V";
                const newEmail = editEmail ? editEmail.value.trim() : "appwebsitetester@gmail.com";
                const newDobVal = editDob ? editDob.value : "2002-05-15";
                
                let newDob = newDobVal;
                if (newDobVal.includes("-") && newDobVal.split("-")[0].length === 4) {
                    const parts = newDobVal.split("-");
                    newDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                const newSalutation = editSalutation ? editSalutation.value : "Mr.";
                const newExperience = editExperience ? editExperience.value : "1-3 Years";
                
                const newSegments = [];
                document.querySelectorAll('input[name="segments"]').forEach(chk => {
                    if (chk.checked) newSegments.push(chk.value);
                });
                
                // Get existing credentials
                const credsRaw = localStorage.getItem('user_credentials');
                let creds = {};
                if (credsRaw) {
                    creds = JSON.parse(credsRaw);
                }
                
                creds.fullName = newFullname;
                creds.username = newEmail;
                creds.dob = newDob;
                creds.salutation = newSalutation;
                creds.experience = newExperience;
                creds.segments = newSegments;
                
                // Re-calculate client ID since details changed!
                creds.clientId = generateClientId(newFullname, newDob);
                
                // Save to localStorage
                localStorage.setItem('user_credentials', JSON.stringify(creds));
                
                // Re-render
                renderProfileDetails();
                
                // Reset Edit Mode
                profilePanel.classList.remove("edit-active");
                profileEditBtn.textContent = "Edit Profile";
                profileEditBtn.classList.remove("btn-sell");
                profileEditBtn.classList.add("btn-buy");
                profileEditBtn.style.boxShadow = "0 2px 8px var(--green-glow)";
                
                const actionBar = document.querySelector(".profile-action-bar-wrapper");
                if (actionBar) actionBar.style.display = "block";
            }
        });
    }

    // Bind file upload change listener for profile picture
    const avatarUpload = document.getElementById("avatar-upload");
    if (avatarUpload) {
        avatarUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement("canvas");
                        const MAX_WIDTH = 150;
                        const MAX_HEIGHT = 150;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                        localStorage.setItem("user_avatar", compressedBase64);
                        
                        // Update avatar view immediately
                        const avatarContainer = document.getElementById("profile-avatar-img-container");
                        if (avatarContainer) {
                            avatarContainer.innerHTML = `<img src="${compressedBase64}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" id="profile-avatar-img">`;
                        }
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    startClock();
    setupTabs();
    
    // Bind click listener to top-left profile icon to toggle profile panel
    const headerProfileBtn = document.querySelector(".profile-btn");
    if (headerProfileBtn) {
        headerProfileBtn.addEventListener("click", () => {
            showProfilePanel(true);
        });
    }
    
    // Search listener
    searchInput.addEventListener("input", handleSearch);
    
    // Hide search dropdown if clicked outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container")) {
            searchDropdown.classList.add("hidden");
        }
    });

    // Focus input to re-show dropdown if there is text
    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim().length > 0) {
            handleSearch({ target: searchInput });
        }
    });
    
    // Search Clear Button
    searchClearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchClearBtn.classList.add("hidden");
        searchDropdown.classList.add("hidden");
        activeSearchQuery = "";
    });
    
    // Modal close button
    modalCloseBtn.addEventListener("click", closeOrderModal);
    
    // Quantity controls in modal
    qtyMinusBtn.addEventListener("click", () => {
        let val = parseInt(transactionQtyInput.value) || 1;
        if (val > 1) {
            transactionQtyInput.value = val - 1;
            if (selectedAsset) updateModalCalculations(selectedAsset.price);
        }
    });
    
    qtyPlusBtn.addEventListener("click", () => {
        let val = parseInt(transactionQtyInput.value) || 0;
        transactionQtyInput.value = val + 1;
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });
    
    transactionQtyInput.addEventListener("input", () => {
        let val = parseInt(transactionQtyInput.value);
        if (isNaN(val) || val < 1) {
            transactionQtyInput.value = 1;
        }
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });
    
    // BUY / SELL switch toggles
    toggleBuyBtn.addEventListener("click", () => {
        currentTransactionType = "BUY";
        toggleBuyBtn.classList.add("active");
        toggleSellBtn.classList.remove("active");
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });
    
    toggleSellBtn.addEventListener("click", () => {
        currentTransactionType = "SELL";
        toggleSellBtn.classList.add("active");
        toggleBuyBtn.classList.remove("active");
        if (selectedAsset) updateModalCalculations(selectedAsset.price);
    });
    
    // Order Execute Confirmation button
    executeOrderBtn.addEventListener("click", executeTransaction);
    
    // Initial Render of interface
    updateUI();
    
    // Start simulation loop
    startLiveTicker();
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", initializeApp);
