# Тотальное ревью `journal-layout` — ветка `01.doc`

**Дата аудита:** 22 июля 2026  
**Репозиторий:** <https://github.com/drov2014/journal-layout/tree/01.doc>  
**Проверено:** 6 HTML-страниц, 5 JavaScript-файлов, SCSS partials, точка сборки `style.scss`, скомпилированный CSS и текущий `README.md`.  
**Production status:** **BLOCKED**.

> Это статический построчный аудит. В ветке нет воспроизводимого `package.json`, lint/test/build scripts и CI, поэтому автоматический pipeline проекта запустить невозможно. Там, где нужен runtime/browser test, это отдельно отмечено.

---

# 1. ОБЩАЯ ОЦЕНКА — **2.7 / 10**

Проект выглядит как развитый визуальный прототип, но не соответствует production-уровню по безопасности, доступности и поддерживаемости. `doctype`, `lang="ru"`, UTF-8 и viewport на страницах присутствуют. Однако почти вся сложная интерактивность построена на ненативных элементах, JavaScript хрупок, SCSS чрезмерно связан с конкретным DOM, а «авторизация» полностью скомпрометирована архитектурно.

| Область | Оценка | Вердикт |
|---|---:|---|
| HTML и семантика | 4.0/10 | Каркас есть, структура компонентов системно неверна |
| A11y | 1.5/10 | Клавиатура, focus, ARIA-состояния почти отсутствуют |
| SCSS | 3.0/10 | Partials есть, но нет ясных слоёв, токенов и API |
| JavaScript | 2.0/10 | Глобальный, хрупкий, без safe init и cleanup |
| Безопасность | 0.5/10 | Пароли и проверка входа находятся в клиенте |
| Производительность | 4.0/10 | Нет тяжёлых алгоритмов, но есть лишние layout reads/listeners |
| Адаптивность | 3.5/10 | Один breakpoint и большое количество fixed values |
| Документация/QA | 0.5/10 | `README.md` пуст, lint/tests/CI не обнаружены |

**Решение code review:** merge в production отклонить. Нужен не косметический patch, а последовательный рефакторинг HTML → JS → SCSS → tooling.

---

# 2. КРИТИЧЕСКИЕ ОШИБКИ — СРОЧНО ИСПРАВИТЬ

## C-01. Открытые логины и пароли в `js/script.js`

В `usersDatabase` браузеру передаются пары `login/password`, после чего вход проверяется через `Array.find()` на клиенте. Любой посетитель видит все credentials в DevTools.

**Почему релиз запрещён:** нет серверной проверки, хеширования, rate limiting, audit logging, разграничения прав и защищённой сессии. Клиент не может быть trusted boundary.

**Исправление:** полностью удалить `usersDatabase` и проверку пароля из frontend. Отправлять форму на backend по HTTPS; backend проверяет hash и устанавливает `HttpOnly; Secure; SameSite` cookie. Все защищённые действия повторно авторизуются сервером.

## C-02. `localStorage` используется как доказательство авторизации

