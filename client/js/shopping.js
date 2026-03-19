// ============================================================
//  EASY BASKET — Shopping Page
// ============================================================

const BASE_URL =
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://easy-basket.onrender.com') + '/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Greet user from JWT + decode userId ────────────────────────
let currentUserId = null;
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.name) {
        document.getElementById('userGreeting').textContent =
            `Hello, ${payload.name.split(' ')[0]} 👋`;
    }
    currentUserId = payload.id;
} catch (_) { }

// ── Cart badge ───────────────────────────────────────────────
async function loadCartBadge() {
    if (!currentUserId) return;
    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/${currentUserId}`);
        const data = await res.json();
        const count = (data.items || []).reduce((s, i) => s + i.quantity, 0);
        const badge = document.getElementById('cartBadge');
        if (badge && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.add('visible');
        }
    } catch (_) { }
}
loadCartBadge();

// ── State ─────────────────────────────────────────────────────
let allShops = [];
let allCategories = [];

// ── Fetch categories & shops in parallel ──────────────────────
async function loadPage() {
    try {
        const [catRes, shopRes] = await Promise.all([
            fetchWithAuth(`${BASE_URL}/categories`),
            fetchWithAuth(`${BASE_URL}/shops`),
        ]);

        const catData = await catRes.json();
        const shopData = await shopRes.json();

        allCategories = Array.isArray(catData) ? catData : (catData.data || []);
        allShops = Array.isArray(shopData) ? shopData : (shopData.data || []);

        // Hero stats
        document.getElementById('totalCategories').textContent = allCategories.length;
        document.getElementById('totalShops').textContent = allShops.length + '+';

        renderCategories();
        renderShops(allShops);

    } catch (err) {
        console.error('Failed to load page:', err);
        document.getElementById('categoryPills').innerHTML =
            `<p style="color:var(--text-muted);font-size:14px;">⚠️ Could not connect to the server.</p>`;
        document.getElementById('shopsSection').innerHTML =
            `<div class="empty-state"><span class="empty-emoji">⚠️</span><p>Make sure the backend is running on port 5000.</p></div>`;
    }
}

// ── Browse by Category — pills that redirect ──────────────────
function renderCategories() {
    const bar = document.getElementById('categoryPills');
    bar.innerHTML = '';

    if (!allCategories.length) {
        bar.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No categories found.</p>`;
        return;
    }

    allCategories.forEach(cat => {
        const pill = document.createElement('button');
        pill.className = 'pill cat-nav-pill';
        pill.innerHTML = `
            <span class="pill-emoji">${catEmoji(cat.name)}</span>
            <span>${cat.name}</span>
        `;
        pill.addEventListener('click', () => {
            window.location.href =
                `category-products.html?id=${cat._id}&name=${encodeURIComponent(cat.name)}`;
        });
        bar.appendChild(pill);
    });
}

// ── Browse by Shop — plain grid, no filter ────────────────────
function renderShops(list) {
    const section = document.getElementById('shopsSection');

    if (!list.length) {
        section.innerHTML = `<div class="empty-state"><span class="empty-emoji">🏪</span><p>No shops available.</p></div>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'shops-grid';

    grid.innerHTML = list.map(shop => {
        const imgUrl = shop.image?.url;
        const addr = [shop.address?.street, shop.address?.city].filter(Boolean).join(', ');
        const isOpen = shop.isActive !== false;

        const imgSection = imgUrl
            ? `<img src="${imgUrl}" alt="${shop.name}" class="shop-card-img"
                    onerror="this.parentElement.innerHTML='<div class=shop-card-img-fallback>${shopEmoji(shop.name)}</div>'">`
            : `<div class="shop-card-img-fallback">${shopEmoji(shop.name)}</div>`;

        return `
            <div class="shop-card"
                 onclick="window.location.href='shop-products.html?id=${shop._id}&name=${encodeURIComponent(shop.name)}'">
                <div class="shop-card-img-wrap">${imgSection}</div>
                <div class="shop-card-body">
                    <div class="shop-card-name">${shop.name}</div>
                    <div class="shop-card-address">📍 ${addr || 'Address unavailable'}</div>
                    <div class="shop-card-meta">
                        <span class="shop-badge ${isOpen ? 'badge-open' : 'badge-closed'}">
                            ${isOpen ? '● Open' : '● Closed'}
                        </span>
                        ${shop.phone ? `<span class="shop-tag">📞 ${shop.phone}</span>` : ''}
                    </div>
                </div>
            </div>`;
    }).join('');

    section.innerHTML = '';
    section.appendChild(grid);
}

// ── Search (searches shops by name) ──────────────────────────
document.getElementById('searchInput').addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    renderShops(q ? allShops.filter(s => s.name.toLowerCase().includes(q)) : allShops);
});

// ── Helpers ───────────────────────────────────────────────────
const EMOJI_MAP = {
    fruit: '🍎', vegetable: '🥦', dairy: '🥛', milk: '🥛',
    bakery: '🍞', bread: '🥖', meat: '🥩', chicken: '🍗',
    seafood: '🐟', beverage: '🥤', snack: '🍿', frozen: '🧊',
    household: '🧹', personal: '🧴', baby: '👶', pet: '🐾',
    organic: '🌿', sweet: '🍬', grocery: '🛒', general: '🏪'
};
function catEmoji(name = '') {
    const l = name.toLowerCase();
    for (const [k, v] of Object.entries(EMOJI_MAP)) { if (l.includes(k)) return v; }
    return '🏷️';
}
const SHOP_EMOJIS = ['🏪', '🛒', '🏬', '🛍️', '🌽', '🧺', '🏷️'];
function shopEmoji(name = '') {
    const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return SHOP_EMOJIS[n % SHOP_EMOJIS.length];
}

// ── Init ──────────────────────────────────────────────────────
loadPage();
