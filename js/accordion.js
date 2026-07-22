document.addEventListener('DOMContentLoaded', function() {
    const triggers = document.querySelectorAll('.accordion__trigger');
    
    triggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const listItem = this.closest('.accordion__list-item');
            const dropdown = listItem.querySelector('.accordion-dropdown');
            
            if (dropdown) {
                if (dropdown.classList.contains('open')) {
                    dropdown.style.maxHeight = null;
                    dropdown.classList.remove('open');
                } else {
                    dropdown.classList.add('open');
                    dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
                }
            }
        });
    });
});