```js
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

Пользователь может записать туда любой ID, имя или роль. Данные доступны любому XSS-коду и не имеют подписи/срока жизни.

**Исправление:** session state хранится на сервере; клиент получает безопасный профиль через `/api/session`. В `localStorage` нельзя хранить доверенное access-control состояние.

## C-03. Вызов несуществующей `showMessage()`

`handleLogin()` вызывает `showMessage()` для пустой и неверной формы, но функции нет. Результат — `ReferenceError` именно в error-flow.

Минимальная runtime-починка:

```html
<p id="login-message" role="status" aria-live="polite"></p>
```

```js
function showMessage(text, type = 'info') {
  const node = document.querySelector('#login-message');
  if (!node) return;
  node.textContent = text;
  node.dataset.type = type;
}
```

Это не делает client-side auth безопасной — её всё равно удалить.

## C-04. Необъявленная глобальная `allContents`

```js
allContents = document.querySelectorAll('.header__content');
```

В classic script создаётся `window.allContents`; в strict mode/ES-module будет `ReferenceError`.

```js
const allContents = header.querySelectorAll('.header__content');
```

Скрипты подключать как modules:

```html
<script type="module" src="./js/main.js"></script>
```

## C-05. Интерактивные controls сделаны через `div`/голый `svg`

Повторяется на всех страницах: `.header__item-btn`, close icons, «Найти», «Сбросить», «Войти», «Показать далее», copy action, custom selector, accordion trigger.

`div` не попадает в Tab-порядок, не активируется Enter/Space, не сообщает роль/disabled state и не отправляет форму. Добавлять `role="button" tabindex="0"` — худший fallback; правильное решение — `<button>`, `<a>`, `<select>`, `<details>`.

## C-06. Поиск и вход не являются формами

- отсутствует `<form>`;
- labels не связаны через `for/id`;
- actions — `div`;
- Enter не работает;
- browser validation не работает;
- login autocomplete отключён;
- ошибки не объявляются live region;
- обязательность показана только `*`.

**Исправление:** реальные формы, `name`, `method`, `required`, `autocomplete="username"` и `autocomplete="current-password"`, submit/reset buttons.

## C-07. JS падает при отсутствии ожидаемого DOM

- `article.js`: `listOfSources.querySelector()` до проверки `listOfSources`;
- `pagination-selector.js`: `selectorWrap.querySelector()` до guard;
- `viewing.js`: `viewing.querySelector()` до guard;
- `script.js`: проверяется только `.header`, но не search/dropdown/arrow/hero/menu panels;
- auth-функции обращаются к nodes без проверок.

Каждый модуль обязан начинаться с root guard:

```js
const root = document.querySelector('[data-module="viewing-counter"]');
if (!root) return;
```

Отсутствие одного компонента не должно ломать весь bundle.

## C-08. Контент `article.html` внутренне противоречив

Заголовок относится к цилиндрическому резонатору, а аннотация/цитирование и часть библиографии — к predator–prey модели. Есть повторяющиеся keywords и источники.

Для научного журнала это critical data-integrity defect: пользователь может процитировать не ту работу. Страница должна генерироваться из единого валидируемого объекта статьи; `title`, `authors`, `abstract`, `doi`, `citation`, `references` проверяются schema/integration tests.

## C-09. Страница публикации не использует `<article>`

Самостоятельная научная работа размечена generic `section/div`, а `.title` местами навешан на `<header>` вместо настоящего heading.

**Исправление:** `<main><article><header>…</header><section aria-labelledby>…</section></article></main>`.

## C-10. Удаляется focus outline

В SCSS встречается `outline: none` без гарантированной равноценной замены. Клавиатурный пользователь теряет местоположение.

```scss
.control:focus { outline: none; }
.control:focus-visible {
  outline: 0.3rem solid $color-focus;
  outline-offset: 0.3rem;
}
```

---

# 3. ВЫСОКИЙ ПРИОРИТЕТ — ИСПРАВИТЬ В БЛИЖАЙШЕЕ ВРЕМЯ

## 3.1 HTML и a11y

### H-01. Неверная иерархия заголовков

На страницах `h2` с названием журнала расположен до page `h1`. Дизайн управляет outline, а не структура. Название бренда не обязано быть heading; каждой странице нужен один ясный `h1`, далее последовательные `h2/h3`.

### H-02. Визуальные title-контейнеры вместо headings

`header/div.title` не формирует document outline. Заголовки разделов должны быть `h2/h3`, а стиль задаётся классом.

### H-03. Карточки публикаций не являются `<article>`

Самостоятельная карточка статьи:

```html
<article class="article-card">
  <h3 class="article-card__title"><a href="/article/...">…</a></h3>
