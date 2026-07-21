# Тотальное ревью кода — Journal-layout

> Строгий аудит HTML / SCSS / JavaScript на продакшен-уровень.
> Все замечания — с конкретными примерами и ссылками на строки кода.
> Формат ссылок: `файл:строка`.

---

## 1. ОБЩАЯ ОЦЕНКА

| Категория | Оценка / 10 | Комментарий |
|---|---|---|
| Валидность HTML / семантика | **4** | Есть `doctype`, `lang`, но критические ошибки семантики (`<div>` вместо `<button>`, `div.btn`, отсутствие `<form>`, ARIA нарушено) |
| Доступность (a11y) | **3** | `outline:none`, нет `aria-expanded`, label не связан с input, SVG без `aria-hidden`, нет focus-trap, нет role |
| SCSS архитектура | **4,5** | Нет 7-1 pattern (нет `_mixins`, `_functions`, `_base`, `_typography`), дубль `_selector`/`_pagination`, магические числа |
| DRY / повторы | **3** | Шапка дублируется 6 раз, `@keyframes bounceArrow` определён дважды, `data-bg-icon` селекторы дублируются |
| JavaScript | **3,5** | Пароли в исходниках, неявная глобаль `allContents`, нет debounce/throttle, нет обработки ошибок, нет JSDoc |
| Безопасность | **2** | Пароли открытым текстом в `script.js:233`, авторизация в localStorage, exposed credentials |
| Производительность | **5** | Scroll без throttle, принудительные reflow в циклах, нет пассивных слушателей |
| Инфраструктура | **2,5** | Нет `package.json`, нет сборщика, нет линтеров, пустой `.gitignore`, пустой README, собранный CSS лежит в `sass/` |

### Итог: **3,4 / 10**

Код демонстрирует понимание разметки и базовой структуры SCSS, но **не готов к продакшену**. Главные блокеры: хардкод учетных данных, нарушение ARIA, дубль стилей, отсутствие архитектуры SCSS и системы сборки.

---

## 2. КРИТИЧЕСКИЕ ОШИБКИ (срочно)

### 2.1. Пароли пользователей в открытом виде в JS (`js/script.js:233-270`)

```js
const usersDatabase = [
  { id: 1, login: '1', password: '1', surname: 'Иванов', ... },
  { id: 2, login: '2', password: '2', ... },
  ...
];
```

Любой пользователь открывает DevTools и видит все логины/пароли. Это **блокер безопасности**.

**Как исправить:** Авторизация должна происходить на сервере. Клиент отправляет `POST /api/login` с credentials, сервер возвращает httpOnly-cookie или JWT. Пароли хранятся в БД в виде `bcrypt`/`argon2` хэшей.

```js
async function handleLogin() {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();
  if (!login || !password) return showMessage('Заполните все поля', 'error');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) throw new Error('auth failed');
    const user = await res.json();
    updateAuthState(user);
  } catch (err) {
    showMessage('Неверный логин или пароль', 'error');
  }
}
```

### 2.2. Неявная глобальная переменная (`js/script.js:201`)

```js
allContents = document.querySelectorAll('.header__content'); // ❌ нет const/let
```

Это загрязняет `window`, в strict-mode упадёт. Должно быть:
```js
const allContents = document.querySelectorAll('.header__content');
```

### 2.3. `<div>` и `<a>` вместо `<button>` для интерактивных элементов

Везде в проекте: `index.html:24, 31, 38, 46`, `article.html:103-110, 154-162, 182-189` и т.д.

```html
<!-- ❌ Было -->
<div class="header__content-btn--small btn--main btn" id="login-btn">
  <div class="header__content-text--big">Войти</div>
</div>

<!-- ✅ Стало -->
<button type="submit" class="btn btn--main header__content-btn--small" id="login-btn">
  Войти
</button>
```

`<div>` не попадает в дерево доступности, не активируется с клавиатуры (Enter/Space), не получает фокус. Это критично для a11y и ARIA-совместимости.

### 2.4. `outline: none` без замены → нарушение WCAG 2.1 SC 2.4.7 (`sass/_tools.scss:286`)

```scss
.btn {
  outline: none; // ❌
}
```

Пользователи клавиатуры не видят, где находятся. **Нужно** оставить видимым `:focus-visible`:

```scss
.btn {
  &:focus { outline: none; }
  &:focus-visible {
    outline: 0.3rem solid variable.$main;
    outline-offset: 0.3rem;
  }
}
```

### 2.5. Полное дублирование стилей селектора: `_selector.scss` и `_pagination.scss:49-201`

В `style.scss` подключён **только** `pagination`, но `_selector.scss` существует как мёртвый дубль. При этом в `_pagination.scss:49` класс `.selector` определён **второй раз** с отличиями (`padding: 1.2rem 2rem` vs `1.4rem 2rem`, разные transition-timings). Это классическая бомба: при правке в одном месте верстка «случайно» едет.

**Решение:** удалить `_selector.scss`, оставить единую реализацию в `_pagination.scss` (или вынести в `_components/_selector.scss`).

