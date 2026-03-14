// ============================================================
//  EASY BASKET — Cart Page
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Decode JWT ────────────────────────────────────────────────
let currentUserId = null;
let currentUserName = '';
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    currentUserId = payload.id;
    currentUserName = payload.name || '';
    if (currentUserName) {
        document.getElementById('userGreeting').textContent =
            `Hello, ${currentUserName.split(' ')[0]} 👋`;
    }
} catch (_) { }

// ── State ─────────────────────────────────────────────────────
let cartItems = [];
let savedAddress = ''; // User's profile address (pre-filled default)

// ── Fetch cart ────────────────────────────────────────────────
async function loadCart() {
    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/${currentUserId}`);
        const data = await res.json();

        // Hide skeletons
        document.getElementById('skeletonCol').style.display = 'none';
        document.getElementById('skeletonSidebar').style.display = 'none';

        const items = data.items || [];
        cartItems = items;

        if (!items.length) {
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('emptyState').style.flexDirection = 'column';
            document.getElementById('emptyState').style.alignItems = 'center';
            updateBadge(0);
            return;
        }

        renderCart(items);

    } catch (err) {
        console.error('Cart load error:', err);
        document.getElementById('skeletonCol').style.display = 'none';
        document.getElementById('skeletonSidebar').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }
}

// ── Render ────────────────────────────────────────────────────
function renderCart(items) {
    const list = document.getElementById('cartItemsList');

    let totalQty = 0;
    let total = 0;

    list.innerHTML = items.map(item => {
        const p = item.productId;  // populated product object
        const qty = item.quantity;
        const name = p?.name || 'Unknown Product';
        const price = p?.price?.sellingprice || 0;
        const unit = p?.stock?.unit || '';
        const imgUrl = p?.image?.url;
        const productId = p?._id || item.productId;
        const lineTotal = price * qty;

        totalQty += qty;
        total += lineTotal;

        const imgHTML = imgUrl
            ? `<img src="${imgUrl}" alt="${name}" class="cart-item-img"
                    onerror="this.parentElement.innerHTML='<div class=cart-item-img-fallback>🛒</div>'">`
            : `<div class="cart-item-img-fallback">🛒</div>`;

        return `
            <div class="cart-item" id="item-${productId}">
                <div class="cart-item-img-wrap">${imgHTML}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${name}</div>
                    ${unit ? `<div class="cart-item-unit">Per ${unit}</div>` : ''}
                    <div class="cart-item-price">₹${price}</div>
                    <div class="cart-item-subtotal">Subtotal: ₹${lineTotal}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-stepper">
                        <button class="qty-btn" onclick="changeQty('${productId}', ${qty - 1})">−</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn" onclick="changeQty('${productId}', ${qty + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem('${productId}')">🗑 Remove</button>
                </div>
            </div>`;
    }).join('');

    // Show content
    document.getElementById('itemsCol').style.display = 'block';
    document.getElementById('summaryPanel').style.display = 'flex';
    document.getElementById('itemCountLabel').textContent =
        `(${totalQty} item${totalQty !== 1 ? 's' : ''})`;

    // Update summary
    document.getElementById('summaryItemCount').textContent = totalQty;
    document.getElementById('summarySubtotal').textContent = `₹${total}`;
    document.getElementById('summaryTotal').textContent = `₹${total}`;

    updateBadge(totalQty);
}

// ── Update qty ────────────────────────────────────────────────
async function changeQty(productId, newQty) {
    if (newQty < 1) { removeItem(productId); return; }
    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/update`, {
            method: 'PATCH',
            body: JSON.stringify({ userId: currentUserId, productId, quantity: newQty })
        });
        const data = await res.json();
        if (res.ok) {
            cartItems = data.cart?.items || cartItems;
            // Reload populated
            loadCart();
        }
    } catch (err) { console.error('Update qty error:', err); }
}

// ── Remove item ───────────────────────────────────────────────
async function removeItem(productId) {
    const el = document.getElementById(`item-${productId}`);
    if (el) { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; }

    try {
        const res = await fetchWithAuth(`${BASE_URL}/cart/remove`, {
            method: 'DELETE',
            body: JSON.stringify({ userId: currentUserId, productId })
        });
        if (res.ok) loadCart();
    } catch (err) {
        console.error('Remove error:', err);
        if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; }
    }
}

// ── Badge helper ──────────────────────────────────────────────
function updateBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }
}

