document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // Password generator elements
    const passwordLengthInput = document.getElementById('password-length');
    const includeUppercase = document.getElementById('include-uppercase');
    const includeLowercase = document.getElementById('include-lowercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');
    const generatedPasswordInput = document.getElementById('generated-password');
    const generateBtn = document.getElementById('generate-btn');
    const copyPasswordBtn = document.getElementById('copy-password');

    // Password storage elements
    const accountNameInput = document.getElementById('account-name');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const savePasswordBtn = document.getElementById('save-password-btn');
    const saveMessage = document.getElementById('save-message');
    const passwordsList = document.getElementById('passwords-list');

    // Check if user is logged in
    const isLoggedIn = await authManager.checkLoggedIn();
    if (isLoggedIn) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // Initialize password storage for the user
        const currentUser = authManager.getCurrentUser();
        await passwordStorage.initialize(currentUser.email);

        // Load stored passwords
        loadStoredPasswords();
    } else {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }

    // Tab switching
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Login form handler
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            loginError.textContent = 'Please fill in all fields';
            return;
        }

        try {
            await authManager.loginUser(email, password);

            // Initialize password storage
            await passwordStorage.initialize(email);

            // Show app container
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');

            // Clear form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            loginError.textContent = '';

            // Load stored passwords
            loadStoredPasswords();
        } catch (error) {
            loginError.textContent = error;
        }
    });

    // Signup form handler
    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (!email || !password || !confirmPassword) {
            signupError.textContent = 'Please fill in all fields';
            return;
        }

        if (password !== confirmPassword) {
            signupError.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 8) {
            signupError.textContent = 'Password must be at least 8 characters';
            return;
        }

        try {
            await authManager.registerUser(email, password);

            // Initialize password storage
            await passwordStorage.initialize(email);

            // Show app container
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');

            // Clear form
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-confirm').value = '';
            signupError.textContent = '';
        } catch (error) {
            signupError.textContent = error;
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', async () => {
        await authManager.logout();

        // Show auth container
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');

        // Reset tabs
        loginTab.click();
    });

    // Generate password
    generateBtn.addEventListener('click', () => {
        try {
            const options = {
                length: parseInt(passwordLengthInput.value, 10),
                includeLowercase: includeLowercase.checked,
                includeUppercase: includeUppercase.checked,
                includeNumbers: includeNumbers.checked,
                includeSymbols: includeSymbols.checked
            };

            const password = passwordGenerator.generatePassword(options);
            generatedPasswordInput.value = password;

            // Auto-copy to clipboard
            navigator.clipboard.writeText(password).then(() => {
                copyPasswordBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyPasswordBtn.textContent = 'Copy';
                }, 1500);
            });
        } catch (error) {
            alert(error.message);
        }
    });

    // Copy generated password
    copyPasswordBtn.addEventListener('click', () => {
        const password = generatedPasswordInput.value;
        if (password) {
            navigator.clipboard.writeText(password).then(() => {
                copyPasswordBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyPasswordBtn.textContent = 'Copy';
                }, 1500);
            });
        }
    });

    // Save password
    savePasswordBtn.addEventListener('click', async () => {
        const account = accountNameInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!account || !password) {
            showSaveMessage('Account and password are required', 'error');
            return;
        }

        try {
            const currentUser = authManager.getCurrentUser();

            if (!currentUser) {
                showSaveMessage('You must be logged in to save passwords', 'error');
                return;
            }

            await passwordStorage.savePassword(
                { account, username, password },
                currentUser.email,
                currentUser.encryptionKey
            );

            // Clear form
            accountNameInput.value = '';
            usernameInput.value = '';
            passwordInput.value = '';

            showSaveMessage('Password saved successfully', 'success');

            // Refresh password list
            loadStoredPasswords();
        } catch (error) {
            showSaveMessage(error, 'error');
        }
    });

    // Load stored passwords
    async function loadStoredPasswords() {
        const currentUser = authManager.getCurrentUser();

        if (!currentUser) {
            return;
        }

        const passwords = await passwordStorage.getAllPasswords(
            currentUser.email,
            currentUser.encryptionKey
        );

        // Clear passwords list
        passwordsList.innerHTML = '';

        if (passwords.length === 0) {
            passwordsList.innerHTML = '<p>No passwords stored yet</p>';
            return;
        }

        // Sort passwords by account name
        passwords.sort((a, b) => a.account.localeCompare(b.account));

        // Render passwords
        passwords.forEach(entry => {
            const passwordItem = document.createElement('div');
            passwordItem.className = 'password-item';
            passwordItem.innerHTML = `
                <div><strong>Account:</strong> ${escapeHtml(entry.account)}</div>
                ${entry.username ? `<div><strong>Username:</strong> ${escapeHtml(entry.username)}</div>` : ''}
                <div>
                    <strong>Password:</strong> 
                    <span class="password-value">•••••••••••</span>
                    <button class="show-password" data-password="${escapeHtml(entry.password)}">Show</button>
                </div>
                <div class="password-actions">
                    <button class="copy-btn" data-password="${escapeHtml(entry.password)}">Copy</button>
                    <button class="delete-btn" data-id="${entry.id}">Delete</button>
                </div>
            `;

            passwordsList.appendChild(passwordItem);
        });

        // Add event listeners for show password buttons
        document.querySelectorAll('.show-password').forEach(button => {
            button.addEventListener('click', function () {
                const passwordSpan = this.previousElementSibling;
                const password = this.getAttribute('data-password');

                if (this.textContent === 'Show') {
                    passwordSpan.textContent = password;
                    this.textContent = 'Hide';
                } else {
                    passwordSpan.textContent = '•••••••••••';
                    this.textContent = 'Show';
                }
            });
        });

        // Add event listeners for copy password buttons
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', function () {
                const password = this.getAttribute('data-password');

                navigator.clipboard.writeText(password).then(() => {
                    const originalText = this.textContent;
                    this.textContent = 'Copied!';

                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1500);
                });
            });
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function () {
                const id = this.getAttribute('data-id');
                const currentUser = authManager.getCurrentUser();

                if (confirm('Are you sure you want to delete this password?')) {
                    try {
                        await passwordStorage.deletePassword(id, currentUser.email);
                        loadStoredPasswords(); // Refresh list
                    } catch (error) {
                        alert('Failed to delete password: ' + error);
                    }
                }
            });
        });
    }

    // Show save message with status
    function showSaveMessage(message, type) {
        saveMessage.textContent = message;
        saveMessage.className = type;

        setTimeout(() => {
            saveMessage.textContent = '';
            saveMessage.className = '';
        }, 3000);
    }

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});