### 2.6. Дублирование `<header>` целиком на 6 страницах

`index.html`, `article.html`, `archive.html`, `editors.html`, `journal.html`, `thematics.html` содержат **идентичные** ~198 строк шапки. Любая правка требует правки в 6 местах → гарантия рассинхронизации.

**Решение:** внедрить шаблонизатор (Eleventy, Vite + `vite-plugin-handlebars`, Astro, PHP-include) или хотя бы Web Components:

```js
// js/components/site-header.js
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `... единый шаблон ...`;
  }
}
customElements.define('site-header', SiteHeader);
```

### 2.7. Глобальные функции вне модуля (`js/script.js:288, 300, 354, 369`)

```js
function initAuthHandlers() { ... }  // ❌ попадает в window
function handleLogin() { ... }
```

Любой сторонний скрипт может перезаписать. **Решение:** IIFE / ES-модули.

```js
// js/auth.js
export function initAuth() { ... }

// js/main.js
import { initAuth } from './auth.js';
```

### 2.8. Сохранение `currentUser` в `localStorage` (`js/script.js:331`)

```js
localStorage.setItem('currentUser', JSON.stringify(currentUser));
```

Любой XSS читает профиль пользователя. В сочетании с отсутствием sanitize — опасно. Хранить сессию должен сервер в `httpOnly; Secure; SameSite=Strict` cookie.

---

## 3. ВЫСОКИЙ ПРИОРИТЕТ

### 3.1. Отсутствие архитектуры SCSS (7-1 pattern не реализован)

Текущая структура:
```
sass/
├── _variable.scss    (только цвета + 1 transition)
├── _fonts.scss
├── _global.scss
├── _header.scss
├── _card.scss
├── _tools.scss       (← свалка: .text, .svg, .btn, .link, animations — всё в одном)
├── ... 7 компонентов
└── section/  (7 страниц)
```

**Что нужно (7-1):**
```
sass/
├── abstracts/
│   ├── _variables.scss      (цвета, шрифты, брейкпоинты, z-index, transition)
│   ├── _functions.scss      (rem(), color-contrast)
│   ├── _mixins.scss         (media, flex-center, button, typography)
│   └── _index.scss
├── base/
│   ├── _reset.scss          (modern-css-reset)
│   ├── _typography.scss     (h1-h6, p, a)
│   ├── _base.scss           (html, body)
│   └── _index.scss
├── components/
│   ├── _button.scss
│   ├── _card.scss
│   ├── _header.scss
│   ├── _accordion.scss
│   ├── _selector.scss
│   ├── _viewing.scss
│   ├── _pagination.scss
│   ├── _footer.scss
│   └── _index.scss
├── layout/
│   ├── _container.scss
│   └── _index.scss
├── pages/
│   ├── _home.scss
│   ├── _article.scss
│   ├── _archive.scss
│   ├── _editors.scss
│   ├── _journal.scss
│   └── _thematics.scss
├── themes/
│   └── _default.scss
├── vendors/
│   └── _fonts.scss
└── main.scss
```

### 3.2. Магические числа в `font-size` (`sass/_global.scss:4, 98`)

```scss
html { font-size: 0.694444444vw; }      // ❌ что это?
@media (max-width: 48em) {
  html { font-size: 2.0833333vw; }      // ❌
}
```

`0.694444444 = 100 / 1440 * 10` — это `10px / 1440px * 100`. Нигде не документировано.

**Решение:**
```scss
// abstracts/_variables.scss
$container-max: 1440px;
$root-font-desktop: calc(10 / 1440 * 100% * 1vw); // или использовать clamp()

html { font-size: $root-font-desktop; }
```

Или современнее:
```scss
html { font-size: clamp(10px, 0.694vw, 16px); }
```

### 3.3. Хардкод цветов/значений вместо переменных

| Где | Что | Должно быть |
|---|---|---|
| `_global.scss:13` | `aliceblue` | `variable.$body-bg` |
| `_tools.scss:154` | `#ee5656` | `variable.$main` |
| `_header.scss:269` | `white` | `variable.$white` |
| `_header.scss:453` | `#1f1f1f` | `variable.$dark-deep` |
| `_archive.scss:49`, `_primary.scss:36` | `linear-gradient(135deg, #e8f0ff 0%, #c8d1ea 100%)` | `@include card-gradient;` |
| `_hero.scss:14-20` | `rgba(0,0,0,0.1...0.8)` | функция `@function overlay($a)` |
| `_header.scss:36` | `transition: transform 0.5s ease-in-out, left 0.5s ease-in-out;` | `@include transition((transform, left));` |

### 3.4. Отсутствует debounce/throttle

`js/script.js:127` — поиск:
```js
searchInput.addEventListener('input', function () { ... });
```

`js/viewing.js:49` — scroll:
```js
window.addEventListener('scroll', checkAndAnimate);
```

На каждый `keyup` и каждый `scroll`-tick выполняется фильтрация массива и пересчёт `getBoundingClientRect`.

