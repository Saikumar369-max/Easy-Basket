// ============================================================
//  EASY BASKET — Product Detail Page
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

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

// ── Cart badge ──────────────────────────────────────────────────
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

// ── Read ?id= from URL ────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

if (!productId) {
    showError();
}

// ── Helpers ───────────────────────────────────────────────────
function showError() {
    document.getElementById('skeleton').style.display = 'none';
    document.getElementById('detailCard').style.display = 'none';
    document.getElementById('descSection').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ── Load product ──────────────────────────────────────────────
async function loadProduct() {
    try {
        const res = await fetchWithAuth(`${BASE_URL}/products/${productId}`);

        if (!res.ok) { showError(); return; }

        const p = await res.json();
        const productShopId = typeof p.shopId === 'object' ? p.shopId?._id : p.shopId;

        // Update page title & breadcrumb
        document.title = `${p.name} — Easy Basket`;
        setEl('bcProduct', p.name);
        setEl('productName', p.name);

        // Short description
        if (p.shortDescription) {
            setEl('shortDesc', p.shortDescription);
        } else {
            document.getElementById('shortDesc').style.display = 'none';
        }

        // Category tag
        setEl('categoryTag', p.categoryId?.name || 'Product');

        // Image
        const imgPanel = document.getElementById('imgPanel');
        if (p.image?.url) {
            imgPanel.innerHTML = `
                <img src="${p.image.url}" alt="${p.name}" class="detail-img"
                     onerror="this.parentElement.innerHTML='<div class=detail-img-fallback>🛒</div>'">
                ${p.price?.discount ? `<div class="detail-badge">${p.price.discount}% OFF</div>` : ''}
                ${(p.stock?.quantity ?? 1) <= 0 ? `<div class="detail-oos-overlay">Out of Stock</div>` : ''}
            `;
        } else {
            imgPanel.innerHTML = `
                <div class="detail-img-fallback">🛒</div>
                ${(p.stock?.quantity ?? 1) <= 0 ? `<div class="detail-oos-overlay">Out of Stock</div>` : ''}
            `;
        }

        // Price row
        const priceRow = document.getElementById('priceRow');
        const selling = p.price?.sellingprice;
        const mrp = p.price?.mrp;
        const discount = p.price?.discount;
        if (selling) {
            priceRow.innerHTML = `
                <span class="detail-price">₹${selling}</span>
                ${mrp && mrp !== selling ? `<span class="detail-mrp">₹${mrp}</span>` : ''}
                ${discount ? `<span class="detail-discount">${discount}% off</span>` : ''}
            `;
        } else {
            priceRow.innerHTML = `<span class="detail-price">Price N/A</span>`;
        }

        // Meta chips (unit, weight, etc.)
        const meta = document.getElementById('metaChips');
        const chips = [];
        if (p.stock?.unit) chips.push(`<div class="meta-chip"><span>📦</span> Per ${p.stock.unit}</div>`);
        if (p.weight) chips.push(`<div class="meta-chip"><span>⚖️</span> ${p.weight}</div>`);
        if (p.brand) chips.push(`<div class="meta-chip"><span>🏷️</span> ${p.brand}</div>`);
        meta.innerHTML = chips.join('');

        // Stock badge
        const inStock = (p.stock?.quantity ?? 1) > 0;
        const stockEl = document.getElementById('stockBadge');
        stockEl.innerHTML = inStock
            ? `<span class="stock-badge in-stock">✅ In Stock</span>`
            : `<span class="stock-badge out-stock">❌ Out of Stock</span>`;

        // Add to Cart button (real API)
        const addBtn = document.getElementById('addToCartBtn');
        if (!inStock) {
            addBtn.disabled = true;
            addBtn.textContent = 'Out of Stock';
        } else {
            addBtn.addEventListener('click', async () => {
                addBtn.textContent = 'Adding...';
                addBtn.disabled = true;
                addBtn.classList.remove('added');
                try {
                    const res = await fetchWithAuth(`${BASE_URL}/cart/add`, {
                        method: 'POST',
                        body: JSON.stringify({ userId: currentUserId, productId, shopId: productShopId, quantity: 1 })
                    });
                    if (res.ok) {
                        addBtn.textContent = '✓ Added to Cart!';
                        addBtn.classList.add('added');
                        const badge = document.getElementById('cartBadge');
                        const cur = parseInt(badge?.textContent) || 0;
                        updateCartBadge(cur + 1);
                    } else {
                        addBtn.textContent = 'Failed — try again';
                    }
                } catch (_) {
                    addBtn.textContent = 'Error!';
                }
                setTimeout(() => {
                    addBtn.textContent = '+ Add to Cart';
                    addBtn.classList.remove('added');
                    addBtn.disabled = false;
                }, 2000);
            });
        }

        // Shop link — try to fetch shop name
        if (p.shopId) {
            const shopId = typeof p.shopId === 'object' ? p.shopId._id : p.shopId;
            const shopName = typeof p.shopId === 'object' ? p.shopId.name : null;

            const shopLink = document.getElementById('shopLink');
            shopLink.style.display = 'flex';

            if (shopName) {
                setEl('shopLinkName', shopName);
                shopLink.href = `shop-products.html?id=${shopId}&name=${encodeURIComponent(shopName)}`;
            } else {
                // Fetch shop name from API
                try {
                    const shopRes = await fetchWithAuth(`${BASE_URL}/shops/${shopId}`);
                    if (shopRes.ok) {
                        const shopData = await shopRes.json();
                        const shop = shopData.data || shopData;
                        setEl('shopLinkName', shop.name || 'View Shop');
                        shopLink.href = `shop-products.html?id=${shopId}&name=${encodeURIComponent(shop.name || '')}`;
                    }
                } catch (_) {
                    setEl('shopLinkName', 'View Shop');
                    shopLink.href = `shop-products.html?id=${shopId}`;
                }
            }

            // Update breadcrumb "prev" link to shop
            const bcPrev = document.getElementById('bcPrev');
            bcPrev.textContent = document.getElementById('shopLinkName').textContent || 'Products';
        }

        // Description
        if (p.description) {
            setEl('descText', p.description);
            document.getElementById('descSection').style.display = 'block';
        }

        // Reveal card
        document.getElementById('skeleton').style.display = 'none';
        document.getElementById('detailCard').style.display = 'grid';

    } catch (err) {
        console.error('Failed to load product:', err);
        showError();
    }
}

// ── Init ──────────────────────────────────────────────────────
loadProduct();
