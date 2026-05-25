document.addEventListener('DOMContentLoaded', () => {
    const listOfSources = document.querySelector('#list-of-sources');
    const ol = listOfSources.querySelector('.sources-list');
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
    ol.style.height = `${minHeight + 4.5}rem`;

    btn.onclick = () => {
        if (isExpanded) {
            ol.style.height = `${minHeight + 4.5}rem`;
            btn.textContent = 'Показать далее';
        } else {
            ol.style.height = `${maxHeight + 1.5 * items.length - 1.5}rem`;
            btn.textContent = 'Скрыть';
        }
        isExpanded = !isExpanded;
    };


    //---------------------------------------------------------------------------------------------



    const copyBtn = document.querySelector('#copy-card .btn');

    copyBtn.addEventListener('click', function () {
        const textContainer = document.querySelector('#copy-card span');
        const htmlContent = textContainer.innerHTML
            .replace(/class="[^"]*"/g, '')
            .replace(/<a/g, '<a style="color: #0066cc; text-decoration: underline;"');
        const textContent = textContainer.textContent;
        navigator.clipboard.write([
            new ClipboardItem({
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
                'text/plain': new Blob([textContent], { type: 'text/plain' })
            })
        ]);
        showCopySuccess(this);
    });

    function showCopySuccess(button) {
        const buttonText = button.querySelector('span');
        const originalText = buttonText.textContent;

        buttonText.textContent = 'Скопировано!';
        setTimeout(() => buttonText.textContent = originalText, 2000);
    }
});