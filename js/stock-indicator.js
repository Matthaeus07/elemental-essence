// Stock Indicator Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fetch product data from the API
    fetchProductData();
});

// Fetch product data from the API
async function fetchProductData() {
    try {
        const response = await fetch('api/index.php?endpoint=products');
        if (!response.ok) {
            throw new Error('Failed to fetch product data');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
            updateProductDisplay(data.data);
        } else {
            console.error('API returned error:', data.message);
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
    }
}

// Update product displays with stock information
function updateProductDisplay(products) {
    // Create a mapping of product names to their data
    const productMap = {};
    products.forEach(product => {
        // Convert to lowercase and remove spaces for more flexible matching
        const simplifiedName = product.name.toLowerCase().replace(/\s+/g, '');
        productMap[simplifiedName] = product;
    });
    
    // Update individual product displays
    updateIndividualProducts(productMap);
    
    // Update collection display
    updateCollectionProduct(productMap);
    
    // Update discovery set display
    updateDiscoveryProduct(productMap);
}

// Update individual product displays
function updateIndividualProducts(productMap) {
    const elementProducts = document.querySelectorAll('.element-product');
    
    elementProducts.forEach(productEl => {
        const nameEl = productEl.querySelector('.element-product-name');
        if (!nameEl) return;
        
        const productName = nameEl.textContent.trim();
        const simplifiedName = productName.toLowerCase().replace(/\s+/g, '');
        const product = productMap[simplifiedName];
        
        if (product) {
            // Check if a stock indicator already exists
            let stockIndicator = productEl.querySelector('.stock-indicator');
            if (!stockIndicator) {
                // Create stock indicator
                stockIndicator = document.createElement('div');
                stockIndicator.className = 'stock-indicator';
                
                // Insert after the description paragraph and before the price
                const descEl = productEl.querySelector('p');
                const priceEl = productEl.querySelector('.element-product-price');
                
                if (descEl && priceEl) {
                    productEl.insertBefore(stockIndicator, priceEl);
                } else {
                    // Fallback - append to product
                    productEl.appendChild(stockIndicator);
                }
            }
            
            // Update stock indicator
            updateStockIndicator(stockIndicator, product);
            
            // Disable add to cart button if out of stock
            const addToCartBtn = productEl.querySelector('.btn');
            if (addToCartBtn && product.stock_quantity <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Nicht vorrätig';
                addToCartBtn.classList.add('btn-disabled');
            } else if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'In den Warenkorb';
                addToCartBtn.classList.remove('btn-disabled');
            }
        }
    });
}

// Update collection product display
function updateCollectionProduct(productMap) {
    const collectionTab = document.getElementById('collection');
    if (!collectionTab) return;
    
    const collection = productMap['elementalessencekollektion'] || 
                      productMap['kollektion'] || 
                      productMap['collection'];
    
    if (collection) {
        // Find the product description, features, and price
        const descEl = collectionTab.querySelector('.product-desc');
        const featuresEl = collectionTab.querySelector('.product-features');
        const priceEl = collectionTab.querySelector('.product-price');
        const buttonsEl = collectionTab.querySelector('.product-buttons');
        
        if (priceEl && buttonsEl) {
            // Check if stock indicator exists
            let stockIndicator = collectionTab.querySelector('.stock-indicator');
            
            // If it exists but is in the wrong place, remove it so we can recreate it
            if (stockIndicator) {
                stockIndicator.remove();
            }
            
            // Create new stock indicator
            stockIndicator = document.createElement('div');
            stockIndicator.className = 'stock-indicator stock-indicator-inline';
            
            // Insert AFTER price and BEFORE buttons
            priceEl.after(stockIndicator);
            
            updateStockIndicator(stockIndicator, collection);
            
            // Disable add to cart button if out of stock
            const addToCartBtn = collectionTab.querySelector('.btn');
            if (addToCartBtn && collection.stock_quantity <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Nicht vorrätig';
                addToCartBtn.classList.add('btn-disabled');
            } else if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'In den Warenkorb';
                addToCartBtn.classList.remove('btn-disabled');
            }
        }
    }
}

// Update discovery set product display
function updateDiscoveryProduct(productMap) {
    const discoveryTab = document.getElementById('discovery');
    if (!discoveryTab) return;
    
    const discovery = productMap['discoveryset'] || 
                     productMap['discovery'] || 
                     productMap['entdeckerset'];
    
    if (discovery) {
        // Find the product description, features, and price
        const descEl = discoveryTab.querySelector('.product-desc');
        const featuresEl = discoveryTab.querySelector('.product-features');
        const priceEl = discoveryTab.querySelector('.product-price');
        const buttonsEl = discoveryTab.querySelector('.product-buttons');
        
        if (priceEl && buttonsEl) {
            // Check if stock indicator exists
            let stockIndicator = discoveryTab.querySelector('.stock-indicator');
            
            // If it exists but is in the wrong place, remove it so we can recreate it
            if (stockIndicator) {
                stockIndicator.remove();
            }
            
            // Create new stock indicator
            stockIndicator = document.createElement('div');
            stockIndicator.className = 'stock-indicator stock-indicator-inline';
            
            // Insert AFTER price and BEFORE buttons
            priceEl.after(stockIndicator);
            
            updateStockIndicator(stockIndicator, discovery);
            
            // Disable add to cart button if out of stock
            const addToCartBtn = discoveryTab.querySelector('.btn');
            if (addToCartBtn && discovery.stock_quantity <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Nicht vorrätig';
                addToCartBtn.classList.add('btn-disabled');
            } else if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = 'In den Warenkorb';
                addToCartBtn.classList.remove('btn-disabled');
            }
        }
    }
}

// Update stock indicator based on product stock
function updateStockIndicator(indicatorEl, product) {
    // Clear previous content
    indicatorEl.innerHTML = '';
    
    if (product.stock_quantity <= 0) {
        // Out of stock - hide the indicator (will only show in button)
        indicatorEl.classList.remove('stock-indicator-out', 'stock-indicator-low');
        indicatorEl.style.display = 'none';
    } else if (product.stock_quantity <= product.low_stock_threshold) {
        // Low stock
        indicatorEl.classList.add('stock-indicator-low');
        indicatorEl.classList.remove('stock-indicator-out');
        indicatorEl.innerHTML = '<span>Begrenzt verfügbar</span>';
        //indicatorEl.innerHTML = '<span>Nur noch ' + product.stock_quantity + ' vorrätig</span>';
        indicatorEl.style.display = 'block'; // Always display low stock indicators
    } else {
        // In stock - remove any stock indicator classes
        indicatorEl.classList.remove('stock-indicator-out', 'stock-indicator-low');
        // Hide the indicator when in stock
        indicatorEl.style.display = 'none';
    }
}