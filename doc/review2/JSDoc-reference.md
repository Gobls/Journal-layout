# JSDoc для JavaScript-функций проекта

Документ покрывает все существующие именованные функции ветки `01.doc`. Комментарии можно вставить как промежуточное улучшение, но они не исправляют небезопасную архитектуру: client-side auth и часть DOM-логики нужно переписать.

---

## `js/script.js`

### `showDropdownItems`

```js
/**
 * Перерисовывает список вариантов autocomplete.
 *
 * Side effects:
 * - очищает dropdown;
 * - создаёт DOM-элементы;
 * - подключает выбор результата;
 * - изменяет значение и placeholder search input.
 *
 * @param {{text: string, link: string}[]} itemsArray
 *   Варианты поиска. `text` отображается, `link` задаёт URL.
 * @returns {void}
 */
function showDropdownItems(itemsArray) {
  // ...
}
```

**Рефакторинг:** передавать DOM dependencies, использовать `replaceChildren()` и event delegation. Пустой link нельзя превращать в `#`.

### `manageClass`

```js
/**
 * Изменяет CSS-класс у выбранной content panel.
 *
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} elements Возможные panels.
 * @param {string} className Изменяемый класс.
 * @param {'add'|'remove'|'toggle'} action Операция classList.
 * @returns {void}
 */
function manageClass(elements, className, action) {
  // ...
}
```

**Рефакторинг:** удалить динамический `classList[action]`; target определять через `aria-controls`/`data-target`, не через localStorage.

### `closeAllMenus`

```js
/**
 * Закрывает все панели шапки и восстанавливает состояние документа.
 *
 * Side effects:
 * - удаляет state classes у panels/triggers;
 * - снимает overlay;
 * - разблокирует body scroll;
 * - должен сбрасывать индекс active panel;
 * - должен обновлять `aria-expanded` и возвращать focus trigger.
 *
 * @returns {void}
 */
function closeAllMenus() {
  // ...
}
```

### `initAuthHandlers`

```js
/**
 * Подключает обработчики формы входа и кнопки выхода.
 *
 * @returns {void}
 * @throws {Error} В текущей реализации падает при отсутствии DOM-элементов.
 */
function initAuthHandlers() {
  // ...
}
```

**Рефакторинг:** заменить на `initLoginForm(form)` и `initLogoutButton(button)`, возвращающие cleanup. Login обрабатывать по `submit`, не `click`.

### `handleLogin`

```js
/**
 * Обрабатывает попытку входа.
 *
 * Side effects:
 * - читает fields;
 * - показывает validation message;
 * - меняет auth state;
 * - очищает form;
 * - обновляет DOM.
 *
 * @returns {void}
 */
function handleLogin() {
  // ...
}
```

**Критично:** текущую функцию удалить. Новая версия должна быть `async`, принимать `SubmitEvent`, обращаться к server API и использовать `try/catch/finally`.

### `handleLogout`

```js
/**
 * Завершает текущую пользовательскую сессию и обновляет UI.
 *
 * @returns {void}
 */
function handleLogout() {
  // ...
}
```

**Критично:** удаление localStorage не завершает session. Нужен `DELETE /api/session`.

### `updateAuthState`

```js
/**
 * Синхронизирует UI профиля с server session state.
 *
 * @param {{
 *   id: string|number,
 *   surname: string,
 *   name: string,
 *   patronymic?: string,
 *   photo?: string
 * }|null} [user=currentUser] Безопасный профиль, полученный от API.
 * @returns {void}
 */
function updateAuthState(user = currentUser) {
  // ...
}
```

Функция обязана обрабатывать и `user`, и `null`, проверять все DOM nodes и не доверять произвольному image URL.

---

## `js/article.js`

### `calculateMinHeight`

```js
/**
 * Вычисляет суммарную высоту первых четырёх элементов списка источников.
 *
 * @returns {number} Высота в rem или `0`, если элементов меньше четырёх.
 */
function calculateMinHeight() {
  // ...
}
```

**Рефакторинг:** удалить layout measurement и magic offsets; скрывать лишние list items через `hidden`.

### `calculateMaxHeight`

```js
/**
 * Вычисляет суммарную высоту всех элементов списка источников.
 *
 * @returns {number} Высота в rem.
 */
function calculateMaxHeight() {
  // ...
}
```

**Рефакторинг:** удалить. Расчёт устаревает после resize/font loading и ненадёжно учитывает gaps/margins.

### `showCopySuccess`

```js
/**
 * Временно заменяет label кнопки сообщением об успешном копировании.
 *
 * @param {HTMLButtonElement} button Кнопка копирования.
 * @returns {void}
 */
function showCopySuccess(button) {
  // ...
}
```

