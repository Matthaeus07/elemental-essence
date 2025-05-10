document.addEventListener('DOMContentLoaded', function() {
    // Constants - keeping this as a fallback value
    const LOW_STOCK_THRESHOLD = 5;
    const API_BASE_URL = '/elemental-essence/api/index.php';
    
    // -- DOM-Elemente --
    // Login and Panel
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    const passwordError = document.getElementById('passwordError');
    const currentUsername = document.getElementById('currentUsername');
    const currentUserRole = document.getElementById('currentUserRole');
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const adminSections = document.querySelectorAll('.admin-section');
    
    // Dashboard Elements
    const totalProductsElement = document.getElementById('totalProducts');
    const totalStockElement = document.getElementById('totalStock');
    const lowStockElement = document.getElementById('lowStock');
    const outOfStockElement = document.getElementById('outOfStock');
    const lowStockTable = document.getElementById('lowStockTable').querySelector('tbody');
    
    // Products Elements
    const productList = document.querySelector('.product-list');
    
    // Accounts Elements
    const accountSearch = document.getElementById('accountSearch');
    const createAccountBtn = document.getElementById('createAccountBtn');
    const adminAccountActions = document.getElementById('adminAccountActions');
    
    // Modals
    const editProductModal = document.getElementById('editProductModal');
    const editProductForm = document.getElementById('editProductForm');
    const editProductId = document.getElementById('editProductId');
    const editProductName = document.getElementById('editProductName');
    const editCategory = document.getElementById('editCategory');
    const editPrice = document.getElementById('editPrice');
    const editNewStock = document.getElementById('editNewStock');
    const editNewThreshold = document.getElementById('editNewThreshold');
    
    // Account Modal
    const accountModal = document.getElementById('accountModal');
    const accountForm = document.getElementById('accountForm');
    const accountId = document.getElementById('accountId');
    const accountUsername = document.getElementById('accountUsername');
    const accountPassword = document.getElementById('accountPassword');
    const accountRole = document.getElementById('accountRole');
    const passwordFormGroup = document.getElementById('passwordFormGroup');
    const accountModalTitle = document.getElementById('accountModalTitle');
    
    // Delete Confirmation Modal
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteUsername = document.getElementById('deleteUsername');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let userToDelete = null;
    
    // Database export
    const exportDbBtn = document.getElementById('exportDbBtn');
    
    // Password Update
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');
    const passwordErrorMsg = document.getElementById('passwordError');
    const passwordSuccess = document.getElementById('passwordSuccess');
    
    // Application State
    let currentUserData = {
        id: null,
        username: null,
        role: null
    };
    
    // -- API Functions --
    
    // Generic fetch function with error handling
    async function fetchAPI(endpoint, method = 'GET', data = null, params = {}) {
        // Build URL with query parameters
        const url = new URL(API_BASE_URL, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        
        // Add additional query parameters if provided
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies for session handling
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'API request failed');
            }
            
            return result.data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // Don't show notifications for these specific messages
            const skipNotificationMessages = [
                'User is not logged in',
                'Invalid credentials'
            ];
            
            // Only show notification if it's not one of the skipped messages
            if (!skipNotificationMessages.includes(error.message)) {
                showNotification(error.message || 'Ein Fehler ist aufgetreten', 'error');
            }
            
            throw error;
        }
    }
    
    // Get all products
    async function getProducts() {
        return fetchAPI('products');
    }
    
    // Get a specific product
    async function getProduct(id) {
        return fetchAPI('products', 'GET', null, { id });
    }
    
    // Get dashboard data
    async function getDashboardData() {
        return fetchAPI('inventory', 'GET', null, { dashboard: 1 });
    }
    
    // Update product details (all fields)
    async function updateProduct(productId, data) {
        return fetchAPI('products', 'PUT', data, { id: productId });
    }
    
    // Login user
    async function loginUser(username, password) {
        return fetchAPI('auth', 'POST', { username, password });
    }
    
    // Logout user
    async function logoutUser() {
        return fetchAPI('auth', 'DELETE');
    }
    
    // Check if user is logged in
    async function checkAuthStatus() {
        try {
            return await fetchAPI('auth');
        } catch (error) {
            return null;
        }
    }
    
    // Update password
    async function updatePassword(password) {
        return fetchAPI('password', 'POST', { password });
    }
    
    // Get all users
    async function getUsers() {
        return fetchAPI('users');
    }
    
    // Get a specific user
    async function getUser(id) {
        return fetchAPI('users', 'GET', null, { id });
    }
    
    // Create a new user
    async function createUser(userData) {
        return fetchAPI('users', 'POST', userData);
    }
    
    // Update a user
    async function updateUser(userId, userData) {
        return fetchAPI('users', 'PUT', userData, { id: userId });
    }
    
    // Delete a user
    async function deleteUser(userId) {
        return fetchAPI('users', 'DELETE', null, { id: userId });
    }
    
    // -- Event Listeners --
    
    // Login Form
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            // Call API to login
            const userData = await loginUser(username, password);
            
            // Store current user data
            currentUserData = {
                id: userData.id,
                username: userData.username,
                role: userData.role
            };
            
            // Update UI with current user info
            currentUsername.textContent = userData.username;
            currentUserRole.textContent = `(${userData.role})`;
            
            loginOverlay.style.display = 'none';
            adminPanel.style.display = 'flex';
            passwordError.style.display = 'none';
            
            // Show/hide admin-only elements
            toggleAdminElements();
            
            loadDashboardData();
        } catch (error) {
            passwordError.style.display = 'block';
            document.getElementById('password').value = '';
        }
    });
    
    // Logout Button
    logoutBtn.addEventListener('click', async function() {
        try {
            await logoutUser();
            adminPanel.style.display = 'none';
            loginOverlay.style.display = 'flex';
            document.getElementById('password').value = '';
            
            // Reset current user data
            currentUserData = {
                id: null,
                username: null,
                role: null
            };
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Set active navigation item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            adminSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                    
                    // Load section-specific data
                    if (sectionId === 'dashboard') {
                        loadDashboardData();
                    } else if (sectionId === 'products') {
                        loadProductsData();
                    } else if (sectionId === 'accounts') {
                        loadUsersData();
                    }
                }
            });
        });
    });
    
    // Close Modal
    document.querySelectorAll('.close-modal, .close-btn').forEach(element => {
        element.addEventListener('click', function() {
            editProductModal.style.display = 'none';
            accountModal.style.display = 'none';
            deleteConfirmModal.style.display = 'none';
        });
    });
    
    // Close Modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === editProductModal) {
            editProductModal.style.display = 'none';
        }
        if (e.target === accountModal) {
            accountModal.style.display = 'none';
        }
        if (e.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
        }
    });
    
    // Edit Product Form
    editProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productId = parseInt(editProductId.value);
        const category = editCategory.value;
        const price = parseFloat(editPrice.value);
        const newStock = parseInt(editNewStock.value);
        const newThreshold = parseInt(editNewThreshold.value);
        
        try {
            // Update product data via API
            const updatedProduct = await updateProduct(
                productId, 
                {
                    category: category,
                    price: price,
                    stock_quantity: newStock,
                    low_stock_threshold: newThreshold
                }
            );
            
            // Update UI
            loadDashboardData();
            loadProductsData();
            
            // Close modal
            editProductModal.style.display = 'none';
            
            // Show success notification
            showNotification(`${updatedProduct.name} wurde erfolgreich aktualisiert.`, 'success');
        } catch (error) {
            showNotification('Fehler beim Aktualisieren der Produktdaten', 'error');
        }
    });
    
    // Account Form
    accountForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isNewAccount = !accountId.value;
        const userData = {
            username: accountUsername.value,
            role: accountRole.value
        };
        
        // Only include password if it's provided (for edits) or required (for new accounts)
        if (accountPassword.value || isNewAccount) {
            userData.password = accountPassword.value;
        }
        
        try {
            let result;
            
            if (isNewAccount) {
                // Create new user
                result = await createUser(userData);
                showNotification(`Benutzer ${result.username} wurde erfolgreich erstellt.`, 'success');
            } else {
                // Update existing user
                result = await updateUser(accountId.value, userData);
                showNotification(`Benutzer ${result.username} wurde erfolgreich aktualisiert.`, 'success');
            }
            
            // Reload users data
            loadUsersData();
            
            // Close modal
            accountModal.style.display = 'none';
        } catch (error) {
            showNotification(error.message || 'Fehler beim Speichern der Benutzerdaten', 'error');
        }
    });
    
    // Create Account Button
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', function() {
            openAccountModal();
        });
    }
    
    // Account Search
    if (accountSearch) {
        accountSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const cards = document.querySelectorAll('.account-card');
            
            cards.forEach(card => {
                const username = card.querySelector('h3').textContent.toLowerCase();
                const role = card.querySelector('.account-role').textContent.toLowerCase();
                
                if (username.includes(searchTerm) || role.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(userId, username) {
        userToDelete = { id: userId, username: username };
        deleteUsername.textContent = username;
        deleteConfirmModal.style.display = 'flex';
    }
    
    // Delete confirmation button click
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            if (userToDelete) {
                try {
                    await deleteUser(userToDelete.id);
                    showNotification(`Benutzer "${userToDelete.username}" wurde erfolgreich gelöscht.`, 'success');
                    deleteConfirmModal.style.display = 'none';
                    loadUsersData();
                } catch (error) {
                    showNotification(error.message || 'Fehler beim Löschen des Benutzers', 'error');
                }
            }
        });
    }
    
    // Database export button
    if (exportDbBtn) {
        exportDbBtn.addEventListener('click', async function() {
            try {
                // Show a loading indicator or notification
                showNotification('Datenbank wird exportiert...', 'info');
                
                // Create the request URL
                const url = new URL(API_BASE_URL, window.location.origin);
                url.searchParams.append('endpoint', 'export_db');
                
                // Make the request
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include' // Include cookies for session handling
                });
                
                if (!response.ok) {
                    throw new Error('Fehler beim Exportieren der Datenbank');
                }
                
                // Get the database blob
                const blob = await response.blob();
                
                // Create a download link and trigger the download
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `elemental_essence_db_${new Date().toISOString().slice(0, 10)}.db`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification('Datenbank wurde erfolgreich heruntergeladen', 'success');
            } catch (error) {
                console.error('Database export error:', error);
                showNotification('Fehler beim Exportieren der Datenbank', 'error');
            }
        });
    }
    
    // Password update functionality
    if (updatePasswordBtn) {
        // Password update button click
        updatePasswordBtn.addEventListener('click', async function() {
            // Validate the passwords
            if (newPassword.value !== confirmPassword.value) {
                passwordErrorMsg.textContent = 'Die Passwörter stimmen nicht überein';
                passwordErrorMsg.style.display = 'block';
                return;
            }
            
            // Hide error message
            passwordErrorMsg.style.display = 'none';
            
            try {
                // Call API to update password
                await updatePassword(newPassword.value);
                
                // Clear form fields
                newPassword.value = '';
                confirmPassword.value = '';
                
                // Show success message
                showNotification('Passwort wurde erfolgreich aktualisiert', 'success');
            } catch (error) {
                console.error('Password update error:', error);
                passwordErrorMsg.textContent = error.message || 'Fehler beim Aktualisieren des Passworts';
                passwordErrorMsg.style.display = 'block';
            }
        });
        
        // Live validation as the user types
        const validatePasswords = function() {
            if (newPassword.value.length > 0 && confirmPassword.value.length > 0) {
                if (newPassword.value !== confirmPassword.value) {
                    passwordErrorMsg.textContent = 'Die Passwörter stimmen nicht überein';
                    passwordErrorMsg.style.display = 'block';
                } else {
                    passwordErrorMsg.style.display = 'none';
                }
            } else {
                passwordErrorMsg.style.display = 'none';
            }
        };
        
        newPassword.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }
    
    // -- Functions --
    
    // Toggle admin-only elements based on user role
    function toggleAdminElements() {
        const isAdmin = currentUserData.role === 'admin';
        
        // Show/hide create account button
        if (adminAccountActions) {
            adminAccountActions.style.display = isAdmin ? 'block' : 'none';
        }
        
        // Show/hide action buttons based on role
        const actionElements = document.querySelectorAll('.edit-user, .delete-user');
        if (!isAdmin) {
            // Hide all action buttons for non-admin users
            actionElements.forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // For admin users, show action buttons but manage button visibility
            actionElements.forEach(el => {
                el.style.display = '';
                
                // Get the user ID for this element
                const card = el.closest('.account-card');
                if (card) {
                    const userId = card.getAttribute('data-user-id');
                    
                    // Only show delete button if not the current user
                    if (el.classList.contains('delete-user') && userId == currentUserData.id) {
                        el.style.display = 'none';
                    }
                }
            });
        }
    }
    
    // Load Dashboard Data
    async function loadDashboardData() {
        try {
            const dashboardData = await getDashboardData();
            
            // Update dashboard statistics
            totalProductsElement.textContent = dashboardData.totalProducts;
            totalStockElement.textContent = dashboardData.totalStock;
            lowStockElement.textContent = dashboardData.lowStock;
            outOfStockElement.textContent = dashboardData.outOfStock;
            
            // Clear and populate low stock table
            lowStockTable.innerHTML = '';
            
            if (dashboardData.lowStock === 0 && dashboardData.outOfStock === 0) {
                lowStockTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">Alle Produkte haben ausreichend Bestand.</td>
                    </tr>
                `;
            } else {
                // Show out of stock products first, then low stock products
                const productsToShow = [...dashboardData.outOfStockItems, ...dashboardData.lowStockItems];
                
                productsToShow.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.name}</td>
                        <td>${product.sku}</td>
                        <td>${getCategoryName(product.category)}</td>
                        <td>
                            <span class="stock-status ${product.stock_quantity === 0 ? 'out-of-stock' : 'low-stock'}">
                                ${product.stock_quantity === 0 ? 'Ausverkauft' : `${product.stock_quantity} Stück`}
                            </span>
                        </td>
                    `;
                    lowStockTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    // Load Products Data
    async function loadProductsData() {
        try {
            const products = await getProducts();
            
            productList.innerHTML = '';
            
            // Group products by category
            const productsByCategory = {};
            
            products.forEach(product => {
                if (!productsByCategory[product.category]) {
                    productsByCategory[product.category] = [];
                }
                productsByCategory[product.category].push(product);
            });
            
            // Create product cards
            Object.keys(productsByCategory).sort().forEach(category => {
                const products = productsByCategory[category];
                
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    
                    // Set color class based on product name (for individual fragrances)
                    let colorClass = '';
                    if (product.category === 'individual') {
                        const lowerName = product.name.toLowerCase();
                        if (lowerName === 'ignis') colorClass = 'ignis';
                        else if (lowerName === 'aqua') colorClass = 'aqua';
                        else if (lowerName === 'aura') colorClass = 'aura';
                        else if (lowerName === 'terra') colorClass = 'terra';
                        else if (lowerName === 'aether') colorClass = 'aether';
                    }
                    
                    // Product card content
                    productCard.innerHTML = `
                        <div class="product-header">
                            <h3>${product.name}</h3>
                            <span class="product-sku">${product.sku}</span>
                        </div>
                        <div class="product-body">
                            <div class="product-info">
                                <div class="product-info-item">
                                    <span class="product-info-label">Kategorie:</span>
                                    <span>${getCategoryName(product.category)}</span>
                                </div>
                                <div class="product-info-item">
                                    <span class="product-info-label">Preis:</span>
                                    <span>${parseFloat(product.price).toFixed(2)} €</span>
                                </div>
                                <div class="product-info-item">
                                    <span class="product-info-label">Bestand:</span>
                                    <span>${product.stock_quantity} Stück</span>
                                </div>
                                <div class="product-info-item">
                                    <span class="product-info-label">Schwellenwert:</span>
                                    <span>${product.low_stock_threshold} Stück</span>
                                </div>
                                <div class="product-info-item">
                                    <span class="product-info-label">Status:</span>
                                    <span class="stock-status ${
                                        product.stock_quantity === 0 ? 'out-of-stock' : 
                                        product.stock_quantity <= product.low_stock_threshold ? 'low-stock' : 'in-stock'
                                    }">
                                        ${
                                            product.stock_quantity === 0 ? 'Ausverkauft' : 
                                            product.stock_quantity <= product.low_stock_threshold ? 'Niedriger Bestand' : 'Auf Lager'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="product-footer">
                            <button class="btn btn-secondary edit-product" data-id="${product.id}">
                                <i class="fas fa-edit"></i> Bearbeiten
                            </button>
                        </div>
                    `;
                    
                    productList.appendChild(productCard);
                });
            });
            
            // Add event listeners to product actions
            addProductEventListeners();
        } catch (error) {
            console.error('Error loading products data:', error);
        }
    }
    
    // Load Users Data
    async function loadUsersData() {
        try {
            const users = await getUsers();
            const isAdmin = currentUserData.role === 'admin';
            
            // Get the account list container
            const accountList = document.querySelector('.account-list');
            
            // Clear the account list
            accountList.innerHTML = '';
            
            if (users.length === 0) {
                accountList.innerHTML = `
                    <div class="no-accounts-message">
                        <p>Keine Benutzer gefunden.</p>
                    </div>
                `;
            } else {
                users.forEach(user => {
                    // Format dates nicely
                    const createdDate = user.created_at ? new Date(user.created_at).toLocaleString('de-DE') : '-';
                    const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleString('de-DE') : '-';
                    
                    // Create account card
                    const accountCard = document.createElement('div');
                    accountCard.className = 'account-card';
                    accountCard.setAttribute('data-user-id', user.id);
                    
                    // Highlight current user
                    if (user.id == currentUserData.id) {
                        accountCard.classList.add('current-user');
                    }
                    
                    accountCard.innerHTML = `
                        <div class="account-header">
                            <h3>${user.username}</h3>
                            <span class="account-role">${user.role === 'admin' ? 'Administrator' : 'Benutzer'}</span>
                        </div>
                        <div class="account-body">
                            <div class="account-info">
                                <div class="account-info-item">
                                    <span class="account-info-label">Erstellt:</span>
                                    <span>${createdDate}</span>
                                </div>
                                <div class="account-info-item">
                                    <span class="account-info-label">Letzter Login:</span>
                                    <span>${lastLoginDate}</span>
                                </div>
                            </div>
                        </div>
                        <div class="account-footer">
                            ${isAdmin ? `
                                <button class="btn btn-secondary edit-user" data-id="${user.id}">
                                    <i class="fas fa-edit"></i> Bearbeiten
                                </button>
                                ${user.id != currentUserData.id ? `
                                    <button class="btn btn-danger delete-user" data-id="${user.id}">
                                        <i class="fas fa-trash-alt"></i> Löschen
                                    </button>
                                ` : ''}
                            ` : ''}
                        </div>
                    `;
                    
                    accountList.appendChild(accountCard);
                });
                
                // Add event listeners to user actions
                addUserEventListeners();
                
                // Toggle admin elements
                toggleAdminElements();
            }
        } catch (error) {
            console.error('Error loading users data:', error);
        }
    }
    
    // Add event listeners to user actions
    function addUserEventListeners() {
        // Edit user buttons
        document.querySelectorAll('.edit-user').forEach(button => {
            button.addEventListener('click', function() {
                openAccountModal(parseInt(this.getAttribute('data-id')));
            });
        });
        
        // Delete user buttons
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-id'));
                const username = this.closest('.account-card').querySelector('h3').textContent;
                showDeleteConfirmation(userId, username);
            });
        });
    }
    
    // Add event listeners to product actions
    function addProductEventListeners() {
        productList.querySelectorAll('.edit-product').forEach(button => {
            button.addEventListener('click', function() {
                openEditProductModal(parseInt(this.getAttribute('data-id')));
            });
        });
    }
    
    // Open Edit Product Modal
    async function openEditProductModal(productId) {
        try {
            // Get product details
            const product = await getProduct(productId);
            
            if (product) {
                // Populate form with current product data
                editProductId.value = product.id;
                editProductName.value = product.name;
                editCategory.value = product.category;
                editPrice.value = parseFloat(product.price).toFixed(2);
                editNewStock.value = product.stock_quantity;
                editNewThreshold.value = product.low_stock_threshold;
                
                editProductModal.style.display = 'flex';
                editPrice.focus();
            }
        } catch (error) {
            console.error('Error opening edit modal:', error);
        }
    }
    
    // Open Account Modal
    async function openAccountModal(userId = null) {
        try {
            // Reset form
            accountForm.reset();
            accountId.value = '';
            accountRole.disabled = false;
            
            if (userId) {
                // Edit existing user
                accountModalTitle.textContent = 'Konto bearbeiten';
                
                // Get user details
                const user = await getUser(userId);
                
                if (user) {
                    // Populate form with current user data
                    accountId.value = user.id;
                    accountUsername.value = user.username;
                    accountRole.value = user.role;
                    
                    // Hide password field when editing (only user can change their own password in settings)
                    passwordFormGroup.style.display = 'none';
                    accountPassword.required = false;
                    
                    // If editing own account, disable role selection
                    if (user.id == currentUserData.id) {
                        accountRole.disabled = true;
                    }
                }
            } else {
                // Create new user
                accountModalTitle.textContent = 'Neues Konto erstellen';
                
                // Show password field and make it required for new accounts
                passwordFormGroup.style.display = 'block';
                accountPassword.required = true;
            }
            
            // Show the modal
            accountModal.style.display = 'flex';
            accountUsername.focus();
        } catch (error) {
            console.error('Error opening account modal:', error);
        }
    }
    
    // Format Category Name
    function getCategoryName(categoryKey) {
        const categories = {
            'individual': 'Einzelduft',
            'collection': 'Kollektion',
            'discovery': 'Discovery Set'
        };
        
        return categories[categoryKey] || categoryKey;
    }
    
    // Show Notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Hide notification after a short time
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Initialize application
    async function init() {
        try {
            // Check if user is already logged in
            const authStatus = await checkAuthStatus();
            
            if (authStatus) {
                // Store current user data
                currentUserData = {
                    id: authStatus.id,
                    username: authStatus.username,
                    role: authStatus.role
                };
                
                // Update UI with current user info
                currentUsername.textContent = authStatus.username;
                currentUserRole.textContent = `(${authStatus.role})`;
                
                // User is logged in
                loginOverlay.style.display = 'none';
                adminPanel.style.display = 'flex';
                
                // Show/hide admin-only elements
                toggleAdminElements();
                
                loadDashboardData();
            } else {
                // User is not logged in
                loginOverlay.style.display = 'flex';
                adminPanel.style.display = 'none';
            }
        } catch (error) {
            console.error('Initialization error:', error);
            loginOverlay.style.display = 'flex';
            adminPanel.style.display = 'none';
        }
    }
    
    // Start the application
    init();
});