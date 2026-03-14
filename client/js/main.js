// General application logic and initialization

// Helper to show messages in forms
function showMessage(form, message, type = 'error') {
    // Remove existing alert if any
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;

    // Insert at the top of the form
    form.insertBefore(alertDiv, form.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle Login Form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                // Disable button and show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';

                // Call the API
                const data = await api.auth.login({ email, password });

                // Save token and redirect
                localStorage.setItem('token', data.token);

                // Show success and redirect
                showMessage(loginForm, 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'shopping.html';
                }, 1000);

            } catch (error) {
                showMessage(loginForm, error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }

    // Handle Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const street = document.getElementById('street').value;
            const city = document.getElementById('city').value;
            const state = document.getElementById('state').value;

            const submitBtn = registerForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';

                // Call the API
                const data = await api.auth.register({
                    name,
                    email,
                    password,
                    role,
                    address: { street, city, state }
                });

                // Save token and redirect
                localStorage.setItem('token', data.token);

                // Show success and redirect
                showMessage(registerForm, 'Registration successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'shopping.html';
                }, 1000);

            } catch (error) {
                // Parse mongoose validation errors into user-friendly messages
                let errorMsg = error.message;
                if (errorMsg.includes('validation failed')) {
                    // Extract the specific field errors (e.g., "Path `address.city` is required.")
                    const parts = errorMsg.split(':').slice(1).join(':').split(',');
                    if (parts.length > 0) {
                        // Take the first error and clean it up
                        let firstError = parts[0].trim();
                        // Change "Path `address.city` is required." to "City is required."
                        firstError = firstError.replace(/Path `([^`]+)` is required\./g, (match, p1) => {
                            // Convert 'address.city' to 'City'
                            const field = p1.split('.').pop();
                            return field.charAt(0).toUpperCase() + field.slice(1) + ' is required.';
                        });
                        // Change "`customer` is not a valid enum value for path `role`."
                        firstError = firstError.replace(/`([^`]+)` is not a valid enum value for path `([^`]+)`\./g, (match, val, field) => {
                            return 'Invalid ' + field + ' selected.';
                        });

                        errorMsg = firstError;
                    }
                }

                showMessage(registerForm, errorMsg, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }

    // Handle Owner Login Form
    const ownerLoginForm = document.getElementById('ownerLoginForm');
    if (ownerLoginForm) {
        ownerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = ownerLoginForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';

                const data = await api.auth.login({ email, password });

                localStorage.setItem('token', data.token);

                showMessage(ownerLoginForm, 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'owner-dashboard.html';
                }, 1000);

            } catch (error) {
                showMessage(ownerLoginForm, error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In as Owner';
            }
        });
    }
});