</article>
```

### H-04. Несколько `<nav>` без доступных имён

```html
<nav aria-label="Основная навигация">…</nav>
<nav aria-label="Выбор языка">…</nav>
<nav aria-label="Страницы архива">…</nav>
```

### H-05. SVG не классифицированы

Декоративные icons: `aria-hidden="true" focusable="false"`. Icon-only button получает имя на `<button aria-label="…">`.

### H-06. Бесполезные `alt="user_photo"`/`author_photo`

Портрет — имя человека; декоративное изображение — `alt=""`; технические filename/id в alt запрещены.

### H-07. `href="#"` как заглушка

Создаёт ложную навигацию и прыжок к началу. Нужна реальная ссылка либо button. CI должен блокировать placeholder links.

### H-08. Одинаковый `<title>Journal</title>`

Нужны уникальные title, например `Архив выпусков — Известия СГУ`, плюс description/canonical/social metadata для публичного сайта.

### H-09. Нет skip link

```html
<a class="skip-link" href="#main-content">Перейти к содержанию</a>
```

### H-10. Текущий раздел nav не отмечен

`aria-current` есть у языка, но должен быть и у активной страницы основной навигации.

### H-11. Даты и идентификаторы не размечены

```html
<time datetime="2025-02-28">28.02.2025</time>
```

DOI/ORCID/Scopus должны быть настоящими links с корректными accessible names.

### H-12. Контентные опечатки и тестовые повторы

`Cбросить` начинается латинской C; вероятна опечатка `Михайловнч`; блоки редакторов и статей повторяются. Нужна редакторская вычитка и schema validation данных.

### A-01. Нет ARIA state model

Header panels, accordion, selector и expand-list меняют только classes. Нужны `aria-expanded`, `aria-controls`, `hidden`/region.

### A-02. Нет keyboard interaction

Не поддержаны Enter/Space/Escape/Arrow/Home/End. Лучшее решение: `<details>/<summary>` для accordion и `<select>` для года.

### A-03. Overlay не управляет focus

При открытии меню focus не переносится внутрь, не trap-ится, Escape не закрывает, после закрытия не возвращается trigger, фон не `inert`. Нужен корректный disclosure/dialog/popover pattern.

### A-04. `.no-scroll` на mobile задаёт `overflow: scroll`

Это противоречит назначению и не блокирует фон. Использовать явный `.is-scroll-locked { overflow: hidden; }`, учитывать scrollbar compensation.

### A-05. Нет `prefers-reduced-motion`

Пятisekundный counter, smooth scroll, bounce и transitions должны отключаться/сокращаться.

### A-06. Контраст не подтверждён

Нужна автоматическая и ручная проверка текста, placeholder, links, hover/focus/disabled states по WCAG AA.

## 3.2 SCSS

### S-01. Нет ясной 7-1/слойной архитектуры

`_tools.scss` смешивает utilities, components, typography и animations; `_header.scss` чрезмерно крупный; page partials дублируют hero/mobile; `_selector.scss` существует, но не импортируется; selector-like styles частично находятся в `_pagination.scss`.

### S-02. Вложенность > 3 уровней

Header, accordion, selector, pagination и page partials создают высокую specificity и жёстко связывают CSS с DOM. Цель — 1–2 уровня, абсолютный максимум 3 без обоснования.

### S-03. Недостаточно tokens

Есть в основном colors/transition. Нужны breakpoints, spacing, type scale, line heights, radii, shadows, z-index, container sizes, durations/easings, control/icon sizes.

### S-04. Магические числа

Повторяются `75rem`, `49rem`, `12rem`, `35rem`, `4.5rem`, `5000`, `2000`, `500`, `0.694444444vw`. Повторяемые значения — tokens; уникальные — named calculation/comment.

### S-05. Root font-size зависит от viewport

```scss
html { font-size: 0.694444444vw; }
```

Это превращает `rem` в скрытый viewport unit и ослабляет user font settings/zoom. Использовать `font-size: 100%`; fluid typography — через `clamp()` на конкретных text styles.

### S-06. Опасный global `img`

```scss
img { width: 100%; height: 100%; object-fit: cover; }
```

Растягивает logos, схемы и изображения. Безопасная база:

```scss
img, svg { display: block; max-width: 100%; }
img { height: auto; }
```

`object-fit` задавать конкретному BEM element.

### S-07. Fixed dimensions вместо intrinsic layout

Много `height/width`, absolute positions и больших fixed paddings. Это ломается при переводе, zoom 200%, системных fonts и CMS content. Использовать `min-height`, grid/flex, `minmax()`, `clamp()`, wrapping.

### S-08. Один breakpoint `48em`

Нужны content-driven breakpoints минимум small/mobile, tablet, desktop, wide. В `_journal.scss` встречается `48rem` вместо `48em` — несогласованный и вероятно ошибочный порог.

### S-09. `:has()` — обязательная layout-логика

Без browser matrix/fallback рискованно. State лучше задавать явным modifier `.is-open`.

### S-10. Дублируется `@keyframes bounceArrow`

Разные definitions глобально конфликтуют; последнее импортированное перезапишет предыдущее.

### S-11. Избыточная загрузка fonts

EOT/TTF/WOFF/WOFF2 для нескольких weights без `font-display: swap`. Для современного baseline обычно WOFF2 + при необходимости WOFF fallback.

### S-12. BEM непоследователен

`.active/.open/.show`, `selector-wrap`, `menu-layer`, IDs `#keywords/#copy-card`, `nth-child` и `:has` подменяют modifiers. Convention: `.block__element--modifier`, JS-state `.is-open`, utility `.u-visually-hidden`, JS hooks — `data-*`.

## 3.3 JavaScript

### J-01. `script.js` нарушает SRP

Один файл управляет autocomplete, header panels, overlay, scroll locking, auth и profile. Разнести на `search-autocomplete.js`, `header-menu.js`, `auth-client.js`, `login-form.js`, `main.js`.

### J-02. Trigger/panel связываются по NodeList index

Любое изменение порядка DOM подключит кнопку к чужой панели. Использовать `aria-controls`/ID или `data-target`.

### J-03. Динамический `classList[action]`

Скрывает намерение и допускает неверную строку. Использовать `classList.toggle(name, boolean)` и отдельные open/close functions.

### J-04. `closeIndex` не сбрасывается

`closeAllMenus()` удаляет classes, но оставляет stale state, из-за чего следующий click может неверно toggle body/overlay.

### J-05. Таймеры не контролируются

`setTimeout` для menu/copy не сохраняется и не отменяется. Использовать `transitionend` либо хранить ID/cleanup.

### J-06. Listeners создаются при каждом render autocomplete

