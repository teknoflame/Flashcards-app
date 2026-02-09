// auth.js
// ========
// Handles Firebase Authentication for SparkDeck.
// This file manages sign up, sign in, sign out, and auth state changes.
// It shows/hides the auth screen vs the main app based on login status.

(function () {
    // ---- DOM References ----
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    const authError = document.getElementById('auth-error');
    const announcements = document.getElementById('announcements');

    // Login form elements
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginSubmitBtn = document.getElementById('login-submit-btn');

    // Signup form elements
    const signupForm = document.getElementById('signup-form');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm-password');
    const signupSubmitBtn = document.getElementById('signup-submit-btn');

    // Toggle buttons and their containers
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const authToggleLogin = document.getElementById('auth-toggle-login');
    const authToggleSignup = document.getElementById('auth-toggle-signup');
    const authDivider = authScreen.querySelector('.auth-divider');

    // Sign out button (in main app header)
    const signOutBtn = document.getElementById('sign-out-btn');
    const userEmailDisplay = document.getElementById('user-email-display');

    // ---- Helper Functions ----

    function announce(message) {
        if (announcements) {
            announcements.textContent = message;
            setTimeout(function () { announcements.textContent = ''; }, 3000);
        }
    }

    function showError(message) {
        authError.textContent = message;
        authError.classList.remove('hidden');
        authError.setAttribute('role', 'alert');
        announce(message);
    }

    function clearError() {
        authError.textContent = '';
        authError.classList.add('hidden');
    }

    function setLoading(button, loading) {
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Please wait...';
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
        }
    }

    // Convert Firebase error codes to friendly messages
    function getFriendlyError(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Try signing in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters long.';
            case 'auth/user-not-found':
                return 'No account found with this email. Try signing up instead.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-credential':
                return 'Incorrect email or password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please wait a moment and try again.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return 'Something went wrong. Please try again.';
        }
    }

    // ---- Form Toggle ----

    showSignupBtn.addEventListener('click', function () {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authToggleLogin.classList.add('hidden');
        authToggleSignup.classList.remove('hidden');
        clearError();
        signupEmail.focus();
        announce('Switched to sign up form');
    });

    showLoginBtn.addEventListener('click', function () {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authToggleSignup.classList.add('hidden');
        authToggleLogin.classList.remove('hidden');
        clearError();
        loginEmail.focus();
        announce('Switched to sign in form');
    });

    // ---- Sign Up ----

    signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearError();

        var email = signupEmail.value.trim();
        var password = signupPassword.value;
        var confirm = signupConfirm.value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            signupPassword.focus();
            return;
        }

        if (password !== confirm) {
            showError('Passwords do not match.');
            signupConfirm.focus();
            return;
        }

        setLoading(signupSubmitBtn, true);

        auth.createUserWithEmailAndPassword(email, password)
            .then(function () {
                announce('Account created successfully! Welcome to SparkDeck.');
            })
            .catch(function (error) {
                showError(getFriendlyError(error.code));
            })
            .finally(function () {
                setLoading(signupSubmitBtn, false);
            });
    });

    // ---- Sign In ----

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        clearError();

        var email = loginEmail.value.trim();
        var password = loginPassword.value;

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        setLoading(loginSubmitBtn, true);

        auth.signInWithEmailAndPassword(email, password)
            .then(function () {
                announce('Signed in successfully! Welcome back.');
            })
            .catch(function (error) {
                showError(getFriendlyError(error.code));
            })
            .finally(function () {
                setLoading(loginSubmitBtn, false);
            });
    });

    // ---- Sign Out ----

    signOutBtn.addEventListener('click', function () {
        auth.signOut()
            .then(function () {
                announce('Signed out successfully.');
            })
            .catch(function (error) {
                console.warn('Sign out error:', error);
            });
    });

    // ---- Auth State Observer ----
    // This is the core of the auth flow.
    // Firebase calls this callback whenever the user's auth state changes
    // (sign in, sign out, page load with existing session).

    auth.onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in - show the app, hide auth screen
            authScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');

            // Show the user's email in the header
            if (userEmailDisplay) {
                userEmailDisplay.textContent = user.email;
            }

            // Initialize SparkDeckApp if it hasn't been created yet
            if (!window.app) {
                window.app = new SparkDeckApp();
            }

            // Move focus to the main app heading
            var heading = appContainer.querySelector('h1');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        } else {
            // User is signed out - show auth screen, hide app
            authScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');

            // Clear the user email display
            if (userEmailDisplay) {
                userEmailDisplay.textContent = '';
            }

            // Move focus to the auth screen heading
            var authHeading = authScreen.querySelector('h1');
            if (authHeading) {
                authHeading.setAttribute('tabindex', '-1');
                authHeading.focus();
            }

            // Reset forms
            loginForm.reset();
            signupForm.reset();
            clearError();

            // Show login form by default
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        }
    });
})();