**Решение** (`abstracts/_utils.js`):
```js
export const debounce = (fn, ms = 200) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export const throttle = (fn, ms = 100) => {
  let last = 0, timer = null;
  return (...args) => {
    const now = Date.now();
    const remain = ms - (now - last);
    if (remain <= 0) { last = now; fn(...args); }
    else { clearTimeout(timer); timer = setTimeout(() => { last = now; fn(...args); }, remain); }
  };
};

// использование
searchInput.addEventListener('input', debounce(handleSearchInput, 200));
window.addEventListener('scroll', throttle(checkAndAnimate, 100), { passive: true });
```

### 3.5. Принудительные reflow в цикле (`js/article.js:14-36`)

```js
for (let i = 0; i < 4; i++) {
  totalHeightPx += items[i].offsetHeight; // ❌ layout thrashing
}
```

Каждое чтение `offsetHeight` вызывает **sync layout**. Если элементов много — видимая задержка.

**Решение** — прочитать всё разом:
```js
const heights = Array.from(items, el => el.offsetHeight);
const minHeight = heights.slice(0, 4).reduce((a, b) => a + b, 0);
const maxHeight = heights.reduce((a, b) => a + b, 0);
```

### 3.6. `ClipboardItem` без feature detection и fallback (`js/article.js:66-71`)

```js
navigator.clipboard.write([
  new ClipboardItem({ ... })
]);
```

В Firefox `ClipboardItem` нет; пользователь получит `ReferenceError`. Нет fallback на `document.execCommand('copy')` и нет обработки `NotAllowedError`.

```js
async function copyToClipboard(text, html) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html':  new Blob([html],  { type: 'text/html'  }),
        }),
      ]);
      return true;
    }
  } catch (e) { /* fall through */ }
  // fallback
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch {}
  ta.remove();
  return false;
}
```

### 3.7. ARIA у аккордеона отсутствует (`js/accordion.js`)

```html
<div class="accordion__trigger">Индексы</div>           <!-- без role="button" -->
<div class="accordion-dropdown">...</div>                <!-- без aria-hidden -->
```

Клавиатурная навигация не работает (Enter/Space). Screen-reader не понимает состояние.

```html
<button type="button"
        class="accordion__trigger"
        aria-expanded="false"
        aria-controls="acc-1-panel"
        id="acc-1-header">
  Индексы
</button>
<div class="accordion-dropdown"
     id="acc-1-panel"
     role="region"
     aria-labelledby="acc-1-header"
     hidden>
  ...
</div>
```

```js
trigger.addEventListener('click', () => toggle(trigger));
trigger.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(trigger); }
});
```

### 3.8. `<label>` не связан с `<input>` (`index.html:85-88` и др.)

```html
<label class="header__content-label">По заголовку:</label>
<input type="text" class="header__content-form" ...>
```

`for`/`id` отсутствует → скринридер не сопоставляет.

```html
<label class="header__content-label" for="search-title">По заголовку:</label>
<input type="text" id="search-title" name="title" class="header__content-form" ...>
```

### 3.9. Дублирование `@keyframes bounceArrow` (`sass/_tools.scss:340` и `sass/section/_editors.scss:137`)

Определено дважды с **разными** значениями (`-0.3rem` vs `-0.5rem`) — последний выиграет по каскаду, что приведёт к «загадочному» поведению анимации. Удалить из `_editors.scss`, оставить одно в `_tools.scss`.

### 3.10. Дублирование `[data-bg-icon="icon-X.png"]` селекторов

В `_archive.scss:71-93` и `_primary.scss:54-76` одни и те же 6 селекторов. **Решение** — цикл `@each`:

```scss
$card-icons: (
  1: 'icon-1.png', 2: 'icon-2.png', 3: 'icon-3.png',
  4: 'icon-4.png', 5: 'icon-5.png', 6: 'icon-6.png',
);

@mixin card-bg-icon($folder) {
  @each $n, $file in $card-icons {
    &[data-bg-icon="#{$file}"]::before {
      background-image: url('../assets/icons/#{$folder}/#{$file}');
    }
  }
}
```

### 3.11. ID-селекторы в CSS (`sass/section/_article.scss:82, 88, 116`)

```scss
#keywords { ... }
#copy-card { ... }
#list-of-sources { ... }
```

ID имеет специфичность `1,0,0` — его невозможно переопределить без `!important`. **Переименовать** в классы: `.article-keywords`, `.article-copy`, `.article-sources`.

### 3.12. Брейкпоинты объявлены строкой и не консистентны

Везде `@media (max-width: 48em)`, но в `_journal.scss:112` — `@media (max-width: 48rem)`. Это **разные** значения (768px vs 480px при корневом 16px). Баг.

### 3.13. Вложенность SCSS > 3 уровней

`_header.scss` — `&__item { &-btn { &.active { p { ... } } } }` + `@media` = 5 уровней. Результирующий селектор нечитаем.

**Правило:** не глубже 3 уровней; модификаторы `--active` — плоско.