Удалённые nodes будут собраны GC, но это ненужная работа. Использовать event delegation на list root.

### J-07. Нет debounce/abort input

Для server search нужен debounce и `AbortController`, чтобы отменять предыдущий request.

### J-08. Global listeners без lifecycle

Document/window handlers не удаляются. Init functions должны возвращать cleanup; listeners подключать с `{ signal }`.

### J-09. `article.js` измеряет layout и пишет inline height

`offsetHeight` устаревает после resize/font load; формулы `+4.5`, `+1.5*items.length` необъяснимы. Скрывать элементы через `hidden`, а animation считать progressive enhancement.

### J-10. Clipboard без feature detection/await/catch

UI показывает успех до выполнения promise. `ClipboardItem` может быть недоступен/отклонён. Использовать `await`, `try/catch`, fallback plain text.

### J-11. Regex не является sanitization

Удаление `class` из `innerHTML` regex-ом не гарантирует безопасный/валидный HTML. Citation строить из trusted data или копировать plain text.

### J-12. Accordion click-only

Нет ARIA, keyboard и resize handling. Использовать `<details>` либо button + region.

### J-13. Custom year selector повторяет `<select>`

Потеряны keyboard, mobile picker, type-ahead и form semantics. Удалить custom implementation.

### J-14. Scroll listener counter остаётся навсегда

После запуска `isAnimated=true`, listener продолжает вызываться. Использовать `IntersectionObserver`, затем `disconnect()`.

### J-15. Нет reduced motion и проверки `NaN`

Counter должен мгновенно показывать итог при reduced motion; `targetNumber` проверять `Number.isFinite`.

### J-16. Форматирование через regex

Использовать `Intl.NumberFormat('ru-RU')`.

### J-17. Комментарии не описывают контракт

«Функция выхода» не заменяет JSDoc: нужны params, returns, throws, side effects и cleanup.

## 3.4 Производительность/кроссбраузерность/tooling

- layout reads `offsetHeight/scrollHeight/getBoundingClientRect` выполняются в event-driven сценариях;
- images не имеют системной стратегии `width/height`, `aspect-ratio`, `loading="lazy"`, `decoding="async"`;
- CSS build/minification/source-map policy не документированы;
- fixed heights не выдерживают long content;
- browser matrix отсутствует, поэтому допустимость `:has`, `ClipboardItem`, smooth scroll и WebKit scrollbars не определена;
- не обнаружены `package.json`, ESLint, Stylelint, Prettier, HTML validator, tests, Browserslist и CI.

Минимальный merge gate:

```text
npm run format:check
npm run lint:html
npm run lint:scss
npm run lint:js
npm run test
npm run test:e2e
npm run test:a11y
npm run build
```

---

# 4. СРЕДНИЙ ПРИОРИТЕТ — УЛУЧШИТЬ

## M-01. Данные autocomplete дублируются

`termLinks` содержит повторные значения и пустые URL. Данные должны приходить из API/CMS или отдельного JSON, проходить deduplication и schema validation.

## M-02. Непоследовательный code style

Одинарные/двойные кавычки, формат функций и отступы смешаны. Настроить Prettier + ESLint; не тратить review на ручное форматирование.

## M-03. Нестрогое сравнение

```js
closeIndex != index
```

Использовать `!==`.

## M-04. Открытие меню насильно прокручивает страницу вверх

`window.scrollTo({ top: 0, behavior: 'smooth' })` — неожиданный side effect. Overlay должен быть `position: fixed`, а не перемещать пользователя.

## M-05. Placeholder подменяет label и состояние

Placeholder исчезает и не является постоянной инструкцией. Label должен быть видим всегда.

## M-06. `.btn` перегружен

Ввести `.button`, `.button--primary`, `.button--secondary`, `.button--icon`, `.button--block`.

## M-07. State classes не документированы

Зафиксировать `.is-open`, `.is-active`, `.has-overlay`, `.is-scroll-locked`. Не использовать generic `.open/.show/.active` без component context.

## M-08. JS зависит от styling classes

Использовать hooks `[data-js="header-menu"]`, `[data-action="copy-citation"]`; изменение дизайна не должно ломать поведение.

## M-09. Нет graceful degradation

При отключённом JS основной content, links, archive year и editor details должны оставаться доступными.

## M-10. Fixtures смешаны с production markup

Авторы, articles, ratings и users хардкодятся. Разделить templates, fixtures и API data.

## M-11. Header/footer продублированы во всех HTML

Общий шаблон должен генерироваться SSG/template engine/component, иначе любое исправление копируется вручную в 6 файлов.

## M-12. Page SCSS повторяет общие patterns

Hero, title, action, card grid и mobile spacing должны стать components/composition utilities.

---

# 5. НИЗКИЙ ПРИОРИТЕТ — ПОЖЕЛАНИЯ

