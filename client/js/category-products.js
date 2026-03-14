// ============================================================
//  EASY BASKET — Category Products Page
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ── Emoji helper (defined first so it can be used anywhere) ───
const EMOJI_MAP = {
    fruit: '🍎', vegetable: '🥦', dairy: '🥛', milk: '🥛',
    bakery: '🍞', bread: '🥖', meat: '🥩', chicken: '🍗',
    seafood: '🐟', fish: '🐠', beverage: '🥤', drink: '🧃',
    snack: '🍿', frozen: '🧊', household: '🧹', personal: '🧴',
    baby: '👶', pet: '🐾', organic: '🌿', sweet: '🍬', spice: '🌶️',
    grocery: '🛒', general: '🏪'
};
function catEmoji(name = '') {
    const l = name.toLowerCase();
    for (const [k, v] of Object.entries(EMOJI_MAP)) {
        if (l.includes(k)) return v;
    }
    return '🏷️';
}

const SHOP_EMOJIS = ['🏪', '🛒', '🏬', '🛍️', '🌽', '🧺', '🏷️'];

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// ── Decode userId from JWT & Greet user ───────────────────────
let currentUserId = null;
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.name) {
        document.getElementById('userGreeting').textContent =
            `Hello, ${payload.name.split(' ')[0]} 👋`;
    }
    currentUserId = payload.id;
} catch (_) { }

// ── Load cart badge ───────────────────────────────────────────
async function loadCartBadge() {
    if (!currentUserId) return;
    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/${currentUserId}`);
        const data = await res.json();
        const count = (data.items || []).reduce((s, i) => s + i.quantity, 0);
        updateCartBadge(count);
    } catch (_) { }
}
function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }
}
loadCartBadge();


// ── Read URL params: ?id=xxx&name=yyy ─────────────────────────
const params = new URLSearchParams(window.location.search);
const categoryId = params.get('id');
const catName = decodeURIComponent(params.get('name') || 'Category');

if (!categoryId) window.location.href = 'shopping.html';

// ── Set page title & breadcrumb ───────────────────────────────
document.title = `${catName} — Easy Basket`;
document.getElementById('catHeroTitle').textContent = catName;
document.getElementById('breadcrumbCat').textContent = catName;
document.getElementById('catHeroEmoji').textContent = catEmoji(catName);

// ── State ─────────────────────────────────────────────────────
let allProducts = [];
let displayProducts = [];

// ── Fetch products for this category ─────────────────────────
async function loadProducts() {
    try {
        console.log(`Fetching: ${BASE_URL}/products/category/${categoryId}`);

        const res = await fetchWithAuth(`${BASE_URL}/products/category/${categoryId}`);

        const data = await res.json();
        console.log('API response:', data);

        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

        allProducts = Array.isArray(data) ? data : (data.data || []);
        displayProducts = [...allProducts];

        document.getElementById('catHeroSub').textContent =
            `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} available`;
        document.getElementById('resultCount').textContent =
            `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''}`;

        renderProducts(displayProducts);

    } catch (err) {
        console.error('Failed to load products:', err);
        document.getElementById('productsGrid').innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <span class="empty-emoji">⚠️</span>
                <p>Could not load products.<br>
                   Error: <strong>${err.message}</strong><br>
                   Make sure the server is running on port 5000.</p>
            </div>`;
        document.getElementById('catHeroSub').textContent = 'Error loading products';
    }
}

// ── Render products grid ──────────────────────────────────────
function renderProducts(list) {
    const grid = document.getElementById('productsGrid');

    if (!list.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <span class="empty-emoji">📦</span>
                <p>No products found in <strong>${catName}</strong>.</p>
            </div>`;
        return;
    }

    grid.innerHTML = list.map(p => {
        const imgUrl = p.image?.url;
        const mrp = p.price?.mrp;
        const selling = p.price?.sellingprice;
        const discount = p.price?.discount;
        const inStock = (p.stock?.quantity ?? 1) > 0;
        const unit = p.stock?.unit || '';

        const priceHTML = selling
            ? `<span class="prod-price">₹${selling}</span>
               ${mrp && mrp !== selling ? `<span class="prod-mrp">₹${mrp}</span>` : ''}
               ${discount ? `<span class="prod-discount">${discount}% off</span>` : ''}`
            : `<span class="prod-price">Price N/A</span>`;

        const imgHTML = imgUrl
            ? `<img src="${imgUrl}" alt="${p.name}" class="prod-img"
                    onerror="this.parentElement.innerHTML='<div class=prod-img-fallback>🛒</div>'">`
            : `<div class="prod-img-fallback">🛒</div>`;

        return `
            <div class="product-card ${!inStock ? 'out-of-stock' : ''}"
                 style="cursor:pointer;"
                 onclick="goToProduct('${p._id}')">
                <div class="prod-img-wrap">
                    ${imgHTML}
                    ${discount ? `<div class="prod-badge">${discount}% OFF</div>` : ''}
                    ${!inStock ? `<div class="out-of-stock-overlay">Out of Stock</div>` : ''}
                </div>
                <div class="prod-body">
                    <div class="prod-name">${p.name}</div>
                    <div class="prod-short-desc">${p.shortDescription || ''}</div>
                    ${unit ? `<div class="prod-unit">Per ${unit}</div>` : ''}
                    <div class="prod-price-row">${priceHTML}</div>
                    <button class="prod-add-btn" ${!inStock ? 'disabled' : ''}
                        onclick="event.stopPropagation(); addToCart('${p._id}', this, '${p.shopId || ''}')">
                        ${inStock ? '+ Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>`;
    }).join('');
}

// ── Sort ──────────────────────────────────────────────────────
document.getElementById('sortSelect').addEventListener('change', function () {
    let sorted = [...allProducts];
    if (this.value === 'price-asc') sorted.sort((a, b) => (a.price?.sellingprice || 0) - (b.price?.sellingprice || 0));
    if (this.value === 'price-desc') sorted.sort((a, b) => (b.price?.sellingprice || 0) - (a.price?.sellingprice || 0));
    if (this.value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    renderProducts(sorted);
});

// ── Search ────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    const filtered = q
        ? allProducts.filter(p => p.name.toLowerCase().includes(q))
        : allProducts;
    document.getElementById('resultCount').textContent =
        `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
    renderProducts(filtered);
});

// ── Navigate to product detail ────────────────────────────────
function goToProduct(id) {
    window.location.href = `product-detail.html?id=${id}`;
}

// ── Add to Cart (real API) ────────────────────────────────────
async function addToCart(productId, btn, productShopId) {
    const original = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/add`, {
            method: 'POST',
            body: JSON.stringify({ userId: currentUserId, productId, shopId: productShopId, quantity: 1 })
        });
        if (res.ok) {
            btn.textContent = '✓ Added!';
            btn.style.background = '#10b981';
            const badge = document.getElementById('cartBadge');
            const cur = parseInt(badge?.textContent) || 0;
            updateCartBadge(cur + 1);
        } else {
            btn.textContent = 'Failed!';
            btn.style.background = '#ef4444';
        }
    } catch (_) {
        btn.textContent = 'Error!';
        btn.style.background = '#ef4444';
    }
    setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
    }, 1800);
}

// ── Start ─────────────────────────────────────────────────────
loadProducts();
