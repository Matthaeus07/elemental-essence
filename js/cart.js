document.addEventListener('DOMContentLoaded', () => {
    // Global Variables
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmountElement = document.getElementById('cart-total-amount');
    const checkoutButton = document.getElementById('checkout-button');
    
    let allProductsData = [];
    let cart = [];

    // --- Initialization ---
    async function initCartPage() {
        loadCartFromLocalStorage();
        await fetchAllProductData(); // Wait for product data before rendering
        renderCart(); // This will also call addEventListenersToCartItems
        updateCartTotalAndCheckoutButton();
    }

    // --- LocalStorage Management ---
    function loadCartFromLocalStorage() {
        const storedCart = localStorage.getItem('elementalEssenceCart');
        if (storedCart) {
            try {
                cart = JSON.parse(storedCart);
            } catch (error) {
                console.error("Error parsing cart from localStorage:", error);
                cart = []; // Reset to empty cart on error
            }
        } else {
            cart = [];
        }
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('elementalEssenceCart', JSON.stringify(cart));
    }

    // --- Product Data ---
    async function fetchAllProductData() {
        try {
            const response = await fetch('../api/index.php?endpoint=products'); // Path relative to cart.html in root
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                allProductsData = result.data;
            } else {
                console.error("Failed to fetch product data or data format incorrect:", result.message);
                allProductsData = []; // Ensure it's an array even on failure
            }
        } catch (error) {
            console.error("Error fetching all product data:", error);
            allProductsData = []; // Ensure it's an array on network error
            // Optionally, display an error message to the user in the cart
            if (cartItemsContainer) { // Check if container exists
                 cartItemsContainer.innerHTML = '<p class="error-message">Fehler beim Laden der Produktdaten. Bitte versuchen Sie es später erneut.</p>';
            }
        }
    }

    function getProductDetails(sku) {
        if (!allProductsData || allProductsData.length === 0) {
            // console.warn("getProductDetails called before allProductsData was populated or is empty.");
            return null; 
        }
        // Assuming SKUs in allProductsData and cart are consistently cased (e.g., uppercase)
        return allProductsData.find(product => product.sku === sku);
    }

    // --- Cart Rendering ---
    function renderCart() {
        if (!cartItemsContainer) {
            console.error("Cart items container not found in DOM.");
            return;
        }
        cartItemsContainer.innerHTML = ''; // Clear existing content

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Ihr Warenkorb ist leer. <a href="index.html#product">Entdecken Sie unsere Produkte!</a></p>';
            updateCartTotalAndCheckoutButton(); // Update total and button state
            return;
        }

        cart.forEach(item => {
            const productDetails = getProductDetails(item.sku);

            if (!productDetails) {
                console.error(`Product details not found for SKU: ${item.sku}. Item will not be rendered.`);
                // Optionally render a placeholder or error for this item
                const errorItemDiv = document.createElement('div');
                errorItemDiv.className = 'cart-item cart-item-error';
                errorItemDiv.innerHTML = `<p>Produkt mit SKU ${item.sku} nicht gefunden. Es wurde möglicherweise entfernt.</p> 
                                          <button class="remove-item-btn" data-sku="${item.sku}"><i class="fas fa-trash"></i> Entfernen</button>`;
                cartItemsContainer.appendChild(errorItemDiv);
                return; // Skip rendering this item if details are missing
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            // Add out-of-stock or low-stock class if needed
            if (productDetails.stock_quantity <= 0 || item.quantity > productDetails.stock_quantity) {
                itemDiv.classList.add('item-out-of-stock');
            }


            // productDetails.image_url is assumed to be like "assets/ignis.png"
            // cart.html is in root, so the path should be correct as is.
            itemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${productDetails.image_url}" alt="${productDetails.name}" class="cart-item-image-tag">
                </div>
                <div class="cart-item-details">
                    <h4>${productDetails.name}</h4>
                    <p class="price-per-unit">${productDetails.price.toFixed(2)}€ pro Stück</p>
                    ${productDetails.stock_quantity <= 0 ? '<p class="stock-error">Nicht auf Lager</p>' : 
                    (item.quantity > productDetails.stock_quantity ? `<p class="stock-warning">Nur ${productDetails.stock_quantity} auf Lager</p>` : '')}
                </div>
                <div class="cart-item-quantity">
                    <button class="cart-item-quantity-btn minus" data-sku="${item.sku}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" value="${item.quantity}" min="1" max="${productDetails.stock_quantity}" data-sku="${item.sku}" class="cart-item-quantity-input" readonly>
                    <button class="cart-item-quantity-btn plus" data-sku="${item.sku}" ${item.quantity >= productDetails.stock_quantity ? 'disabled' : ''}>+</button>
                </div>
                <div class="cart-item-total-price">${(productDetails.price * item.quantity).toFixed(2)}€</div>
                <button class="remove-item-btn" data-sku="${item.sku}"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });
        addEventListenersToCartItems();
        updateCartTotalAndCheckoutButton(); // Update total and button state after rendering
    }

    // --- Event Listeners for Cart Items ---
    function addEventListenersToCartItems() {
        document.querySelectorAll('.cart-item-quantity-btn.plus').forEach(button => {
            button.addEventListener('click', (e) => handleQuantityChange(e.target.dataset.sku, 'increase'));
        });
        document.querySelectorAll('.cart-item-quantity-btn.minus').forEach(button => {
            button.addEventListener('click', (e) => handleQuantityChange(e.target.dataset.sku, 'decrease'));
        });
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Find the closest data-sku if the click was on the icon
                const sku = e.target.closest('[data-sku]')?.dataset.sku;
                if (sku) {
                    handleRemoveItem(sku);
                }
            });
        });
    }

    // --- Cart Actions Handlers ---
    function handleQuantityChange(sku, action) {
        const itemIndex = cart.findIndex(cartItem => cartItem.sku === sku);
        if (itemIndex === -1) {
            console.error("Item not found in cart for SKU:", sku);
            return;
        }

        const productDetails = getProductDetails(sku);
        if (!productDetails) {
            console.error("Product details not found for SKU:", sku, "Cannot update quantity.");
            // Optionally remove item from cart if product no longer exists
            // handleRemoveItem(sku); 
            return;
        }

        let currentQuantity = cart[itemIndex].quantity;

        if (action === 'increase') {
            if (currentQuantity < productDetails.stock_quantity) {
                cart[itemIndex].quantity++;
            } else {
                // Optionally, provide user feedback: "Max stock reached"
                console.warn(`Cannot increase quantity for ${sku} beyond stock: ${productDetails.stock_quantity}`);
            }
        } else if (action === 'decrease') {
            cart[itemIndex].quantity--;
            if (cart[itemIndex].quantity <= 0) {
                handleRemoveItem(sku); // This will re-render and update total
                return; // Exit early as item is removed
            }
        }
        
        // Ensure quantity does not exceed stock after adjustment (e.g. if stock reduced since adding to cart)
        if (cart[itemIndex].quantity > productDetails.stock_quantity) {
             cart[itemIndex].quantity = productDetails.stock_quantity;
        }


        saveCartToLocalStorage();
        renderCart(); // Re-render the whole cart to reflect changes and button states
        updateCartTotalAndCheckoutButton(); // updateCartTotalAndCheckoutButton is called by renderCart if not empty
    }

    function handleRemoveItem(sku) {
        cart = cart.filter(item => item.sku !== sku);
        saveCartToLocalStorage();
        renderCart(); // Re-render to show item removed
        updateCartTotalAndCheckoutButton(); // updateCartTotalAndCheckoutButton is called by renderCart if not empty or specifically here
    }

    // --- Update Cart Total and Checkout Button State ---
    function updateCartTotalAndCheckoutButton() {
        if (!cartTotalAmountElement || !checkoutButton) {
            console.error("Cart total element or checkout button not found in DOM.");
            return;
        }

        let totalAmount = 0;
        let isAnyItemIssue = false; // True if any item is out of stock or details are missing

        if (cart.length === 0) {
            cartTotalAmountElement.textContent = '0.00';
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Warenkorb leer';
            return;
        }

        cart.forEach(item => {
            const productDetails = getProductDetails(item.sku);
            if (productDetails) {
                totalAmount += productDetails.price * item.quantity;
                if (item.quantity > productDetails.stock_quantity || productDetails.stock_quantity <= 0) {
                    isAnyItemIssue = true;
                }
            } else {
                isAnyItemIssue = true; // Product details not found for an item in cart
            }
        });

        cartTotalAmountElement.textContent = totalAmount.toFixed(2);

        if (isAnyItemIssue) {
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Artikel nicht verfügbar';
        } else {
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Zur Kasse';
        }
    }
    
    // --- Event Listener for Checkout Button (Example) ---
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (!checkoutButton.disabled) {
                // Proceed to checkout logic (e.g. redirect to a checkout page)
                console.log("Proceeding to checkout with cart:", cart);
                // window.location.href = '/checkout.html'; // Example redirect
                alert("Weiterleitung zur Kasse (noch nicht implementiert).");
            }
        });
    }


    // Initial call to setup the cart page
    initCartPage();
});
