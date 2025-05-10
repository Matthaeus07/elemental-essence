// Cart Functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cartItemsTable = document.getElementById('cartItemsTable');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartContent = document.getElementById('cartContent');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    const cartDiscount = document.getElementById('cartDiscount');
    const discountRow = document.getElementById('discountRow');
    const clearCartBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const applyCouponBtn = document.getElementById('applyCoupon');
    const couponCodeInput = document.getElementById('couponCode');
    
    // Valid coupon codes
    const validCoupons = {
        'ELEMENTS10': 10, // 10% discount
        'WELCOME20': 20,  // 20% discount
        'ESSENZ15': 15    // 15% discount
    };
    
    // Sample product data (normally this would come from a database)
    const productData = {
        'IGNIS-30': {
            name: 'Ignis',
            price: 129,
            image: 'assets/ignis.png',
            element: 'Das Element des Feuers'
        },
        'AQUA-30': {
            name: 'Aqua',
            price: 129,
            image: 'assets/aqua.png',
            element: 'Das Element des Wassers'
        },
        'AURA-30': {
            name: 'Aura',
            price: 129,
            image: 'assets/aura.png',
            element: 'Das Element der Luft'
        },
        'TERRA-30': {
            name: 'Terra',
            price: 129,
            image: 'assets/terra.png',
            element: 'Das Element der Erde'
        },
        'AETHER-30': {
            name: 'Aether',
            price: 129,
            image: 'assets/aether.png',
            element: 'Das fünfte Element'
        },
        'COLL-SET': {
            name: 'Elemental Essence Kollektion',
            price: 475,
            image: 'assets/collection.png',
            element: 'Alle fünf Elemente'
        },
        'DISC-SET': {
            name: 'Discovery Set',
            price: 59,
            image: 'assets/discovery_set.png',
            element: 'Entdecken Sie Ihr Element'
        }
    };
    
    // Cart state
    let cart = [];
    let appliedCoupon = null;
    let discountPercentage = 0;
    
    // Load cart from localStorage
    function loadCart() {
        const savedCart = localStorage.getItem('elementalEssenceCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        
        const savedCoupon = localStorage.getItem('elementalEssenceCoupon');
        if (savedCoupon) {
            appliedCoupon = savedCoupon;
            discountPercentage = validCoupons[appliedCoupon] || 0;
        }
        
        updateCartDisplay();
    }
    
    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('elementalEssenceCart', JSON.stringify(cart));
        if (appliedCoupon) {
            localStorage.setItem('elementalEssenceCoupon', appliedCoupon);
        } else {
            localStorage.removeItem('elementalEssenceCoupon');
        }
    }
    
    // Add a product to the cart (normally called from product pages)
    function addToCart(sku, quantity = 1) {
        const existingItem = cart.find(item => item.sku === sku);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                sku: sku,
                quantity: quantity
            });
        }
        
        saveCart();
        updateCartDisplay();
    }
    
    // Update cart quantity
    function updateQuantity(index, quantity) {
        if (quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
        }
        
        saveCart();
        updateCartDisplay();
    }
    
    // Remove item from cart
    function removeItem(index) {
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
    }
    
    // Clear the entire cart
    function clearCart() {
        cart = [];
        appliedCoupon = null;
        discountPercentage = 0;
        localStorage.removeItem('elementalEssenceCart');
        localStorage.removeItem('elementalEssenceCoupon');
        updateCartDisplay();
    }
    
    // Calculate totals
    function calculateTotals() {
        let subtotal = 0;
        cart.forEach(item => {
            const product = productData[item.sku];
            if (product) {
                subtotal += product.price * item.quantity;
            }
        });
        
        const discount = subtotal * (discountPercentage / 100);
        const total = subtotal - discount;
        
        return {
            subtotal,
            discount,
            total
        };
    }
    
    // Format price for display
    function formatPrice(price) {
        return price.toFixed(2).replace('.', ',') + ' €';
    }
    
    // Update the cart display
    function updateCartDisplay() {
        // Check if cart is empty
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'flex';
            cartContent.style.display = 'none';
            return;
        }
        
        // Cart is not empty, update the display
        emptyCartMessage.style.display = 'none';
        cartContent.style.display = 'block';
        
        // Clear the table
        cartItemsTable.innerHTML = '';
        
        // Add each item to the table
        cart.forEach((item, index) => {
            const product = productData[item.sku];
            if (!product) return;
            
            const subtotal = product.price * item.quantity;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="product-col">
                    <div class="cart-product">
                        <div class="cart-product-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="cart-product-details">
                            <h4>${product.name}</h4>
                            <div class="variant">${product.element}</div>
                        </div>
                    </div>
                </td>
                <td class="price-col">
                    <div class="cart-price">${formatPrice(product.price)}</div>
                </td>
                <td class="quantity-col">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-index="${index}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" data-index="${index}">
                        <button class="quantity-btn increase" data-index="${index}">+</button>
                    </div>
                </td>
                <td class="subtotal-col">
                    <div class="cart-subtotal">${formatPrice(subtotal)}</div>
                </td>
                <td class="remove-col">
                    <button class="remove-item" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            
            cartItemsTable.appendChild(row);
        });
        
        // Update totals
        const totals = calculateTotals();
        cartSubtotal.textContent = formatPrice(totals.subtotal);
        cartTotal.textContent = formatPrice(totals.total);
        
        // Update discount display
        if (discountPercentage > 0) {
            cartDiscount.textContent = '- ' + formatPrice(totals.discount);
            discountRow.style.display = 'flex';
            couponCodeInput.value = appliedCoupon;
            couponCodeInput.disabled = true;
            applyCouponBtn.textContent = 'Entfernen';
        } else {
            discountRow.style.display = 'none';
            couponCodeInput.disabled = false;
            applyCouponBtn.textContent = 'Einlösen';
        }
        
        // Add event listeners
        addCartEventListeners();
    }
    
    // Add event listeners to cart elements
    function addCartEventListeners() {
        // Quantity decrease buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const currentQuantity = cart[index].quantity;
                updateQuantity(index, currentQuantity - 1);
            });
        });
        
        // Quantity increase buttons
        document.querySelectorAll('.quantity-btn.increase').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const currentQuantity = cart[index].quantity;
                if (currentQuantity < 10) {
                    updateQuantity(index, currentQuantity + 1);
                }
            });
        });
        
        // Quantity input fields
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const newQuantity = parseInt(this.value);
                if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= 10) {
                    updateQuantity(index, newQuantity);
                } else if (newQuantity > 10) {
                    updateQuantity(index, 10);
                } else {
                    updateQuantity(index, 1);
                }
            });
        });
        
        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeItem(index);
            });
        });
    }
    
    // Apply coupon code
    function applyCoupon() {
        const couponCode = couponCodeInput.value.trim().toUpperCase();
        
        if (appliedCoupon) {
            // Remove existing coupon
            appliedCoupon = null;
            discountPercentage = 0;
            couponCodeInput.value = '';
            couponCodeInput.disabled = false;
            applyCouponBtn.textContent = 'Einlösen';
            saveCart();
            updateCartDisplay();
            
            // Show confirmation message
            showNotification('Gutschein wurde entfernt');
        } else if (validCoupons.hasOwnProperty(couponCode)) {
            // Apply valid coupon
            appliedCoupon = couponCode;
            discountPercentage = validCoupons[couponCode];
            saveCart();
            updateCartDisplay();
            
            // Show confirmation message
            showNotification(`Gutschein für ${discountPercentage}% Rabatt wurde angewendet`);
        } else {
            // Invalid coupon
            showNotification('Ungültiger Gutscheincode', 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove the notification after a delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // Checkout function (placeholder)
    function checkout() {
        if (cart.length === 0) {
            showNotification('Ihr Warenkorb ist leer', 'error');
            return;
        }
        
        // Here you would normally redirect to a checkout page or process
        alert('Weiterleitung zur Bezahlseite...');
        
        // For demo purposes, show notification and clear cart
        showNotification('Vielen Dank für Ihren Einkauf!');
        clearCart();
    }
    
    // Event Listeners
    clearCartBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            clearCart();
            showNotification('Warenkorb wurde geleert');
        }
    });
    
    checkoutBtn.addEventListener('click', checkout);
    
    applyCouponBtn.addEventListener('click', applyCoupon);
    
    couponCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyCoupon();
        }
    });
    
    // Add test items to cart (for development only)
    function addTestItems() {
        // Only add if cart is empty and URL has ?test parameter
        if (cart.length === 0 && window.location.search.includes('test')) {
            addToCart('IGNIS-30', 1);
            addToCart('AQUA-30', 2);
            addToCart('COLL-SET', 1);
        }
    }
    
    // Initialize cart
    loadCart();
    addTestItems();  // Add test items if needed
    
    // Also initialize from URL if product and quantity parameters are present
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('product');
    const quantity = parseInt(urlParams.get('qty') || '1');
    
    if (sku && productData[sku] && !isNaN(quantity) && quantity > 0) {
        addToCart(sku, quantity);
        showNotification(`${productData[sku].name} wurde zum Warenkorb hinzugefügt`);
    }
});

// Add notification styles dynamically
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .cart-notification {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out forwards;
        }
        
        .notification-content {
            background-color: var(--light-bg);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            padding: 15px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            min-width: 300px;
        }
        
        .dark-theme .notification-content {
            background-color: var(--dark-bg-2);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            color: var(--light-text);
        }
        
        .cart-notification.success .notification-content {
            border-left: 4px solid #27ae60;
        }
        
        .cart-notification.error .notification-content {
            border-left: 4px solid #e74c3c;
        }
        
        .notification-content i {
            margin-right: 15px;
            font-size: 20px;
        }
        
        .cart-notification.success .notification-content i {
            color: #27ae60;
        }
        
        .cart-notification.error .notification-content i {
            color: #e74c3c;
        }
        
        .notification-content p {
            margin: 0;
            font-size: 14px;
        }
        
        .cart-notification.fade-out {
            animation: fadeOut 0.5s ease-out forwards;
        }
        
        @media screen and (max-width: 600px) {
            .cart-notification {
                right: 20px;
                left: 20px;
            }
            
            .notification-content {
                min-width: 100px;
            }
        }
    `;
    
    document.head.appendChild(style);
});