### 3.14. Нет `package.json` / сборщика / линтеров

- Нет `npm run dev`, `npm run build`
- Нет минификации CSS/JS
- Нет source maps в проде
- Нет ESLint, Stylelint, Prettier, HTMLhint
- CSS лежит внутри `sass/style.css` — неверное разделение

### 3.15. Favicon объявлен с неверным MIME (`index.html:9-12`)

```html
<link rel="icon" type="image/svg" ...>   <!-- ❌ -->
```

Должно быть `type="image/svg+xml"`. Также отсутствует `apple-touch-icon` и `favicon.ico` для legacy.

---

## 4. СРЕДНИЙ ПРИОРИТЕТ

### 4.1. `<picture>` с закомментированными source (`index.html:174-175` и ещё ~10 мест)

```html
<!-- <source srcset="/assets/img/user/photo.avif" type="image/avif"> -->
<!-- <source srcset="/assets/img/user/photo.webp" type="image/webp"> -->
```

Мёртвый код в проде. Либо подключить форматы, либо удалить.

### 4.2. Заголовок страницы одинаковый на всех 6 страницах

```html
<title>Journal</title>
```

Для SEO и a11y у каждой страницы должен быть уникальный `<title>` и `<meta name="description">`. Например:
- `index.html` → «Известия вузов. ПНД — Главная»
- `article.html` → «Курилова Е. В. и др. — Нелинейная динамика...»

### 4.3. SVG без `aria-hidden="true"` и `focusable="false"`

Сотни `<svg class="..."><use href="..."></use></svg>` без атрибутов доступности. Скринридер пытается их озвучивать.

```html
<svg class="..." aria-hidden="true" focusable="false">
  <use href="..."></use>
</svg>
```

### 4.4. `alt="author_photo"` повторяется для всех изображений

`alt` должен описывать содержание: «Портрет Куриловой Екатерины Викторовны». Иначе — `alt=""` для декоративных.

### 4.5. Шапка-навигация не обёрнута в `<button>` для мобильного меню

`.header__item-btn` — это `<div>`. Использование `cursor: pointer` ≠ кликабельность с клавиатуры.

### 4.6. Формы без `<form>` (`index.html:135-168`)

Форма входа не обёрнута в `<form>`. Не срабатывает Enter-сабмит, браузер не предлагает сохранить пароль, не работает автозаполнение.

```html
<form id="login-form" class="header__content-menu" novalidate>
  ...
  <button type="submit">Войти</button>
</form>
```

### 4.7. Дублирование `document.addEventListener('click', ...)` (`js/script.js:116 и 218`)

Два глобальных клика на документ + ещё в `pagination-selector.js:26`. Это три независимых обработчика на bubble-фазе → сложно отлаживать, легко получить побочные эффекты. Объединить через event-delegation.

### 4.8. `btn.onclick = ...` vs `addEventListener` — несогласованно (`js/article.js:42`)

```js
btn.onclick = () => { ... };                       // ❌ перезапишет предыдущий
copyBtn.addEventListener('click', function() {...}) // ✅
```

Привести всё к `addEventListener`.

### 4.9. `for` вместо современных методов (`js/article.js:18, 29`)

```js
for (let i = 0; i < 4; i++) totalHeightPx += items[i].offsetHeight;
```

```js
const sum = (arr) => arr.reduce((acc, el) => acc + el.offsetHeight, 0);
const minHeight = sum(Array.from(items).slice(0, 4));
const maxHeight = sum(Array.from(items));
```

### 4.10. Пустые `README.md`, `settings.json`, минимальный `.gitignore`

```gitignore
# .gitignore
node_modules/
dist/
.DS_Store
*.log
.env
.env.*
.vscode/
.idea/
```

### 4.11. Имена файлов и папок не по BEM

В SCSS файлах миксины компонентов лежат плоско. Папки `section/` содержат **страницы**, а не секции. Переименовать в `pages/`.

### 4.12. `position: absolute` для шапки (`_header.scss:6`) → перекрывает контент

`.header { position: absolute; }` без `padding-left` у `<main>`. На больших экранах это работает за счёт явных паддингов в hero (`padding: 8rem 48rem 9rem 16rem`) — хрупко. Лучше `position: fixed` + `margin-left` у контейнера.

### 4.13. `:has()` поддерживается не везде (Safari 15.4+, Firefox 121+)

Используется в `_accordion.scss:30`, `_article.scss:56, 63`, `_header.scss:420`. Нужен `@supports` fallback либо JS-класс.

### 4.14. Не используются CSS Custom Properties

Все цвета захардкожены в SCSS. Преимущество CSS variables (тёмная тема, динамика) потеряно.

```scss
:root {
  --color-main: #{$main};
  --color-bg:   #{$body-bg};
  --transition: #{$transition};
}
```

### 4.15. `termLinks` в `script.js` имеет дубликаты (`9-70`)

Элементы с 1 по 8 повторяются с 9 по 15. Зачем?

---

## 5. НИЗКИЙ ПРИОРИТЕТ (пожелания)