// ── Fetch profile address ─────────────────────────────────────
async function fetchAndPrefillAddress() {
    const addrCard = document.getElementById('coAddrCard');
    const addrText = document.getElementById('coAddrText');
    const addrArea = document.getElementById('coAddress');

    // Reset to display-card mode every time overlay opens
    addrCard.style.display = 'flex';
    addrArea.style.display = 'none';
    document.getElementById('coChangeAddrBtn').textContent = '✏️ Change';

    if (savedAddress) {
        // Already fetched — just re-use
        addrText.textContent = savedAddress;
        addrArea.value = savedAddress;
        return;
    }

    addrText.textContent = 'Loading address…';
    try {
        const res = await fetchWithAuth(`${BASE_URL}/profile`);
        if (!res.ok) throw new Error();
        const user = await res.json();

        const addr = user.address || {};
        const parts = [addr.street, addr.city, addr.state].filter(Boolean);
        savedAddress = parts.length ? parts.join(', ') : '';

        if (savedAddress) {
            addrText.textContent = savedAddress;
            addrArea.value = savedAddress;
        } else {
            // No address saved — go straight to edit mode
            addrText.textContent = 'No saved address found';
            addrArea.value = '';
            toggleAddressEdit(true); // force open edit
        }
    } catch (_) {
        addrText.textContent = 'Could not load address';
        addrArea.value = '';
        toggleAddressEdit(true);
    }
}

// ── Toggle between display card and editable textarea ─────────
function toggleAddressEdit(forceOpen = false) {
    const addrCard = document.getElementById('coAddrCard');
    const addrArea = document.getElementById('coAddress');
    const btn = document.getElementById('coChangeAddrBtn');
    const isEditing = addrArea.style.display !== 'none';

    if (forceOpen || !isEditing) {
        // Switch to edit mode
        addrCard.style.display = 'none';
        addrArea.style.display = 'block';
        addrArea.focus();
        btn.textContent = '✅ Use This';
    } else {
        // Switch back to display card with whatever the user typed
        const typed = addrArea.value.trim();
        if (typed) savedAddress = typed;
        document.getElementById('coAddrText').textContent = savedAddress || 'No address set';
        addrCard.style.display = 'flex';
        addrArea.style.display = 'none';
        btn.textContent = '✏️ Change';
    }
}

// ── Buy Now — open overlay ────────────────────────────────────
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    // Sync total into overlay
    const totalText = document.getElementById('summaryTotal')?.textContent || '₹0';
    document.getElementById('coTotal').textContent = totalText;

    // Generate a random delivery time between 20 – 50 minutes
    const mins = Math.floor(Math.random() * 31) + 20; // 20..50
    const now = new Date();
    now.setMinutes(now.getMinutes() + mins);
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('coDeliveryTime').innerHTML =
        `⏱️ <strong>${mins} minutes</strong> &nbsp;·&nbsp; Arrives by <strong>${timeStr}</strong>`;

    // Pre-fill address from profile
    fetchAndPrefillAddress();

    // Show overlay
    document.getElementById('coPanel').classList.add('co-open');
    document.getElementById('coBackdrop').classList.add('co-open');
    document.body.style.overflow = 'hidden';
});

// ── Close overlay ─────────────────────────────────────────────
function closeOverlay() {
    document.getElementById('coPanel').classList.remove('co-open');
    document.getElementById('coBackdrop').classList.remove('co-open');
    document.body.style.overflow = '';
}
document.getElementById('coClose')?.addEventListener('click', closeOverlay);
document.getElementById('coBackdrop')?.addEventListener('click', closeOverlay);

// ── Place Order ───────────────────────────────────────────────
document.getElementById('coPlaceBtn')?.addEventListener('click', async () => {
    const addrArea = document.getElementById('coAddress');
    const isEditing = addrArea.style.display !== 'none';
    // Use textarea value if editing, otherwise use the saved/display address
    const address = isEditing
        ? addrArea.value.trim()
        : (savedAddress || addrArea.value.trim());

    if (!address) {
        // Force edit mode and highlight error
        toggleAddressEdit(true);
        addrArea.style.borderColor = '#ef4444';
        addrArea.placeholder = '⚠️ Please enter your delivery address!';
        addrArea.focus();
        return;
    }

    const btn = document.getElementById('coPlaceBtn');
    btn.textContent = 'Placing Order…';
    btn.disabled = true;

    try {
        const res = await fetchWithAuth(`${BASE_URL}/orders/place-order`, {
            method: 'POST',
            body: JSON.stringify({ deliveryAddress: address, paymentMethod: 'cod' })
        });
        const data = await res.json();

        if (res.ok) {
            btn.textContent = '✅ Order Placed!';
            btn.style.background = '#10b981';
            setTimeout(() => window.location.href = 'my-orders.html', 1200);
        } else {
            btn.textContent = data.message || 'Failed — try again';
            btn.style.background = '#ef4444';
            setTimeout(() => {
                btn.textContent = '🚀 Place Order';
                btn.style.background = '';
                btn.disabled = false;
            }, 2500);
        }
    } catch (err) {
        btn.textContent = 'Network error!';
        btn.style.background = '#ef4444';
        setTimeout(() => {
            btn.textContent = '🚀 Place Order';
            btn.style.background = '';
            btn.disabled = false;
        }, 2500);
    }
});

// ── Init ──────────────────────────────────────────────────────
loadCart();