- Добавить `.editorconfig`.
- Удалить комментарии-разделители из сотен дефисов; модули дают структуру лучше.
- Зафиксировать naming language и glossary.
- Добавить `CHANGELOG.md` и PR checklist.
- Добавить visual regression tests.
- Добавить spellcheck/schema checks для DOI, ORCID, имён и повторов bibliography.
- Не хранить production source maps без осознанной security/debug policy.
- Добавить performance budgets для CSS, JS, fonts и images.

---

# 6. ПРЕДЛОЖЕНИЕ МИКСИНОВ

## 6.1 Целевая SCSS-структура

```text
sass/
├── abstracts/
│   ├── _tokens.scss
│   ├── _functions.scss
│   ├── _mixins.scss
│   └── _index.scss
├── base/
│   ├── _reset.scss
│   ├── _fonts.scss
│   ├── _typography.scss
│   └── _global.scss
├── layout/
│   ├── _container.scss
│   ├── _header.scss
│   └── _footer.scss
├── components/
│   ├── _button.scss
│   ├── _card.scss
│   ├── _accordion.scss
│   ├── _form.scss
│   ├── _pagination.scss
│   └── _viewing.scss
├── pages/
│   ├── _home.scss
│   ├── _archive.scss
│   ├── _article.scss
│   ├── _editors.scss
│   ├── _journal.scss
│   └── _thematics.scss
├── utilities/
│   ├── _accessibility.scss
│   └── _layout.scss
└── main.scss
```

`vendors/` добавлять только при реальной сторонней зависимости, а не ради формального «7-1».

## 6.2 Tokens

```scss
// abstracts/_tokens.scss
$colors: (
  text: #1f1f1f,
  surface: #fff,
  surface-muted: #f4f7fb,
  primary: #1769aa,
  primary-hover: #0f4f82,
  border: #c8d0da,
  danger: #b42318,
  focus: #ffbf47
);

$breakpoints: (
  sm: 30em,
  md: 48em,
  lg: 64em,
  xl: 80em
);

$spacing: (
  0: 0,
  1: 0.4rem,
  2: 0.8rem,
  3: 1.2rem,
  4: 1.6rem,
  5: 2.4rem,
  6: 3.2rem,
  7: 4.8rem,
  8: 6.4rem
);

$radii: (sm: 0.4rem, md: 0.8rem, lg: 1.6rem, pill: 999rem);
$durations: (fast: 120ms, normal: 200ms, slow: 320ms);
$z-layers: (base: 0, dropdown: 20, sticky: 30, overlay: 40, modal: 50);
```

## 6.3 Functions

```scss
// abstracts/_functions.scss
@use 'sass:map';
@use 'sass:math';
@use 'tokens';

@function token($source, $key) {
  @if not map.has-key($source, $key) {
    @error 'Unknown token: #{$key}';
  }
  @return map.get($source, $key);
}

@function color($name) {
  @return token(tokens.$colors, $name);
}

@function space($step) {
  @return token(tokens.$spacing, $step);
}

@function rem($pixels, $base: 16) {
  @if math.is-unitless($pixels) {
    @return math.div($pixels, $base) * 1rem;
  }
  @error 'rem() expects a unitless pixel value.';
}
```

## 6.4 Адаптив

```scss
@use 'sass:map';
@use 'tokens';

@mixin mq($breakpoint, $direction: min) {
  $value: map.get(tokens.$breakpoints, $breakpoint);

  @if $value == null {
    @error 'Unknown breakpoint: #{$breakpoint}';
  }

  @if $direction == min {
    @media (min-width: $value) { @content; }
  } @else if $direction == max {
    @media (max-width: calc(#{$value} - 0.02px)) { @content; }
  } @else {
    @error 'Direction must be min or max.';
  }
}
```

Применение:

