document.addEventListener('DOMContentLoaded', function () {
    const viewing = document.querySelector('.viewing');
    const viewingLine = viewing.querySelector('.viewing__line');
    const viewingNumber = viewing.querySelector('.viewing__number');
    
    const targetNumber = parseInt(viewingNumber.textContent.trim().replace(/\s/g, ''), 10);
    const duration = 5000;
    let startTime = null;
    let isAnimated = false;

    function formatNumberWithSpaces(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function animateNumber(timestamp) {
        if (!startTime) startTime = timestamp;
        
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentNumber = Math.floor(targetNumber * progress);
        
        viewingNumber.textContent = formatNumberWithSpaces(currentNumber);
        viewingLine.style.setProperty('--progress', `${progress * 100}%`);
        
        if (progress < 1) {
            requestAnimationFrame(animateNumber);
        }
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }

    function checkAndAnimate() {
        if (!isAnimated && isElementInViewport(viewing)) {
            isAnimated = true;
            startTime = null;
            
            viewingNumber.textContent = '0';
            viewingLine.style.setProperty('--progress', '0%');
            
            requestAnimationFrame(animateNumber);
        }
    }

    window.addEventListener('scroll', checkAndAnimate);
    checkAndAnimate();
});