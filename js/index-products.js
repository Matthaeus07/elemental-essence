// Product Tabs Functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Function to activate a specific tab
    function activateTab(tabId) {
        // Remove active class from all buttons
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Remove active class from all tab contents
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate the selected tab button
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Activate the selected tab content
        document.getElementById(tabId).classList.add('active');
    }
    
    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            activateTab(tabId);
        });
    });
    
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get product SKU
            const sku = this.getAttribute('data-sku');
            if (!sku) return;
            
            // Get product info for notification
            let productName;
            
            if (this.closest('.element-product')) {
                productName = this.closest('.element-product').querySelector('h4').textContent;
            } else if (this.closest('.product-info')) {
                productName = this.closest('.product-info').querySelector('.product-title').textContent;
            }
            
            // Add to cart (localStorage)
            addToCart(sku, 1);
            
            // Show a confirmation message
            showCartConfirmation(productName);
        });
    });
    
    // Function to add product to cart
    function addToCart(sku, quantity) {
        let cart = [];
        const savedCart = localStorage.getItem('elementalEssenceCart');
        
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.sku === sku);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                sku: sku,
                quantity: quantity
            });
        }
        
        // Save updated cart
        localStorage.setItem('elementalEssenceCart', JSON.stringify(cart));
    }
    
    // Function to show cart confirmation
    function showCartConfirmation(productName) {
        const confirmationMessage = document.createElement('div');
        confirmationMessage.className = 'cart-confirmation';
        confirmationMessage.innerHTML = `
            <div class="cart-confirmation-content">
                <i class="fas fa-check-circle"></i>
                <p>${productName} wurde zum Warenkorb hinzugefügt</p>
            </div>
        `;
        
        document.body.appendChild(confirmationMessage);
        
        // Remove the confirmation after 3 seconds
        setTimeout(() => {
            confirmationMessage.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(confirmationMessage);
            }, 500);
        }, 3000);
    }
});