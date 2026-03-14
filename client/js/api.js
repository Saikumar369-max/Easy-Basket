// Centralized API handling
const API_BASE_URL = 'http://localhost:5000/api';

// ── Silent token refresh ───────────────────────────────────────
// Calls the existing POST /api/auth/refreshToken endpoint.
// The server reads the httpOnly refreshToken cookie (set on login).
async function _doTokenRefresh() {
    const res = await fetch(`${API_BASE_URL}/auth/refreshToken`, {
        method: 'POST',
        credentials: 'include'  // sends the httpOnly refreshToken cookie
    });
    if (!res.ok) throw new Error('Session expired');
    const json = await res.json();
    const newToken = json.accesstoken || json.token;
    if (!newToken) throw new Error('Session expired');
    localStorage.setItem('token', newToken);
    return newToken;
}

// ── fetchWithAuth ──────────────────────────────────────────────
// Drop-in replacement for fetch() on authenticated endpoints.
// On 400/401 it tries to refresh the token once and retries.
// On permanent auth failure it redirects to login.
async function fetchWithAuth(url, options = {}, isOwner = false) {
    let currentToken = localStorage.getItem('token');

    // Inject the Authorization header
    const buildOptions = (tok) => ({
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${tok}`
        }
    });

    let res = await fetch(url, buildOptions(currentToken));

    // 400 / 401 → try to refresh once
    if (res.status === 400 || res.status === 401) {
        try {
            currentToken = await _doTokenRefresh();
            res = await fetch(url, buildOptions(currentToken));  // retry
        } catch (_) {
            // Refresh failed → redirect to appropriate login page
            const loginPage = isOwner ? 'owner-login.html' : 'login.html';
            localStorage.removeItem('token');
            window.location.href = loginPage;
            throw new Error('Session expired. Redirecting to login...');
        }
    }

    return res;
}

const api = {
    // Helper function for fetch requests
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add token if exists and needed
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Something went wrong');
            }
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    // Auth specific API calls
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        })
    }
};

