document.addEventListener('DOMContentLoaded', function() {
    const selectorWrap = document.querySelector('.selector-wrap');
    const selectorBox = selectorWrap.querySelector('.selector__box');
    const selectorValue = selectorWrap.querySelector('.selector__value');
    const items = selectorWrap.querySelectorAll('.selector__dropdown-item');
    
    selectorBox.addEventListener('click', function(e) {
        e.stopPropagation();
        selectorWrap.classList.toggle('open');
    });
    
    items.forEach(item => {
        item.addEventListener('click', function() {
            const year = this.textContent;
            selectorValue.textContent = year;
            items.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            selectorWrap.classList.remove('open');
            const event = new CustomEvent('yearSelected', {
                detail: { year: year }
            });
            selectorWrap.dispatchEvent(event);
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!selectorWrap.contains(e.target)) {
            selectorWrap.classList.remove('open');
        }
    });
});