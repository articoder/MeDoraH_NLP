/**
 * Utility Functions
 * General-purpose helper functions for the dashboard
 */

/**
 * Animate number with smooth counting effect
 * Uses easeOutQuart easing for a polished deceleration
 * @param {HTMLElement} element - The DOM element to update
 * @param {number} targetValue - The target number to animate to
 * @param {number} duration - Animation duration in milliseconds (default: 400)
 */
function animateNumber(element, targetValue, duration = 400) {
    if (!element) return;
    const startValue = parseInt(element.textContent) || 0;
    const target = parseInt(targetValue) || 0;

    // Skip animation if values are the same
    if (startValue === target) return;

    const startTime = performance.now();
    const diff = target - startValue;

    // Easing function for smooth deceleration
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.round(startValue + diff * easedProgress);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target; // Ensure final value is exact
        }
    }

    requestAnimationFrame(update);
}

/**
 * Download data as CSV file
 * @param {string} csvContent - The CSV content string
 * @param {string} filename - The filename for the download
 */
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download data as JSON file
 * @param {Object|Array} data - The data to download
 * @param {string} filename - The filename for the download
 */
function downloadJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for rate limiting
 * @param {Function} func - The function to throttle
 * @param {number} limit - The minimum time between calls in milliseconds
 * @returns {Function} - The throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format number with thousands separator
 * @param {number} num - The number to format
 * @returns {string} - The formatted number string
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Export for use in other modules (if using ES modules in future)
if (typeof window !== 'undefined') {
    window.animateNumber = animateNumber;
    window.downloadCSV = downloadCSV;
    window.downloadJSON = downloadJSON;
    window.debounce = debounce;
    window.throttle = throttle;
    window.formatNumber = formatNumber;
    window.escapeHTML = escapeHTML;
}
