// Simple scroll animation
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Header scroll effect with proper resize handling
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        const isSmallScreen = window.innerWidth < 600;
        
        if (window.scrollY > 100) {
            // No padding animation for small screens
            if (isSmallScreen) {
                header.style.padding = ''; // Don't change padding on small screens
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            } else {
                // Normal animation for larger screens
                header.style.padding = '10px 0';
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            }
        } else {
            header.style.padding = '';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
    });

    // Properly handle window resize
    window.addEventListener('resize', () => {
        const header = document.querySelector('header');
        const isSmallScreen = window.innerWidth < 600;
        
        // Only apply changes if scrolled
        if (window.scrollY > 100) {
            if (isSmallScreen) {
                // For small screens: reset padding, keep shadow
                header.style.padding = '';
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            } else {
                // For larger screens: apply padding and shadow
                header.style.padding = '10px 0';
                header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
            }
        }
    });
});