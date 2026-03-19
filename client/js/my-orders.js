// ============================================================
//  EASY BASKET — My Orders Page
// ============================================================

const BASE_URL =
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://easy-basket.onrender.com') + '/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// ── Greet user + decode userId ────────────────────────────────
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
(async () => {
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
})();

// ── Status helpers ────────────────────────────────────────────
const STATUS_LABELS = {
    pending: { cls: 'status-pending', icon: '🕐', label: 'Pending' },
    completed: { cls: 'status-completed', icon: '✅', label: 'Completed' },
    cancelled: { cls: 'status-cancelled', icon: '❌', label: 'Cancelled' },
};

function statusBadge(status) {
    const s = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return `<span class="order-status ${s.cls}">${s.icon} ${s.label}</span>`;
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ── Render orders ─────────────────────────────────────────────
function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    list.innerHTML = `<h2 class="orders-heading">📋 My Orders <small style="font-size:0.82rem;font-weight:400;color:#64748b;">(${orders.length} order${orders.length !== 1 ? 's' : ''})</small></h2>`;

    orders.forEach((order, idx) => {
        const card = document.createElement('div');
        card.className = 'order-card';

        const itemsHTML = order.items.map(item => {
            const p = item.productId;
            const name = p?.name || 'Product';
            const price = p?.price?.sellingprice || 0;
            const imgUrl = p?.image?.url;
            const imgHTML = imgUrl
                ? `<img src="${imgUrl}" alt="${name}" onerror="this.parentElement.innerHTML='<div class=order-item-img-fallback>🛒</div>'">`
                : `<div class="order-item-img-fallback">🛒</div>`;

            return `
                <div class="order-item-row">
                    <div class="order-item-img">${imgHTML}</div>
                    <div class="order-item-info">
                        <div class="order-item-name">${name}</div>
                        <div class="order-item-qty">Qty: ${item.quantity}</div>
                    </div>
                    <div class="order-item-price">₹${price * item.quantity}</div>
                </div>`;
        }).join('');

        const shortId = (order._id || '').slice(-8).toUpperCase();

        card.innerHTML = `
            <div class="order-header" onclick="toggleOrder('items-${idx}', 'arrow-${idx}')">
                <div class="order-header-left">
                    <span class="order-id">Order #${shortId}</span>
                    <span class="order-date">${fmtDate(order.createdAt)}</span>
                </div>
                <div class="order-header-right">
                    ${statusBadge(order.status)}
                    <span class="order-total">₹${order.totalAmount}</span>
                    <span class="order-toggle" id="arrow-${idx}">▼</span>
                </div>
            </div>
            <div class="order-items" id="items-${idx}">
                ${itemsHTML}
                <div class="order-footer">
                    <span>${order.items.length} item${order.items.length !== 1 ? 's' : ''}</span>
                    <span>Total: <strong>₹${order.totalAmount}</strong></span>
                </div>
            </div>`;

        list.appendChild(card);
    });

    document.getElementById('skeletonList').style.display = 'none';
    list.style.display = 'block';
}

// ── Toggle order details ──────────────────────────────────────
function toggleOrder(itemsId, arrowId) {
    const items = document.getElementById(itemsId);
    const arrow = document.getElementById(arrowId);
    const isOpen = items.classList.toggle('expanded');
    arrow.classList.toggle('open', isOpen);
}

// ── Load orders ───────────────────────────────────────────────
async function loadOrders() {
    try {
        const res = await fetchWithAuth(`${BASE_URL}/orders/my-orders`);
        const orders = await res.json();

        document.getElementById('skeletonList').style.display = 'none';

        if (!Array.isArray(orders) || !orders.length) {
            document.getElementById('emptyState').style.display = 'block';
            return;
        }

        renderOrders(orders);
    } catch (err) {
        console.error('Failed to load orders:', err);
        document.getElementById('skeletonList').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
}

// ── Init ──────────────────────────────────────────────────────
loadOrders();
