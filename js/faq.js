document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion Functionality
    const faqItems = document.querySelectorAll('.faq-item');
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    // Function to toggle FAQ items
    function toggleFAQ(item) {
        const isActive = item.classList.contains('active');
        
        // Close all other items
        faqItems.forEach(faq => {
            if (faq !== item && faq.classList.contains('active')) {
                faq.classList.remove('active');
            }
        });
        
        // If the item was already active, just close it
        if (isActive) {
            item.classList.remove('active');
        } else {
            // Otherwise, open it with a slight delay for better animation
            setTimeout(() => {
                item.classList.add('active');
            }, 50);
        }
    }
    
    // Add click event to all FAQ questions
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            toggleFAQ(item);
        });
        
        // Add keyboard accessibility
        question.setAttribute('tabindex', '0');
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQ(item);
            }
        });
    });
    
    // Category filtering functionality
    function filterFAQs(category) {
        faqItems.forEach(item => {
            // First remove active class from all items when changing categories
            item.classList.remove('active');
            
            // Then handle visibility based on category
            if (category === 'all') {
                item.classList.remove('hidden');
            } else if (item.getAttribute('data-category') === category) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }
    
    // Add click event to category buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state for buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter FAQs
            const category = button.getAttribute('data-category');
            filterFAQs(category);
        });
    });
    
    // Check if there's a hash in the URL for direct category access
    const hash = window.location.hash.substring(1);
    if (hash) {
        const categoryMap = {
            'products': 'products',
            'ingredients': 'ingredients',
            'shipping': 'shipping',
            'company': 'company'
        };
        
        if (categoryMap[hash]) {
            const targetButton = document.querySelector(`.category-btn[data-category="${categoryMap[hash]}"]`);
            if (targetButton) {
                targetButton.click();
                // Removed the scrolling behavior
            }
        }
    }
    
    // Add URL hash change functionality to category buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            if (category !== 'all') {
                window.history.pushState(null, null, `#${category}`);
            } else {
                window.history.pushState(null, null, window.location.pathname);
            }
        });
    });
});