Вызывать только после успешного `await navigator.clipboard...`; предусмотреть error state и очистку timeout.

---

## `js/viewing.js`

### `formatNumberWithSpaces`

```js
/**
 * Форматирует число с локализованными разделителями разрядов.
 *
 * @param {number} num Число для форматирования.
 * @returns {string} Локализованная строка.
 */
function formatNumberWithSpaces(num) {
  return new Intl.NumberFormat('ru-RU').format(num);
}
```

### `animateNumber`

```js
/**
 * Выполняет один кадр animation counter и планирует следующий.
 *
 * Side effects:
 * - изменяет textContent;
 * - обновляет CSS custom property progress;
 * - создаёт requestAnimationFrame.
 *
 * @param {DOMHighResTimeStamp} timestamp Время текущего frame.
 * @returns {void}
 */
function animateNumber(timestamp) {
  // ...
}
```

Хранить RAF ID, поддерживать cleanup/reduced motion и валидировать target/duration.

### `isElementInViewport`

```js
/**
 * Проверяет частичное пересечение элемента с viewport.
 *
 * @param {Element} el Проверяемый элемент.
 * @returns {boolean} `true`, когда элемент хотя бы частично видим.
 */
function isElementInViewport(el) {
  // ...
}
```

**Рефакторинг:** заменить на `IntersectionObserver`, чтобы не делать `getBoundingClientRect()` на каждом scroll.

### `checkAndAnimate`

```js
/**
 * Однократно запускает анимацию после появления компонента во viewport.
 *
 * @returns {void}
 */
function checkAndAnimate() {
  // ...
}
```

После запуска удалить scroll listener; предпочтительно заменить observer callback.

---

## Анонимные callbacks, которые нужно именовать

Callbacks с самостоятельной логикой должны стать functions, чтобы их можно было документировать и тестировать.

```text
script.js
├── initHeader
├── handleSearchFocus
├── handleSearchInput
├── handleSearchOutsideClick
├── handleDropdownSelection
├── handleMenuTriggerClick
├── handleMenuCloseClick
├── handleHeaderOutsideClick
└── restoreSession

article.js
├── handleSourcesToggle
└── handleCitationCopy

accordion.js
├── initAccordion
└── handleAccordionToggle

pagination-selector.js
├── initYearSelector
├── handleYearSelectorToggle
├── handleYearSelection
└── handleYearSelectorOutsideClick

viewing.js
└── handleViewingIntersection
```

## Универсальный JSDoc для init-функций

```js
/**
 * Инициализирует UI-компонент внутри root.
 *
 * Требования:
 * - безопасный early return при неполной разметке;
 * - отсутствие лишних global selectors;
 * - listeners через AbortController;
 * - cleanup observers/timers/RAF.
 *
 * @param {HTMLElement} root Корневой элемент компонента.
 * @returns {() => void} Функция освобождения ресурсов.
 */
export function initComponent(root) {
  const controller = new AbortController();
  // ...
  return () => controller.abort();
}
```

## JSDoc для async API

```js
/**
 * Отправляет запрос на server API.
 *
 * @param {RequestData} payload Проверенные данные.
 * @param {AbortSignal} [signal] Сигнал отмены.
 * @returns {Promise<ResponseData>} Проверенный ответ.
 * @throws {ApiError} При network/server/schema error.
 */
async function request(payload, signal) {
  // ...
}
```

## Typedefs

```js
/**
 * @typedef {Object} SearchItem
 * @property {string} text Отображаемый текст.
 * @property {string} url Валидный URL результата.
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id Непрозрачный ID.
 * @property {string} displayName Отображаемое имя.
 * @property {string|null} photoUrl URL аватара или `null`.
 */

/**
 * @typedef {Object} ArticleData
 * @property {string} id ID публикации.
 * @property {string} title Заголовок.
 * @property {string} abstract Аннотация.
 * @property {string[]} keywords Ключевые слова.
 * @property {string} doi DOI.
 * @property {string} citation Строка цитирования.
 */
```

## Правила JSDoc проекта

1. Не повторять имя функции обычными словами.
2. Указывать `@returns {void}` для functions без результата.
3. Для async указывать `Promise<...>` и `@throws`.
4. Документировать DOM/storage/history side effects.
5. Для init-функций документировать cleanup.
6. Не использовать generic `Object`/`Array` без структуры.
7. Общие contracts выносить в `@typedef` или TypeScript.
8. Рекомендуется включить `// @ts-check` + `checkJs` либо перевести modules на TypeScript.
