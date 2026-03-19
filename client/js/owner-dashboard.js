// ============================================================
//  EASY BASKET — Shop Owner Dashboard
// ============================================================

const BASE_URL =
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://easy-basket.onrender.com') + '/api';

// ── Auth guard ────────────────────────────────────────────────
let token = localStorage.getItem('token');
if (!token) window.location.href = 'owner-login.html';

// ── Decode JWT payload ────────────────────────────────────────
let currentUserId = null;
let ownerName = 'Owner';
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUserId = payload.id;
    ownerName = payload.name || 'Owner';
} catch (_) { }

// ── Populate sidebar owner info ───────────────────────────────
document.getElementById('ownerName').textContent = ownerName;

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (_) { }
    localStorage.removeItem('token');
    window.location.href = 'owner-login.html';
});

// ── Hamburger (mobile) ────────────────────────────────────────
document.getElementById('hamBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ── Refresh orders button ──────────────────────────────────────
async function refreshOrders() {
    const btn = document.getElementById('refreshOrdersBtn');
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    btn.textContent = '⏳ Refreshing...';

    try {
        if (currentShopId) {
            // Shop already loaded — just re-fetch orders
            await loadOrders();
        } else {
            // Shop not loaded yet — load shop first (which also loads orders)
            await loadShop();
        }
        showToast('Orders refreshed ✅');
    } catch (_) {
        showToast('Failed to refresh. Try again.', 'error');
    } finally {
        btn.textContent = '🔄 Refresh';
        btn.disabled = false;
    }
}

// ── Toast helper ──────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Tab switching ─────────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));

    document.getElementById(`tab-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`)?.classList.add('active');

    const titles = { overview: 'Overview', orders: 'Orders', store: 'My Store' };
    document.getElementById('topbarTitle').textContent = titles[name] || name;

    // Lazy-load store products on first open
    if (name === 'store' && !storeLoaded) {
        storeLoaded = true;
        loadStore();
    }
}

