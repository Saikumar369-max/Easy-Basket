// ============================================================
//  EASY BASKET — Profile Page
// ============================================================

const BASE_URL =
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://easy-basket.onrender.com') + '/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ── Logout helper ─────────────────────────────────────────────
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutBtnErr').addEventListener('click', logout);

// ── Fetch & render profile ────────────────────────────────────
async function loadProfile() {
    try {
        const res = await fetchWithAuth(`${BASE_URL}/profile`);

        if (!res.ok) throw new Error('Failed to fetch profile');

        const user = await res.json();

        // ── Populate fields ───────────────────────────────────
        // Avatar initials
        const initials = (user.name || 'U')
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        document.getElementById('profileAvatar').textContent = initials;

        document.getElementById('profileName').textContent = user.name || 'Unknown User';
        document.getElementById('profileEmail').textContent = user.email || '—';

        // Phone (optional field)
        if (user.phone) {
            document.getElementById('profilePhone').textContent = user.phone;
            document.getElementById('phoneRow').style.display = 'flex';
        }

        // Member since date
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            document.getElementById('profileSince').textContent =
                date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        // ── Show content, hide skeleton ───────────────────────
        document.getElementById('profileSkeleton').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';

    } catch (err) {
        console.error('Profile load error:', err);
        document.getElementById('profileSkeleton').style.display = 'none';
        document.getElementById('profileError').style.display = 'block';
    }
}

loadProfile();