```scss
.article-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: space(5);

  @include mq(md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mq(lg) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

## 6.5 Типографика

```scss
@mixin text-style(
  $min-size,
  $max-size: $min-size,
  $line-height: 1.4,
  $weight: 400,
  $letter-spacing: normal
) {
  font-size: clamp(#{$min-size}, 1rem + 1vw, #{$max-size});
  font-weight: $weight;
  line-height: $line-height;
  letter-spacing: $letter-spacing;
}

.page-title {
  @include text-style(2.8rem, 5.6rem, 1.08, 700);
}
```

Не делать все `rem` fluid через root font-size.

## 6.6 Buttons

```scss
@use 'sass:map';
@use '../abstracts/tokens';

@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: space(2);
  min-block-size: 4.4rem;
  padding: space(3) space(5);
  border: 0;
  border-radius: map.get(tokens.$radii, md);
  font: inherit;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color map.get(tokens.$durations, normal) ease,
    color map.get(tokens.$durations, normal) ease,
    border-color map.get(tokens.$durations, normal) ease,
    transform map.get(tokens.$durations, fast) ease;

  &:disabled,
  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@mixin button-variant($background, $foreground, $hover-background) {
  background: $background;
  color: $foreground;

  @media (hover: hover) {
    &:not(:disabled):hover { background: $hover-background; }
  }
}
```

## 6.7 Центрирование

```scss
@mixin flex-center($direction: row, $gap: 0) {
  display: flex;
  flex-direction: $direction;
  align-items: center;
  justify-content: center;
  gap: $gap;
}

@mixin grid-center {
  display: grid;
  place-items: center;
}
```

## 6.8 Focus и visually hidden

```scss
@mixin focus-ring {
  &:focus { outline: none; }
  &:focus-visible {
    outline: 0.3rem solid color(focus);
    outline-offset: 0.3rem;
  }
}

@mixin visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.u-visually-hidden { @include visually-hidden; }
```

## 6.9 Reduced motion

```scss
@mixin reduced-motion {
  @media (prefers-reduced-motion: reduce) { @content; }
}

@mixin motion-safe-transition($properties...) {
  transition-property: $properties;
  transition-duration: 200ms;
  transition-timing-function: ease;

  @include reduced-motion {
    transition-duration: 0.01ms;
  }
}
```

Глобальная accessibility override может осознанно использовать `!important`; component styles — нет:

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 7. УЛУЧШЕННЫЙ КОД — БЫЛО → СТАЛО

## 7.1 Header trigger

### Было

```html
<div class="header__item-btn">
  <svg class="header__svg">
    <use href="./assets/icons/header/sprite.svg#menu"></use>
  </svg>
</div>
```

### Стало

```html
<button
  class="header__menu-button"
  type="button"
  aria-controls="main-menu-panel"
  aria-expanded="false"
  aria-label="Открыть главное меню"
  data-header-trigger
>
  <svg class="header__icon" aria-hidden="true" focusable="false">
    <use href="./assets/icons/header/sprite.svg#menu"></use>
  </svg>
</button>

<div id="main-menu-panel" class="header-panel" hidden data-header-panel>
  ...
</div>
```

Нативная keyboard activation, accessible name, связь trigger/panel и реальное состояние `hidden`.

## 7.2 Search form

### Было

```html
<label>По заголовку:</label>
<input type="text">
<div class="btn">Найти</div>
<div class="btn">Cбросить</div>
```

### Стало

```html
<form class="search-form" action="/search" method="get" role="search">
  <div class="form-field">
    <label for="search-title">По заголовку</label>
    <input id="search-title" name="title" type="search">
  </div>

  <div class="form-field">
    <label for="search-keyword">По ключевому слову</label>
    <input id="search-keyword" name="keyword" type="search">
  </div>

  <div class="search-form__actions">
    <button class="button button--primary" type="submit">Найти</button>
    <button class="button button--secondary" type="reset">Сбросить</button>
  </div>
</form>
```

## 7.3 Login form

```html
<form id="login-form" class="login-form" method="post" novalidate>
  <div class="form-field">
    <label for="login-input">Имя пользователя</label>
    <input
      id="login-input"
      name="username"
      type="text"
      autocomplete="username"
      required
      aria-describedby="login-message"
    >
  </div>

  <div class="form-field">
    <label for="password-input">Пароль</label>
    <input
      id="password-input"
      name="password"
      type="password"
      autocomplete="current-password"
      required
      aria-describedby="login-message"
    >
  </div>

  <p id="login-message" class="form-message" role="status" aria-live="polite"></p>
  <button class="button button--primary" type="submit">Войти</button>
</form>
```

## 7.4 Article semantics

### Было

```html
<section class="article">
  <header class="title">Аннотация</header>
  ...
</section>
```

### Стало

```html
<main id="main-content">
  <article class="publication" itemscope itemtype="https://schema.org/ScholarlyArticle">
    <header class="publication__header">
      <p class="publication__journal">Известия Саратовского университета</p>
      <h1 class="publication__title" itemprop="headline">Название публикации</h1>

      <ul class="publication__authors" aria-label="Авторы">
        <li itemprop="author"><a href="/authors/..." rel="author">Имя автора</a></li>
      </ul>
    </header>

    <section aria-labelledby="abstract-title">
      <h2 id="abstract-title">Аннотация</h2>
      <p itemprop="abstract">...</p>
    </section>

    <section aria-labelledby="keywords-title">
      <h2 id="keywords-title">Ключевые слова</h2>
      <ul class="tag-list">...</ul>
    </section>

    <section aria-labelledby="references-title">
      <h2 id="references-title">Список литературы</h2>
      <ol>...</ol>
    </section>
  </article>
</main>
```

## 7.5 Выбор года: native select вместо custom div

```html
<label for="archive-year">Выбрать год</label>
<select id="archive-year" name="year" data-year-select>
  <option value="2025" selected>2025</option>
  <option value="2024">2024</option>
  <option value="2023">2023</option>
</select>
```

```js
const yearSelect = document.querySelector('[data-year-select]');

yearSelect?.addEventListener('change', ({ currentTarget }) => {
  const url = new URL(window.location.href);
  url.searchParams.set('year', currentTarget.value);
  window.location.assign(url);
});
```

## 7.6 Accordion: `<details>`

```html
<details class="editor-card">
  <summary class="editor-card__summary">
    <span class="editor-card__name">Леонид Юрьевич Коссович</span>
  </summary>
  <div class="editor-card__details">...</div>
</details>
```

Это сразу даёт focus, Enter/Space, announced expanded state и graceful degradation.

## 7.7 Server-backed auth client

```js
// js/services/auth-client.js

/**
 * Выполняет вход через server API.
 * Сервер устанавливает защищённую HttpOnly cookie.
 * @param {{username: string, password: string}} credentials
 * @returns {Promise<{id: string, displayName: string, photoUrl: string|null}>}
 * @throws {Error} Когда вход отклонён или server недоступен.
 */
export async function login(credentials) {
  const response = await fetch('/api/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'Неверный логин или пароль'
      : 'Не удалось выполнить вход');
  }

  return response.json();
}

