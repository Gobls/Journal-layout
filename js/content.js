document.addEventListener('DOMContentLoaded', () => {
    const listOfSources = document.querySelector('#list-of-sources');
    const ol = listOfSources.querySelector('.content__card-ol');
    const btn = listOfSources.querySelector('.btn');
    const items = ol.querySelectorAll('li');

    if (!btn || !ol || items.length <= 4) return;

    let isExpanded = false;
    let minHeight = 0;
    let maxHeight = 0;

    function calculateMinHeight() {
        if (items.length < 4) return 0;

        let totalHeightPx = 0;
        for (let i = 0; i < 4; i++) {
            totalHeightPx += items[i].offsetHeight;
        }

        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const heightRem = totalHeightPx / rootFontSize;
        return heightRem;
    }

    function calculateMaxHeight() {
        let totalHeightPx = 0;
        for (let i = 0; i < items.length; i++) {
            totalHeightPx += items[i].offsetHeight;
        }

        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const heightRem = totalHeightPx / rootFontSize;
        return heightRem;
    }

    maxHeight = calculateMaxHeight();
    minHeight = calculateMinHeight();
    ol.style.height = `${minHeight}rem`;

    btn.onclick = () => {
        if (isExpanded) {
            ol.style.height = `${minHeight}rem`;
            btn.textContent = 'Показать далее';
        } else {
            ol.style.height = `${maxHeight}rem`;
            btn.textContent = 'Скрыть';
        }
        isExpanded = !isExpanded;
    };
});