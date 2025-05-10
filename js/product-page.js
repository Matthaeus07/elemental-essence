// Product Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Fetch product data from the API
    fetchProductData();
    
    // Initialize tabs
    initTabs();
    
    // Initialize quantity selector
    initQuantitySelector();
    
    // Add to cart functionality
    initAddToCart();
});

// Fetch product data from the API
async function fetchProductData() {
    try {
        const response = await fetch('../api/index.php?endpoint=products');
        if (!response.ok) {
            throw new Error('Failed to fetch product data');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
            // Find the specific product for this page
            const product = findProductForCurrentPage(data.data);
            if (product) {
                updateStockIndicator(product);
            } else {
                console.error('Product not found in API response');
            }
        } else {
            console.error('API returned error:', data.message);
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
    }
}

// Find the product data for this specific product page using only SKU
function findProductForCurrentPage(products) {
    // Extract current page filename
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop().toLowerCase();
    
    // Map filenames to SKUs (exact matches from the database)
    let productSku = null;
    if (filename.includes('ignis')) {
        productSku = 'IGNIS-30';
    } else if (filename.includes('aqua')) {
        productSku = 'AQUA-30';
    } else if (filename.includes('aura')) {
        productSku = 'AURA-30';
    } else if (filename.includes('terra')) {
        productSku = 'TERRA-30';
    } else if (filename.includes('aether')) {
        productSku = 'AETHER-30';
    } else if (filename.includes('collection')) {
        productSku = 'COLL-SET';
    } else if (filename.includes('discovery')) {
        productSku = 'DISC-SET';
    }
    
    // If we don't have a SKU match, return null
    if (!productSku) return null;
    
    // Find product by SKU - case-insensitive match
    return products.find(product => 
        product.sku && product.sku.toUpperCase() === productSku.toUpperCase()
    );
}

// Update stock indicator based on product stock
function updateStockIndicator(product) {
    const stockIndicator = document.getElementById('stockIndicator');
    if (!stockIndicator) return;
    
    // Clear previous content
    stockIndicator.innerHTML = '';
    
    if (product.stock_quantity <= 0) {
        // Out of stock
        stockIndicator.classList.remove('stock-indicator-low');
        stockIndicator.style.display = 'none';
        
        // Disable add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Nicht vorrätig';
            addToCartBtn.classList.add('btn-disabled');
        }
    } else if (product.stock_quantity <= product.low_stock_threshold) {
        // Low stock
        stockIndicator.classList.add('stock-indicator-low');
        stockIndicator.classList.remove('stock-indicator-out');
        stockIndicator.innerHTML = '<span>Begrenzt verfügbar</span>';
        //stockIndicator.innerHTML = '<span>Nur noch ' + product.stock_quantity + ' vorrätig</span>';
        stockIndicator.style.display = 'block'; // Always display low stock indicators
    } else {
        // In stock - remove any stock indicator classes
        stockIndicator.classList.remove('stock-indicator-out', 'stock-indicator-low');
        // Hide the indicator when in stock
        stockIndicator.style.display = 'none';
    }
}

// Update meta tags
function updateMetaTags(product) {
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    if (ogTitle) ogTitle.setAttribute('content', `${product.name} - Elemental Essence`);
    if (ogDescription) ogDescription.setAttribute('content', product.description || '');
    
    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    
    if (twitterTitle) twitterTitle.setAttribute('content', `${product.name} - Elemental Essence`);
    if (twitterDescription) twitterDescription.setAttribute('content', product.description || '');
}

// Initialize tabs functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize quantity selector
function initQuantitySelector() {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');
    
    if (!quantityInput || !decreaseBtn || !increaseBtn) return;
    
    decreaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if (value < 10) {
            quantityInput.value = value + 1;
        }
    });
    
    // Ensure input always has a valid number
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) {
            quantityInput.value = 1;
        } else if (value > 10) {
            quantityInput.value = 10;
        }
    });
}

// Initialize add to cart functionality
function initAddToCart() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const quantityInput = document.getElementById('quantity');
    
    if (!addToCartBtn || !quantityInput) return;
    
    addToCartBtn.addEventListener('click', () => {
        if (addToCartBtn.disabled) return;
        
        // Get product SKU and quantity
        const sku = addToCartBtn.getAttribute('data-sku');
        const quantity = parseInt(quantityInput.value);
        
        if (!sku) {
            console.error('Product SKU not found');
            return;
        }
        
        // Get product name for confirmation message
        const productName = document.querySelector('h1').textContent;
        
        // Add to cart (localStorage)
        addToCart(sku, quantity);
        
        // Show confirmation message
        showAddToCartConfirmation(productName, quantity);
    });
}

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

// Show add to cart confirmation
function showAddToCartConfirmation(productName, quantity) {
    // Create confirmation message element
    const confirmationMessage = document.createElement('div');
    confirmationMessage.className = 'cart-confirmation';
    confirmationMessage.innerHTML = `
        <div class="cart-confirmation-content">
            <i class="fas fa-check-circle"></i>
            <p>${productName} (${quantity}x) wurde zum Warenkorb hinzugefügt</p>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(confirmationMessage);
    
    // Remove after timeout
    setTimeout(() => {
        confirmationMessage.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(confirmationMessage);
        }, 500);
    }, 3000);
}