/** Завершает server session. @returns {Promise<void>} */
export async function logout() {
  const response = await fetch('/api/session', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'X-CSRF-Token': getCsrfToken() },
  });

  if (!response.ok) throw new Error('Не удалось завершить сессию');
}

/** @returns {string} CSRF token, предоставленный server. */
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}
```

Frontend не может сам сделать auth безопасной: backend обязан проверять каждое protected действие.

## 7.8 Login form controller

```js
import { login } from './services/auth-client.js';

/**
 * Инициализирует форму входа.
 * @param {HTMLFormElement} form
 * @returns {() => void} Cleanup function.
 */
export function initLoginForm(form) {
  const controller = new AbortController();
  const message = form.querySelector('[role="status"]');
  const submit = form.querySelector('[type="submit"]');

  if (!message || !(submit instanceof HTMLButtonElement)) return () => {};

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    submit.disabled = true;
    message.textContent = '';

    try {
      const user = await login({
        username: String(data.get('username') ?? '').trim(),
        password: String(data.get('password') ?? ''),
      });

      document.dispatchEvent(new CustomEvent('session:changed', {
        detail: { user },
      }));
      form.reset();
    } catch (error) {
      message.textContent = error instanceof Error
        ? error.message
        : 'Неизвестная ошибка входа';
    } finally {
      submit.disabled = false;
    }
  }, { signal: controller.signal });

  return () => controller.abort();
}
```

## 7.9 Counter через IntersectionObserver

```js
/**
 * Инициализирует однократную анимацию счётчика.
 * @param {HTMLElement} root
 * @returns {() => void} Cleanup function.
 */
export function initViewingCounter(root) {
  const number = root.querySelector('[data-viewing-number]');
  const progress = root.querySelector('[data-viewing-progress]');
  if (!number || !progress) return () => {};

  const target = Number(number.dataset.value);
  if (!Number.isFinite(target) || target < 0) return () => {};

  const formatter = new Intl.NumberFormat('ru-RU');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameId = 0;

  const render = (value, ratio = 1) => {
    number.textContent = formatter.format(value);
    progress.style.setProperty('--progress', `${ratio * 100}%`);
  };

  if (reduceMotion) {
    render(target);
    return () => {};
  }

  const animate = () => {
    const duration = 1200;
    const startedAt = performance.now();

    const tick = (now) => {
      const ratio = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - ratio, 3);
      render(Math.round(target * eased), eased);
      if (ratio < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    animate();
  }, { threshold: 0.25 });

  observer.observe(root);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frameId);
  };
}
```

## 7.10 Clipboard с обработкой ошибок

```js
/**
 * Копирует citation и сообщает реальный результат операции.
 * @param {HTMLButtonElement} button
 * @param {HTMLElement} source
 * @returns {Promise<void>}
 */
export async function copyCitation(button, source) {
  const text = source.innerText.trim();
  const originalLabel = button.textContent;

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API недоступен');
    }
    await navigator.clipboard.writeText(text);
    button.textContent = 'Скопировано';
  } catch {
    button.textContent = 'Не удалось скопировать';
  } finally {
    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 2000);
  }
}
```

## 7.11 Debounce и event delegation autocomplete

```js
/**
 * @template {(...args: any[]) => void} T
 * @param {T} callback
 * @param {number} delay
 * @returns {(...args: Parameters<T>) => void}
 */
function debounce(callback, delay = 200) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