1. **Inline-комментарии на русском + разделители `// -----`** (`script.js:145, 228`) — заменить на осмысленные комментарии или вынести в функции.
2. **`href="#"` и `href="/"` placeholder-ссылки** — заменить на реальные или `<button type="button">`.
3. **В `<head>` нет `<meta name="viewport" content="...viewport-fit=cover">`** для notch-устройств.
4. **Нет `<link rel="preconnect">` к шрифтам** (актуально при загрузке с CDN).
5. **`input` без `inputmode`** — на мобильных открывается неправильная клавиатура.
6. **Нет `:focus-visible` глобально.** Добавить в `_base.scss`.
7. **Не используется `clamp()` для типографики** — добавить адаптивности без media-queries.
8. **`window.scrollTo({behavior:'smooth'})` без `prefers-reduced-motion`** (`script.js:166-169`) — нарушение a11y.
9. **Префиксы `-webkit-`, `-moz-`** в `_global.scss:31-33` уже можно убрать (95%+ поддержка).
10. **`picture { display: block; width:100%; height:100%; }`** в `_global.scss:67` — иногда нужно `inline-block`.
11. **Цвет `pagination-background: #ecf1fb`** не согласуется с остальной палитрой — проверить контраст.
12. **Дублирование SVG-спрайтов в каждой странице** — вынести подключение через JS один раз.
13. **`.no-scroll { overflow: scroll }` в мобильном** (`_global.scss:101`) — должно быть `auto`, иначе показывается полоса всегда.
14. **JS разбросан по 5 файлам без модульной системы** — перейти на ES-модули + бандлер.

---

## 6. ПРЕДЛОЖЕНИЕ МИКСИНОВ (с кодом)

Создать `sass/abstracts/_mixins.scss`:

```scss
@use 'variables' as *;

// ─────────────────────────────────────────────
// 1. Breakpoints
// ─────────────────────────────────────────────
$breakpoints: (
  'sm':  48em,   // 768px
  'md':  64em,   // 1024px
  'lg':  90em,   // 1440px
);

@mixin mq($name, $direction: max) {
  $value: map-get($breakpoints, $name);
  @if not $value { @error "Unknown breakpoint `#{$name}`"; }
  @media (#{$direction}-width: $value) { @content; }
}

// мобильный first
@mixin from($name) { @include mq($name, min) { @content; } }
@mixin to($name)   { @include mq($name, max) { @content; } }

// ─────────────────────────────────────────────
// 2. Flex / Grid центрирование
// ─────────────────────────────────────────────
@mixin flex-center($direction: row, $gap: 0) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: $direction;
  @if $gap > 0 { gap: $gap; }
}

@mixin grid-center($cols: 1, $gap: 0) {
  display: grid;
  grid-template-columns: repeat($cols, 1fr);
  place-items: center;
  @if $gap > 0 { gap: $gap; }
}

// ─────────────────────────────────────────────
// 3. Типографика
// ─────────────────────────────────────────────
@mixin font($size: 1.6rem, $weight: 400, $line: 1.4, $family: 'Golos Text') {
  font-family: $family, sans-serif;
  font-size: $size;
  font-weight: $weight;
  line-height: $line;
}

@mixin truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// ─────────────────────────────────────────────
// 4. Кнопка
// ─────────────────────────────────────────────
@mixin button-base {
  -webkit-tap-highlight-color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border: 0;
  border-radius: 10rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: background-color $transition, color $transition, transform $transition;
  &:focus { outline: none; }
  &:focus-visible { outline: 0.3rem solid $main; outline-offset: 0.3rem; }
  &:active { transform: scale(0.98); }
}

@mixin button-variant($bg, $color, $hover: darken($bg, 5%)) {
  background-color: $bg;
  color: $color;
  @media (hover: hover) {
    &:hover { background-color: $hover; }
  }
}

// использование:
// .btn--main { @include button-base; @include button-variant($main, $white, $main-hover); }

