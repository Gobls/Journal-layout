# Journal Layout

Фронтенд-макет сайта научного журнала Саратовского государственного университета.

> **Статус:** ветка `01.doc` является прототипом. Клиентская «авторизация» из `js/script.js` запрещена для production. Логины, пароли, roles и проверка доступа должны находиться только на server side.

## Описание

Проект содержит статические HTML-страницы, SCSS и JavaScript для:

- меню шапки;
- поиска/autocomplete;
- отображения профиля;
- accordion редакционной коллегии;
- выбора года архива;
- раскрытия списка источников;
- копирования citation;
- анимации счётчика просмотров.

Production-данные должны поступать из CMS/API или генерироваться server/SSG. Users и article metadata нельзя хардкодить в клиентском коде как источник истины.

## Страницы

| Файл | Назначение |
|---|---|
| `index.html` | Главная страница журнала |
| `archive.html` | Архив выпусков и выбор года |
| `article.html` | Страница научной публикации |
| `editors.html` | Редакционная коллегия |
| `journal.html` | Содержание конкретного выпуска |
| `thematics.html` | Цели и тематика журнала |

Каждая страница обязана иметь `doctype`, корректный `lang`, UTF-8, viewport, уникальный `<title>`, один ясный `h1`, `<main id="main-content">` и skip link.

## Текущая структура

```text
.
├── assets/
├── js/
│   ├── accordion.js
│   ├── article.js
│   ├── pagination-selector.js
│   ├── script.js
│   └── viewing.js
├── sass/
│   ├── section/
│   │   ├── _archive.scss
│   │   ├── _article.scss
│   │   ├── _editors.scss
│   │   ├── _hero.scss
│   │   ├── _journal.scss
│   │   ├── _primary.scss
│   │   └── _thematics.scss
│   ├── _accordion.scss
│   ├── _card.scss
│   ├── _fonts.scss
│   ├── _footer.scss
│   ├── _global.scss
│   ├── _header.scss
│   ├── _pagination.scss
│   ├── _selector.scss
│   ├── _tools.scss
│   ├── _variable.scss
│   ├── _viewing.scss
│   ├── style.css
│   ├── style.css.map
│   └── style.scss
├── archive.html
├── article.html
├── editors.html
├── index.html
├── journal.html
├── settings.json
└── thematics.html
```

### Известные архитектурные проблемы

- `script.js` объединяет независимые responsibilities;
- `_tools.scss` смешивает utilities, components, typography и animations;
- `_selector.scss` не импортируется из `style.scss`;
- page partials дублируют общие patterns;
- отсутствуют package scripts, lint, tests и CI;
- client-side user database небезопасна.

## Рекомендуемая структура

```text
.
├── public/
│   └── assets/
├── src/
│   ├── html/
│   │   ├── layouts/
│   │   ├── partials/
│   │   └── pages/
│   ├── js/
│   │   ├── components/
│   │   │   ├── accordion.js
│   │   │   ├── autocomplete.js
│   │   │   ├── header-menu.js
│   │   │   ├── login-form.js
│   │   │   └── viewing-counter.js
│   │   ├── services/
│   │   │   └── auth-client.js
│   │   ├── utils/
│   │   │   ├── debounce.js
│   │   │   └── dom.js
│   │   └── main.js
│   └── scss/
│       ├── abstracts/
│       │   ├── _tokens.scss
│       │   ├── _functions.scss
│       │   ├── _mixins.scss
│       │   └── _index.scss
│       ├── base/
│       │   ├── _reset.scss
│       │   ├── _fonts.scss
│       │   ├── _typography.scss
│       │   └── _global.scss
│       ├── layout/
│       │   ├── _container.scss
│       │   ├── _header.scss
│       │   └── _footer.scss
│       ├── components/
│       │   ├── _accordion.scss
│       │   ├── _button.scss
│       │   ├── _card.scss
│       │   ├── _form.scss
│       │   ├── _pagination.scss
│       │   └── _viewing.scss
│       ├── pages/
│       │   ├── _archive.scss
│       │   ├── _article.scss
│       │   ├── _editors.scss
│       │   ├── _home.scss
│       │   ├── _journal.scss
│       │   └── _thematics.scss
│       ├── utilities/
│       │   ├── _accessibility.scss
│       │   └── _layout.scss
│       └── main.scss
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── eslint.config.js
├── stylelint.config.mjs
├── playwright.config.js
└── README.md
```