// ── Status badge HTML ─────────────────────────────────────────
function badgeHTML(status) {
    const map = {
        pending: { cls: 'badge-pending', icon: '🕐', label: 'Pending' },
        completed: { cls: 'badge-completed', icon: '✅', label: 'Completed' },
        cancelled: { cls: 'badge-cancelled', icon: '❌', label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return `<span class="badge ${s.cls}">${s.icon} ${s.label}</span>`;
}

// ── Format date ───────────────────────────────────────────────
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ── State ─────────────────────────────────────────────────────
let allOrders = [];
let currentShopId = null;
let activeFilter = 'all';
let storeLoaded = false;  // lazy-load flag for My Store tab

// ── Fetch shop for this owner ─────────────────────────────────
async function loadShop() {
    try {
        const res = await fetchWithAuth(`${BASE_URL}/shops/my-shop`, {}, true);
        const json = await res.json();
        if (!res.ok || !json.data) throw new Error(json.message || 'Shop not found');

        const shop = json.data;
        currentShopId = shop._id;

        document.getElementById('shopName').textContent = shop.name;
        document.getElementById('ownerEmail').textContent = shop.address?.city || '';

        await loadOrders();
    } catch (err) {
        console.error('Shop load error:', err);
        showToast('Could not load your shop info. ' + err.message, 'error');
    }
}

// ── Fetch orders for this shop ────────────────────────────────
async function loadOrders() {
    if (!currentShopId) return;
    try {
        const res = await fetchWithAuth(`${BASE_URL}/shoporders/${currentShopId}`, {}, true);
        allOrders = await res.json();
        if (!Array.isArray(allOrders)) allOrders = [];

        renderStats(allOrders);
        renderOrdersTable(allOrders, 'ordersTableWrap', 'ordersEmpty');
        renderRecentOrders(allOrders.slice(0, 5));
        updateOrdersCount(allOrders);
    } catch (err) {
        console.error('Orders load error:', err);
        showToast('Failed to load orders.', 'error');
    }
}

// ── Fetch & render shop products (My Store tab) ────────────────
async function loadStore() {
    if (!currentShopId) {
        // Shop not loaded yet — load it first
        await loadShop();
    }
    const grid = document.getElementById('storeProductsGrid');
    const empty = document.getElementById('storeEmpty');
    const countEl = document.getElementById('storeProductCount');
    try {
        const res = await fetchWithAuth(`${BASE_URL}/products/shop/${currentShopId}`, {}, true);
        const data = await res.json();
        const products = Array.isArray(data) ? data : (data.data || []);

        countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} in your shop`;

        if (!products.length) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        renderStoreProducts(products, grid);
    } catch (err) {
        console.error('Store load error:', err);
        grid.innerHTML = `<p style="padding:20px;color:var(--red);">Failed to load products.</p>`;
        countEl.textContent = 'Error loading';
    }
}

function renderStoreProducts(products, grid) {
    grid.innerHTML = products.map(p => {
        const imgUrl = p.image?.url;
        const selling = p.price?.sellingprice;
        const mrp = p.price?.mrp;
        const discount = p.price?.discount;
        const inStock = (p.stock?.quantity ?? 1) > 0;
        const unit = p.stock?.unit || '';

        const imgHTML = imgUrl
            ? `<img src="${imgUrl}" alt="${p.name}"
                    onerror="this.parentElement.innerHTML='<div class=store-prod-img-fallback>🛒</div>'">`
            : `<div class="store-prod-img-fallback">🛒</div>`;

        const priceHTML = selling
            ? `<span class="sp-price">₹${selling}</span>
               ${mrp && mrp !== selling ? `<span class="sp-mrp">₹${mrp}</span>` : ''}
               ${discount ? `<span class="sp-discount">${discount}% off</span>` : ''}`
            : `<span class="sp-price">Price N/A</span>`;

        return `
        <div class="store-prod-card ${!inStock ? 'out-of-stock' : ''}">
            <div class="store-prod-img">${imgHTML}</div>
            <div class="store-prod-body">
                <div class="store-prod-name">${p.name}</div>
                ${unit ? `<div class="store-prod-unit">Per ${unit}</div>` : ''}
                <div class="store-prod-price-row">${priceHTML}</div>
                <div class="store-prod-stock ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Render stat cards ─────────────────────────────────────────
function renderStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const revenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((s, o) => s + (o.totalAmount || 0), 0);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statRevenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
}

// ── Update orders count label ─────────────────────────────────
function updateOrdersCount(orders) {
    let filtered = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);
    document.getElementById('ordersCount').textContent =
        `${filtered.length} order${filtered.length !== 1 ? 's' : ''} found`;
}

// ── Build orders table HTML ───────────────────────────────────
function buildTableHTML(orders) {
    if (!orders.length) return '';
    const rows = orders.map((order, idx) => {
        const shortId = (order._id || '').slice(-8).toUpperCase();
        const items = order.items?.length || 0;
        return `
        <tr onclick="openDrawer(${idx})">
            <td class="order-id-cell">#${shortId}</td>
            <td>${fmtDate(order.createdAt)}</td>
            <td>${items} item${items !== 1 ? 's' : ''}</td>
            <td class="order-amount-cell">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
            <td>${badgeHTML(order.status)}</td>
        </tr>`;
    }).join('');

    return `
    <table class="orders-table">
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>`;
}

// ── Render full orders table ──────────────────────────────────
function renderOrdersTable(orders, wrapId, emptyId) {
    const filtered = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);
    const wrap = document.getElementById(wrapId);
    const empty = document.getElementById(emptyId);

    if (!filtered.length) {
        wrap.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    wrap.innerHTML = buildTableHTML(filtered);
    updateOrdersCount(orders);
}

// ── Render recent orders (overview tab) ───────────────────────
function renderRecentOrders(orders) {
    const wrap = document.getElementById('recentOrdersWrap');
    if (!orders.length) {
        wrap.innerHTML = `<div class="empty-state" style="padding:40px 20px;">
            <span class="es-emoji">📭</span>
            <h3>No orders yet</h3>
        </div>`;
        return;
    }
    wrap.innerHTML = buildTableHTML(orders);
}

// ── Filter orders ─────────────────────────────────────────────
function filterOrders(status) {
    activeFilter = status;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    document.getElementById(`pill-${status}`)?.classList.add('active');
    renderOrdersTable(allOrders, 'ordersTableWrap', 'ordersEmpty');
}

// ── Order detail drawer ───────────────────────────────────────
// We keep a separate filtered list for drawer index mapping
function openDrawer(idx) {
    const filtered = activeFilter === 'all'
        ? allOrders
        : allOrders.filter(o => o.status === activeFilter);
    const order = filtered[idx];
    if (!order) return;

    const drawerOrder = order; // capture
    const shortId = (order._id || '').slice(-8).toUpperCase();

    // Build items HTML
    const itemsHTML = (order.items || []).map(item => {
        const p = item.productId;
        const name = (typeof p === 'object' ? p?.name : null) || 'Product';
        const price = (typeof p === 'object' ? p?.price?.sellingprice : null) || 0;
        const imgUrl = (typeof p === 'object' ? p?.image?.url : null);
        const imgTag = imgUrl
            ? `<img src="${imgUrl}" alt="${name}" onerror="this.parentElement.innerHTML='📦'">`
            : '📦';

        return `
        <div class="drawer-item">
            <div class="di-img">${imgTag}</div>
            <div class="di-info">
                <div class="di-name">${name}</div>
                <div class="di-qty">Qty: ${item.quantity}</div>
            </div>
            <div class="di-price">₹${price * item.quantity}</div>
        </div>`;
    }).join('');

    document.getElementById('drawerContent').innerHTML = `
        <div class="drawer-info-row">
            <span class="di-label">Order ID</span>
            <span class="di-val" style="font-family:monospace">#${shortId}</span>
        </div>
        <div class="drawer-info-row">
            <span class="di-label">Date</span>
            <span class="di-val">${fmtDate(order.createdAt)}</span>
        </div>
        <div class="drawer-info-row">
            <span class="di-label">Total Amount</span>
            <span class="di-val" style="color:var(--green)">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div class="drawer-info-row">
            <span class="di-label">Status</span>
            <span class="di-val">${badgeHTML(order.status)}</span>
        </div>

        <div class="drawer-items-title">Items Ordered</div>
        ${itemsHTML}

        <div class="drawer-status-select">
            <label for="statusSelect">Update Order Status</label>
            <select id="statusSelect">
                <option value="pending"   ${order.status === 'pending' ? 'selected' : ''}>🕐 Pending</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
            <button class="btn-update" id="updateStatusBtn"
                onclick="updateOrderStatus('${order._id}')">
                Update Status
            </button>
        </div>
    `;

    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('orderDrawer').classList.add('open');
}

function closeDrawer() {
    document.getElementById('drawerOverlay').classList.remove('open');
    document.getElementById('orderDrawer').classList.remove('open');
}

// ── Update order status ───────────────────────────────────────
async function updateOrderStatus(orderId) {
    const select = document.getElementById('statusSelect');
    const btn = document.getElementById('updateStatusBtn');
    const newStatus = select.value;

    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
        const res = await fetch(`${BASE_URL}/shoporders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Update failed');
        }

        // Update local state
        const order = allOrders.find(o => o._id === orderId);
        if (order) order.status = newStatus;

        closeDrawer();
        renderStats(allOrders);
        renderOrdersTable(allOrders, 'ordersTableWrap', 'ordersEmpty');
        renderRecentOrders(allOrders.slice(0, 5));
        showToast(`Order status updated to "${newStatus}" ✅`);
    } catch (err) {
        showToast('Failed to update: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Update Status';
        }
    }
}

// ── Add Product Modal ─────────────────────────────────────────

async function openAddProductModal() {
    document.getElementById('addProductOverlay').classList.add('open');
    document.getElementById('addProductModal').classList.add('open');

    // Load categories into dropdown
    const select = document.getElementById('ap-category');
    if (select.options.length <= 1) {
        try {
            const res = await fetch(`${BASE_URL}/categories`);
            const data = await res.json();
            const cats = Array.isArray(data) ? data : (data.data || []);
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c._id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        } catch (_) { /* categories optional */ }
    }
}

function closeAddProductModal() {
    document.getElementById('addProductOverlay').classList.remove('open');
    document.getElementById('addProductModal').classList.remove('open');
    document.getElementById('addProductForm').reset();
    // Reset image preview
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('imgPreview').src = '';
    document.getElementById('imgPlaceholder').style.display = 'flex';
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('imgPreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        document.getElementById('imgPlaceholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function submitAddProduct(event) {
    event.preventDefault();

    const form = event.target;
    const btn = document.getElementById('submitProductBtn');

    // Basic validation
    const name = document.getElementById('ap-name').value.trim();
    const shortDescription = document.getElementById('ap-short').value.trim();
    const description = document.getElementById('ap-desc').value.trim();
    const imageFile = document.getElementById('ap-image').files[0];

    if (!name || !shortDescription || !description) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    if (!imageFile) {
        showToast('Please select a product image.', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';

    try {
        // Build nested price & stock objects as JSON strings (FormData is flat)
        const price = {
            mrp: parseFloat(document.getElementById('ap-mrp').value) || undefined,
            sellingprice: parseFloat(document.getElementById('ap-selling').value) || undefined,
            discount: parseFloat(document.getElementById('ap-discount').value) || undefined,
        };
        const stock = {
            quantity: parseInt(document.getElementById('ap-qty').value) || undefined,
            unit: document.getElementById('ap-unit').value.trim() || undefined,
        };

        const formData = new FormData();
        formData.append('name', name);
        formData.append('shortDescription', shortDescription);
        formData.append('description', description);
        formData.append('categoryId', document.getElementById('ap-category').value || '');
        formData.append('price', JSON.stringify(price));
        formData.append('stock', JSON.stringify(stock));
        formData.append('shopId', currentShopId || '');
        formData.append('image', imageFile);

        const res = await fetch(`${BASE_URL}/uploadProducts/add-product`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Upload failed');

        showToast('Product added successfully ✅');
        closeAddProductModal();

        // Refresh store tab
        storeLoaded = false;
        if (document.getElementById('tab-store').classList.contains('active')) {
            storeLoaded = true;
            // Clear old grid skeletons then reload
            document.getElementById('storeProductsGrid').innerHTML =
                '<div class="skeleton-row" style="height:120px;border-radius:14px;"></div>'.repeat(3);
            await loadStore();
        }
    } catch (err) {
        showToast('Failed to add product: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Upload Product';
    }
}

// ── Init ──────────────────────────────────────────────────────
loadShop();