/**
 * Инициализирует autocomplete.
 * @param {HTMLElement} root
 * @param {{text: string, url: string}[]} source
 * @returns {() => void}
 */
export function initAutocomplete(root, source) {
  const input = root.querySelector('input');
  const list = root.querySelector('[role="listbox"]');
  if (!input || !list) return () => {};

  const controller = new AbortController();
  const unique = [...new Map(source.map(item => [item.text, item])).values()];

  const render = (items) => {
    list.replaceChildren(...items.map(({ text, url }) => {
      const option = document.createElement('li');
      const link = document.createElement('a');
      option.setAttribute('role', 'option');
      link.href = url;
      link.textContent = text;
      option.append(link);
      return option;
    }));
  };

  input.addEventListener('input', debounce(() => {
    const query = input.value.trim().toLocaleLowerCase('ru-RU');
    render(unique.filter(item =>
      item.text.toLocaleLowerCase('ru-RU').includes(query)
    ));
  }), { signal: controller.signal });

  list.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    input.value = link.textContent;
  }, { signal: controller.signal });

  return () => controller.abort();
}
```

Для полного ARIA combobox нужно реализовать active descendant, arrows, Escape и announced results либо взять проверенный компонент.

---

# 8. ДОКУМЕНТАЦИЯ — README.md + JSDoc

Вместе с аудитом подготовлены два отдельных файла:

- `README.recommended.md` — готовый полный README проекта;
- `JSDoc-reference.md` — JSDoc для всех существующих именованных JS-функций и правила именования anonymous handlers.

README описывает pages, current/target structure, variables, functions, mixins, HTML/SCSS/JS responsibilities, запуск, tooling, a11y, security, browser policy и Definition of Done.

---

# ПЛАН РЕФАКТОРИНГА

## Этап 0 — немедленно

1. Заморозить production release.
2. Удалить client credentials и проверить Git history на реальные secrets.
3. Зафиксировать screenshots для regression.
4. Создать issues C-01…C-10 как release blockers.

## Этап 1 — HTML/data

1. Общий template header/footer.
2. Native controls вместо div.
3. Реальные forms/labels.
4. Heading outline, article/section/nav semantics.
5. Alt, skip link, unique titles, real href.
6. Исправить article data mapping и повторы.

## Этап 2 — JavaScript

1. ES modules.
2. Server auth client.
3. Safe root initialization.
4. `data-*` hooks.
5. Cleanup через AbortController/observer disconnect/cancelAnimationFrame.
6. Native select/details.
7. Error handling и tests.

## Этап 3 — SCSS

1. Tokens/functions/mixins.
2. `html { font-size: 100%; }`.
3. Intrinsic container/typography.
4. Nesting ≤ 3.
5. Удалить orphan/duplicate partials/keyframes.
6. Focus/reduced-motion.
7. Убрать fixed heights.

## Этап 4 — tooling

1. npm scripts.
2. ESLint, Stylelint, Prettier, html-validate.
3. axe/pa11y, Playwright.
4. Lighthouse CI.
5. GitHub Actions merge gate.

## Этап 5 — acceptance

- keyboard-only navigation;
- Escape closes overlay, focus returns trigger;
- zoom 200% and 320 CSS px without lost content/horizontal scroll;
- reduced motion;
- screen-reader smoke test;
- API timeout/error states;
- JS disabled graceful content;
- no credentials/roles in bundle;
- article metadata consistency.

---

# DEFINITION OF DONE

- [ ] Нет client-side user database/passwords.
- [ ] Auth/access control выполняется backend-ом.
- [ ] Нет runtime ReferenceError/null dereference.
- [ ] Все controls нативны или полностью accessible.
- [ ] Forms работают по Enter и имеют labels.
- [ ] Один ясный `h1` на страницу.
- [ ] Article metadata непротиворечивы.
- [ ] SCSS nesting ≤ 3 без документированного исключения.
- [ ] Нет необъяснённых magic numbers.
- [ ] Нет component-level `!important`.
- [ ] Есть focus-visible и reduced-motion.
- [ ] Listeners/observers/timers имеют cleanup.
- [ ] Lint/test/build запускаются одной командой.
- [ ] CI блокирует merge.
- [ ] Axe не показывает serious/critical.
- [ ] README соответствует реальной сборке.
- [ ] Browser matrix утверждена.
- [ ] Chrome/Firefox/Safari/mobile проверены вручную.

---

# ФИНАЛЬНЫЙ ВЕРДИКТ

Сейчас это **визуально развитый, но инженерно незавершённый статический прототип**. Главная проблема — не косметика, а ложная модель безопасности, ненативная интерактивность и отсутствие контролируемой архитектуры. Точечные CSS-правки не дадут production-качества.

**Рекомендация:** отклонить merge в production и открыть remediation milestone по этапам выше.
