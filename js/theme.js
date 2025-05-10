// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add the theme toggle button to the navigation
    const nav = document.querySelector('nav ul');
    const themeToggleItem = document.createElement('li');
    themeToggleItem.innerHTML = `
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light mode">
            <i class="fas fa-moon"></i>
            <i class="fas fa-sun"></i>
        </button>
    `;
    // Append only if nav exists
    if (nav) {
        nav.appendChild(themeToggleItem);
    }

    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    const logoImage = document.getElementById('logoImage'); // Get the logo image element

    // --- Function to update the logo ---
    function updateLogo() {
        if (!logoImage) return; // Exit if logo image element doesn't exist
        
        // Determine if we're in a subfolder
        const isSubfolder = window.location.pathname.includes('/product/');
        const pathPrefix = isSubfolder ? '../' : '';
        
        const isDarkMode = htmlElement.classList.contains('dark-theme');
        if (isDarkMode) {
            logoImage.src = pathPrefix + 'assets/logo_dark.png'; // Set dark mode logo
        } else {
            logoImage.src = pathPrefix + 'assets/logo.png';     // Set light mode logo
        }
    }
    // --- END Function to update the logo ---

    // Check for saved user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-theme');
    }
    updateLogo(); // --- Set the initial logo based on the theme ---

    // Toggle theme function
    function toggleTheme() {
        if (htmlElement.classList.contains('dark-theme')) {
            htmlElement.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        updateLogo(); // --- Update the logo after toggling ---
    }

    // Add event listener to the toggle button
    // Check if themeToggle exists before adding listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Enhance orb animations by adding random movement
    const orbs = document.querySelectorAll('.orb');

    orbs.forEach(orb => {
        // Add slight random offset to animation-delay for each orb
        const randomDelay = Math.random() * 5; // Keep random delay
        orb.style.animationDelay = `${randomDelay}s`;
    });
});