## HTML

### Семантика

- переход — `<a href>`;
- действие — `<button>`;
- ввод — `<input>`, `<textarea>`, `<select>`;
- простое раскрытие — `<details>/<summary>`;
- самостоятельная публикация/карточка — `<article>`;
- раздел — `<section aria-labelledby>`;
- дата — `<time datetime>`.

Clickable `div` запрещены. `role="button"` применяется только когда нативный control объективно невозможен.

### Формы

Каждый control имеет:

- `id`;
- связанный `<label for>`;
- `name`;
- корректный `type`;
- `autocomplete`;
- `required`/validation;
- связанное сообщение ошибки.

Ошибки объявляются через `role="status"`/`aria-live`.

### SVG

Декоративный SVG:

```html
<svg aria-hidden="true" focusable="false">...</svg>
```

Icon-only button получает accessible name на button.

### BEM

```text
.block
.block__element
.block--modifier
.block__element--modifier
.is-open
.is-active
.u-visually-hidden
```

JS hooks размещаются в `data-*`. ID не используются для CSS specificity. SCSS nesting — максимум 3 уровня.

## SCSS

### Tokens

```scss
$colors: (...);
$breakpoints: (...);
$spacing: (...);
$radii: (...);
$durations: (...);
$z-layers: (...);
```

Названия должны быть семантическими: `primary`, `border`, `text-muted`, `surface`, а не `$main/$gray`.

### Functions

```scss
@function color($name) { ... }
@function space($step) { ... }
@function rem($pixels, $base: 16) { ... }
```

Неизвестные keys должны вызывать `@error`.

### Mixins

Обязательные mixins:

- `mq()` — breakpoints;
- `text-style()` — typography;
- `button-base()`/`button-variant()`;
- `flex-center()`/`grid-center()`;
- `focus-ring()`;
- `visually-hidden()`;
- `reduced-motion()`.

### Безопасная глобальная база

```scss
html { font-size: 100%; }
body { margin: 0; min-block-size: 100vh; }
img, svg { display: block; max-inline-size: 100%; }
img { block-size: auto; }
```

Не задавать `height: 100%` и `object-fit: cover` всем изображениям.

### Container

```scss
.container {
  inline-size: min(100% - 3.2rem, 120rem);
  margin-inline: auto;
}
```

### Запрещено

- component-level `!important`;
- `outline: none` без `:focus-visible`;
- nesting > 3;
- необъяснённые magic numbers;
- fixed height для dynamic text;
- дублирование keyframes;
- обязательная логика только через `:has()` без browser policy/fallback.

## JavaScript

Скрипты подключаются как modules:

```html
<script type="module" src="./js/main.js"></script>
```

Каждый component принимает root и возвращает cleanup:

```js
/**
 * @param {HTMLElement} root
 * @returns {() => void}
 */
export function initComponent(root) {
  const controller = new AbortController();
  // listeners with { signal: controller.signal }
  return () => controller.abort();
}
```

### Правила

- safe early return при неполной разметке;
- DOM hooks — `data-*`;
- async workflow — `try/catch/finally`;
- event delegation для dynamic lists;
- debounce/throttle/observer для frequent events;
- listener/observer/timer/RAF cleanup;
- `Intl.NumberFormat` для numbers;
- no implicit globals;
- strict equality;
- JSDoc или TypeScript.

## Авторизация

Frontend:

- отправляет credentials server-у;
- не содержит базу users;
- не принимает access decisions;
- не хранит trusted auth state в localStorage;
- отображает профиль, полученный из API.

Backend:

- проверяет password hash;
- устанавливает HttpOnly/Secure/SameSite cookie;
- проверяет права на каждом protected endpoint;
- применяет CSRF protection, rate limiting и audit logging.

## Запуск текущего прототипа

```bash
python3 -m http.server 8080
```

Открыть `http://localhost:8080/`. Не использовать `file://`: modules, fetch, clipboard и SVG resources могут вести себя иначе.

SCSS уже имеет `sass/style.css`, но процесс сборки текущей ветки не документирован.

## Рекомендуемый toolchain

```bash
npm install --save-dev \
  sass eslint prettier stylelint stylelint-config-standard-scss \
  html-validate @playwright/test @axe-core/playwright lighthouse
```

Пример scripts после переноса структуры:

```json
{
  "scripts": {
    "dev:css": "sass --watch src/scss/main.scss:public/css/main.css",
    "build:css": "sass --style=compressed --no-source-map src/scss/main.scss:public/css/main.css",
    "lint:html": "html-validate \"src/**/*.html\"",
    "lint:scss": "stylelint \"src/**/*.scss\"",
    "lint:js": "eslint \"src/**/*.js\"",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:e2e": "playwright test",
    "test": "npm run lint:html && npm run lint:scss && npm run lint:js && npm run test:e2e",
    "build": "npm run build:css"
  }
}
```

## Доступность

Acceptance criteria:

- интерфейс доступен keyboard-only;
- focus всегда видим;
- icon-only buttons имеют names;
- disclosure controls сообщают expanded state;
- Escape закрывает overlays;
- focus возвращается trigger;
- фон overlay не фокусируется;
- form errors объявляются;
- contrast соответствует WCAG AA;
- zoom 200% не скрывает content;
- 320 CSS px без горизонтального scroll;
- `prefers-reduced-motion` учитывается;
- alt корректны;
- nav landmarks имеют names;
- есть skip link.

## Безопасность

Запрещено:

- passwords в JS/HTML/JSON;
- localStorage как proof of auth;
- доверять ID/role клиента;
- реальные secrets в Git;
- вставлять untrusted HTML;
- показывать success до подтверждения API.

Обязательно: HTTPS, server authorization, password hashing, protected cookies, CSRF, CSP, rate limiting, validation, escaping, dependency audit.

## Поддерживаемые браузеры

Browser matrix утверждается продуктом. Рекомендуемый baseline:

- последние 2 Chrome/Edge;
- последние 2 Firefox;
- последние 2 Safari;
- актуальные iOS Safari и Android Chrome.

Если нужны старые WebView/browser, `:has()`, Clipboard API и другие features требуют fallback.

## Контроль качества

PR блокируется, если:

- lint не прошёл;
- HTML невалиден;
- axe показывает serious/critical;
- tests падают;
- visual regression не подтверждён;
- performance budgets нарушены;
- в diff найдены credentials;
- data contract изменён без schema/test.

Ручная матрица: keyboard, screen-reader smoke, 320/375/768/1024/1440, zoom 200%, reduced motion, forced colors, slow network, JS disabled, API errors, long content, missing images, empty/large datasets.

## Definition of Done

- [ ] Нет client-side credentials.
- [ ] Все controls нативны или соответствуют accessible pattern.
- [ ] Один ясный `h1` на страницу.
- [ ] Forms имеют labels и server endpoint.
- [ ] Article metadata проходят schema validation.
- [ ] SCSS использует tokens/mixins/functions.
- [ ] Nesting ≤ 3.
- [ ] Нет component-level `!important`.
- [ ] Нет необъяснённых magic numbers.
- [ ] JavaScript разделён на ES modules.
- [ ] Init functions безопасны при отсутствии root.
- [ ] Listeners/observers/timers имеют cleanup.
- [ ] Async errors обработаны.
- [ ] Есть lint, tests и CI.
- [ ] README описывает реальную сборку.
- [ ] Accessibility acceptance выполнен.
- [ ] Browser matrix утверждён.