// ─────────────────────────────────────────────
// 5. Transition
// ─────────────────────────────────────────────
@mixin transition($props: all, $duration: $transition-duration, $ease: ease) {
  $list: ();
  @each $p in $props { $list: append($list, #{$p $duration $ease}, comma); }
  transition: $list;
}

// ─────────────────────────────────────────────
// 6. Card gradient (вместо повтора в archive/primary)
// ─────────────────────────────────────────────
@mixin card-gradient {
  background-image: linear-gradient(135deg, #{$card-bg-from} 0%, #{$card-bg-to} 100%);
}

// ─────────────────────────────────────────────
// 7. visually-hidden (a11y)
// ─────────────────────────────────────────────
@mixin visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  clip: rect(0 0 0 0); clip-path: inset(50%);
  overflow: hidden; white-space: nowrap;
}

// ─────────────────────────────────────────────
// 8. Reduced motion
// ─────────────────────────────────────────────
@mixin reduced-motion {
  @media (prefers-reduced-motion: reduce) {
    @content;
  }
}
```

`variables.scss`:

```scss
// ── Colors ─────────────────────────────────
$white:                #ffffff;
$dark:                 #282828;
$dark-deep:            #1f1f1f;
$main:                 #ee5656;
$main-hover:           #fd5f5f;
$gray:                 #d8e0f5;
$gray-hover:           #e2eaff;
$non-active:           #616571;
$dark-gray:            #3c3d41;
$dark-gray-hover:      #484b53;
$pagination-bg:        #ecf1fb;
$body-bg:              aliceblue;
$card-bg-from:         #e8f0ff;
$card-bg-to:           #c8d1ea;

// ── Typography ─────────────────────────────
$font-family:          'Golos Text', sans-serif;
$font-size-root:       clamp(10px, 0.694vw, 16px);
$font-weight-regular:  400;
$font-weight-medium:   500;
$font-weight-bold:     700;
$font-weight-black:    900;

// ── Spacing ────────────────────────────────
$gap-xs: 0.5rem;
$gap-sm: 1rem;
$gap-md: 2rem;
$gap-lg: 3rem;
$gap-xl: 5rem;

// ── Layout ─────────────────────────────────
$container-width:      120rem;
$header-width:         12rem;
$header-height:        75rem;
$border-radius:        1.5rem;
$border-radius-pill:   10rem;

// ── Motion ─────────────────────────────────
$transition-duration:  0.3s;
$transition-easing:    ease;
$transition:           $transition-duration $transition-easing;

// ── Z-index scale ──────────────────────────
$z-base:    1;
$z-menu:    10;
$z-overlay: 100;
$z-modal:   1000;
$z-toast:   1100;

// ── Breakpoints (em) ───────────────────────
$bp-sm: 48em;
$bp-md: 64em;
$bp-lg: 90em;
```

---

## 7. УЛУЧШЕННЫЙ КОД (примеры)

### 7.1. HTML: `<div>` → `<button>` + форма + a11y

**Было** (`index.html:135-168`):
```html
<div class="header__content" id="login-content">
  <div class="header__content-menu">
    <div class="header__content-title">Личный кабинет</div>
    <div class="header__content-field">
      <label class="header__content-label">Имя пользователя<span class="required-star">*</span>:</label>
      <input type="text" class="header__content-form" id="login-input" ...>
    </div>
    ...
    <div class="header__content-btn--small btn--main btn" id="login-btn">
      <div class="header__content-text--big">Войти</div>
    </div>
  </div>
</div>
```

**Стало:**
```html
<section class="header__content" id="login-content" aria-labelledby="login-title">
  <div class="header__content-menu">
    <h2 class="header__content-title" id="login-title">Личный кабинет</h2>

    <form class="header__content-form-wrap" id="login-form" novalidate>
      <div class="header__content-field">
        <label class="header__content-label" for="login-input">
          Имя пользователя <span class="required-star" aria-hidden="true">*</span>:
        </label>
        <input type="text"
               id="login-input"
               name="login"
               class="header__content-form"
               placeholder="Введите логин"
               autocomplete="username"
               autocapitalize="off"
               spellcheck="false"
               required>
      </div>

      <div class="header__content-field">
        <label class="header__content-label" for="password-input">
          Пароль <span class="required-star" aria-hidden="true">*</span>:
        </label>
        <input type="password"
               id="password-input"
               name="password"
               class="header__content-form"
               placeholder="Введите пароль"
               autocomplete="current-password"
               required>
      </div>

      <p class="header__content-message" id="login-message" role="alert" aria-live="polite"></p>

      <div class="header__content-btn">
        <button type="submit" class="btn btn--main header__content-btn--small" id="login-btn">
          Войти
        </button>
        <button type="button" class="btn btn--link" id="restore-btn">
          Забыли пароль?
        </button>
        <button type="button" class="btn btn--dark-gray header__content-btn--big" id="register-btn">
          Регистрация
        </button>
      </div>
    </form>
  </div>
</section>
```

### 7.2. SCSS: кнопка через миксины

**Было** (`sass/_tools.scss:284-337` — 53 строки):

**Стало:**
```scss
@use '../abstracts/mixins' as m;
@use '../abstracts/variables' as v;

.btn {
  @include m.button-base;

  &--main      { @include m.button-variant(v.$main,      v.$white, v.$main-hover); }
  &--gray      { @include m.button-variant(v.$gray,      v.$dark,  v.$gray-hover); }
  &--dark-gray { @include m.button-variant(v.$dark-gray, v.$white, v.$dark-gray-hover); }
  &--link {
    background: none;
    color: v.$gray;
    text-decoration: underline dashed v.$main;
    text-underline-offset: 0.3rem;
  }

  &--small { width: 15.3rem; height: 6.4rem; }
  &--big   { width: 20.7rem; height: 6.4rem; }
}
```

### 7.3. SCSS: отступ от магических чисел в `_global.scss`

**Было** (`sass/_global.scss:1-15`):
```scss
@use 'variable';
html { font-size: 0.694444444vw; font-family: 'Golos Text', sans-serif; margin: 0; padding: 0; }
body { margin: 0; padding: 0; background-color: aliceblue; }
```

**Стало:**
```scss
@use './abstracts/variables' as v;

html {
  font-size: v.$font-size-root;          // clamp()
  font-family: v.$font-family;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
  @include m.reduced-motion { scroll-behavior: auto; }
}

body {
  margin: 0;
  background-color: v.$body-bg;
  color: v.$dark;
  min-height: 100vh;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 7.4. JavaScript: модульная авторизация

**Было** — глобальные функции + пароли в коде (`script.js:233-388`).

**Стало** — `js/modules/auth.js`:
```js
/**
 * @module auth
 * Модуль авторизации. Делегирует проверку credential-ов серверу,
 * не хранит пароли на клиенте.
 */

const API_URL = '/api/auth';
const SESSION_KEY = 'journal.session';

/**
 * Возвращает текущую сессию или null.
 * @returns {Promise<{id:number,name:string,surname:string}|null>}
 */
export async function getSession() {
  try {
    const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Логин.
 * @param {string} login
 * @param {string} password
 * @returns {Promise<boolean>} true при успехе
 */
export async function login(login, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });
  return res.ok;
}

/** Логаут. */
export async function logout() {
  await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
}
```

### 7.5. JavaScript: `viewing.js` с throttle + cleanup

**Было** — `js/viewing.js:49` без throttle, без cleanup.

**Стало** — `js/modules/viewing.js`:
```js
import { throttle } from './utils.js';

/**
 * Анимирует счётчик просмотров, когда блок попадает во вьюпорт.
 * @param {HTMLElement} container  блок `.viewing`
 */
export function initViewing(container) {
  if (!container) return;

  const numberEl = container.querySelector('.viewing__number');
  const lineEl   = container.querySelector('.viewing__line');
  if (!numberEl || !lineEl) return;

  const target = parseInt(numberEl.textContent.replace(/\s/g, ''), 10) || 0;
  const DURATION = 1500;
  let rafId = null;
  let started = false;

  /** @param {number} ts */
  function tick(ts) {
    if (!tick.start) tick.start = ts;
    const progress = Math.min((ts - tick.start) / DURATION, 1);
    const eased = 1 - Math.pow(1 - progress, 3);              // easeOutCubic
    numberEl.textContent = format(Math.floor(target * eased));
    lineEl.style.setProperty('--progress', `${eased * 100}%`);
    if (progress < 1) rafId = requestAnimationFrame(tick);
  }
  tick.start = 0;

  /** @param {number} n */
  function format(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function isInView() {
    const r = container.getBoundingClientRect();
    return r.top <= innerHeight && r.bottom >= 0;
  }

  const onScroll = throttle(() => {
    if (!started && isInView()) {
      started = true;
      window.removeEventListener('scroll', onScroll);
      rafId = requestAnimationFrame(tick);
    }
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // cleanup
  return () => {
    window.removeEventListener('scroll', onScroll);
    if (rafId) cancelAnimationFrame(rafId);
  };
}
```

### 7.6. JavaScript: `accordion.js` с a11y

**Стало:**
```js
/**
 * Инициализирует аккордеон с доступностью.
 * @param {HTMLElement} root корень `.accordion`
 */
export function initAccordion(root) {
  if (!root) return;

  const items = root.querySelectorAll('.accordion__list-item');
  items.forEach((item, i) => {
    const trigger = item.querySelector('.accordion__trigger');
    const panel   = item.querySelector('.accordion-dropdown');
    if (!trigger || !panel) return;

    // заворачиваем в button-семантику
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `acc-panel-${i}`);
    panel.id = `acc-panel-${i}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', trigger.id || `acc-trigger-${i}`);
    trigger.id = trigger.id || `acc-trigger-${i}`;

    const toggle = () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      panel.style.maxHeight = !open ? `${panel.scrollHeight}px` : null;
    };

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}
```

### 7.7. JavaScript: `script.js` — разбить на модули

```
js/
├── main.js                  // точка входа
├── modules/
│   ├── auth.js              // авторизация (см. 7.4)
│   ├── header-search.js     // поиск с dropdown
│   ├── header-menu.js       // меню навигации
│   ├── accordion.js
│   ├── viewing.js
│   ├── article-sources.js   // развёртка списка источников
│   ├── clipboard.js         // копирование с fallback
│   ├── selector.js          // год-селектор
│   └── utils.js             // debounce, throttle, isElementInView
```

---

## 8. ДОКУМЕНТАЦИЯ

### 8.1. README.md (см. соседний файл `README.md`)

### 8.2. JSDoc-комментарии — примеры для всех функций проекта

```js
/**
 * @file Модуль поиска по ключевым словам в шапке.
 * @module headerSearch
 */

/**
 * Отрисовывает список подсказок в dropdown.
 * @param {Array<{text:string, link:string}>} items
 * @param {HTMLUListElement} listEl     куда рисовать
 * @param {HTMLInputElement} inputEl    поле ввода (для подстановки)
 * @param {HTMLElement} dropdown        контейнер dropdown
 * @param {HTMLElement} arrow           стрелка-индикатор
 * @returns {void}
 */
function renderDropdown(items, listEl, inputEl, dropdown, arrow) { ... }

/**
 * Фильтрует элементы по строке.
 * @param {Array<{text:string}>} source
 * @param {string} term
 * @returns {Array<{text:string}>}
 */
const filterTerms = (source, term) =>
  source.filter(item => item.text.toLowerCase().includes(term.toLowerCase()));
```

```js
/**
 * @module auth
 */

/**
 * Логин пользователя через серверный API.
 * @param {Object} credentials
 * @param {string} credentials.login
 * @param {string} credentials.password
 * @returns {Promise<{ok:boolean, user?:import('./types').User, error?:string}>}
 * @throws {TypeError} если credentials пустой
 */
export async function login({ login, password }) {
  if (!login || !password) throw new TypeError('Empty credentials');
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });
  if (!res.ok) return { ok: false, error: 'invalid_credentials' };
  return { ok: true, user: await res.json() };
}
```

```js
/**
 * Throttle функции.
 * @param {(...args:any[]) => void} fn
 * @param {number} ms
 * @returns {(...args:any[]) => void}
 */
