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


    //---------------------------------------------------------------------------------------------


    const card = document.getElementById('copy-card');

    card.querySelector('.content__btn').addEventListener('click', function () {
        const textElement = card.querySelector('.content__card-text');
        const textToCopy = textElement.textContent;

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const buttonText = this.querySelector('span');
                const originalText = buttonText.textContent;

                buttonText.textContent = 'Скопировано!';

                setTimeout(() => {
                    buttonText.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка при копировании: ', err);
                alert('Не удалось скопировать текст');
            });
    });
});