export const throttle = (fn, ms = 100) => { ... };

/**
 * Проверяет, попал ли элемент во вьюпорт.
 * @param {HTMLElement} el
 * @param {number} [threshold=0] 0..1 доля видимости
 * @returns {boolean}
 */
export const isInViewport = (el, threshold = 0) => {
  const r = el.getBoundingClientRect();
  return r.top <= innerHeight * (1 - threshold) && r.bottom >= 0;
};
```

```js
/**
 * @module accordion
 */

/**
 * Инициализирует один аккордеон.
 * @param {HTMLElement} root   `.accordion`
 * @param {{allowMultiple?: boolean}} [opts]
 * @returns {() => void} функция dispose (снимает слушатели)
 */
export function initAccordion(root, opts = {}) { ... }
```

```js
/**
 * @module clipboard
 */

/**
 * Копирует в буфер с fallback на устаревших браузерах.
 * @param {string} text
 * @param {string} [html]
 * @returns {Promise<boolean>} true при успехе
 */
export async function copyWithFallback(text, html) { ... }
```

### 8.3. Что должно войти в `AGENTS.md` / `.editorconfig` / конфиги

- `.editorconfig` (2-space indent, UTF-8, LF)
- `.prettierrc.json` (`singleQuote: true`, `printWidth: 100`)
- `.eslintrc.json` (eslint:recommended + eslint-plugin-import)
- `.stylelintrc.json` (stylelint-config-standard-scss + stylelint-order)
- `package.json`:

```json
{
  "name": "journal-layout",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint js/ && stylelint sass/**/*.scss",
    "format": "prettier --write .",
    "sass": "sass sass/main.scss dist/css/style.css --style=compressed"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "sass": "^1.70.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard-scss": "^13.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## ПЛАН ИСПРАВЛЕНИЙ (чек-лист)

### Critical (1–3 дня)
- [ ] Убрать пароли из `js/script.js`
- [ ] Заменить `<div class="btn">` / `<div class="header__item-btn">` на `<button>`
- [ ] Восстановить `:focus-visible`
- [ ] Исправить неявный глобал `allContents` (`js/script.js:201`)
- [ ] Удалить дубль `_selector.scss`
- [ ] Привести `48rem` → `48em` в `_journal.scss:112`
- [ ] Обернуть форму входа в `<form>`

### High (1–2 недели)
- [ ] Внедрить 7-1 архитектуру SCSS + миксины (раздел 6)
- [ ] Перевести все магические числа в переменные
- [ ] Заменить ID-селекторы классами
- [ ] Добавить debounce/throttle
- [ ] Переписать accordion/viewing с a11y
- [ ] Рефакторинг JS на ES-модули
- [ ] Внедрить `package.json`, Vite, ESLint, Stylelint, Prettier
- [ ] Шаблонизировать `<header>` (Web Components / Astro / Eleventy)

### Medium (3–4 недели)
- [ ] Уникальные `<title>` + `<meta description>` на каждую страницу
- [ ] `aria-hidden` на декоративных SVG
- [ ] Заменить `alt="author_photo"` на осмысленные
- [ ] CSS Custom Properties для тем
- [ ] Fallback для `:has()`
- [ ] `prefers-reduced-motion` во всех анимациях
- [ ] Адекватные `aria-label` для иконко-кнопок

### Low (постоянно)
- [ ] Кастомные иконки вместо десятков однотипных SVG
- [ ] Inline `width`/`height` для SVG (предотвращает layout shift)
- [ ] `loading="lazy"` на картинки вне первого экрана
- [ ] Тестирование в Lighthouse / Axe / WAVE
- [ ] Написать unit-тесты на JS-модули (Vitest)
- [ ] CI: GitHub Actions — lint + test + build
