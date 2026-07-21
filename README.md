# Journal-layout

Лендинг научного журнала **«Известия высших учебных заведений. Прикладная нелинейная динамика»** (СГУ им. Н. Г. Чернышевского).
Статичная многостраничная вёрстка: HTML + SCSS + ванильный JavaScript.

> Ревью кода проекта — в [`doc/review.md`](./doc/review.md).

---

## Описание

Проект представляет собой 6 связанных страниц:

| Страница | Файл | Назначение |
|---|---|---|
| Главная | `index.html` | Лендинг с навигацией по разделам |
| Журнал (выпуск) | `journal.html` | Содержание конкретного выпуска |
| Статья | `article.html` | Карточка научной статьи |
| Архив | `archive.html` | Архив выпусков по годам |
| Редакция | `editors.html` | Редакционная коллегия |
| Тематика | `thematics.html` | Цели и тематика журнала |

Все страницы используют единую шапку с переключателем языка, поиском, формой входа и пользовательским меню.

---

## Структура проекта

```
Journal-layout/
├── index.html / article.html / archive.html
├── editors.html / journal.html / thematics.html
├── assets/
│   ├── fonts/                  # Golos Text (Regular, Medium, DemiBold, Bold, Black)
│   ├── icons/                  # SVG-спрайты, favicon, иконки разделов
│   └── img/                    # фон, фото пользователей и редакторов
├── sass/
│   ├── style.scss              # точка входа (@use всех партиалов)
│   ├── _variable.scss          # цвета, переходы
│   ├── _fonts.scss             # @font-face
│   ├── _global.scss            # reset + базовые стили
│   ├── _header.scss            # шапка + боковые меню
│   ├── _footer.scss
│   ├── _card.scss              # базовая карточка
│   ├── _accordion.scss         # аккордеон (редакторы)
│   ├── _pagination.scss        # пагинация + год-селектор
│   ├── _selector.scss          # ⚠️ дубль _pagination (подлежит удалению)
│   ├── _viewing.scss           # счётчик просмотров
│   ├── _tools.scss             # утилитарные классы: .btn, .text, .svg, .link
│   ├── section/                # page-specific стили
│   │   ├── _hero.scss          # герой-блок (общий)
│   │   ├── _primary.scss       # index.html
│   │   ├── _article.scss       # article.html
│   │   ├── _archive.scss       # archive.html
│   │   ├── _journal.scss       # journal.html
│   │   ├── _editors.scss       # editors.html
│   │   └── _thematics.scss     # thematics.html
│   └── style.css / .map        # собранный CSS (лежит в sass/, требует переноса в dist/)
├── js/
│   ├── script.js               # шапка + авторизация + поиск
│   ├── accordion.js            # аккордеон
│   ├── article.js              # развёртка источников + копирование
│   ├── pagination-selector.js  # год-селектор
│   └── viewing.js              # анимация счётчика просмотров
├── doc/
│   └── review.md               # детальное ревью кода
└── README.md                   # этот файл
```

---

## Используемые технологии

- **HTML5** — семантическая разметка
- **SCSS (Dart Sass)** — стилизация (частичная реализация 7-1 pattern)
- **Vanilla JavaScript (ES6+)** — без фреймворков
- **SVG sprites** — иконки
- **localStorage** — сохранение сессии пользователя (требует замены на серверную)

---

## Переменные SCSS

В `sass/_variable.scss` определены:

```scss
// Цвета
$white:                 #FFF;
$dark:                  #282828;
$main:                  #ee5656;   // основной бренд-цвет
$main-hover:            #fd5f5f;
$gray:                  #d8e0f5;
$gray-hover:            #e2eaff;
$non-active:            #616571;
$dark-gray:             #3c3d41;
$dark-gray-hover:       #484b53;
$pagination-background: #ecf1fb;

// Переходы
$transition:            0.5s ease;
```

Использование в партиалах:

```scss
@use 'variable';
.button {
  background-color: variable.$main;
  transition: background-color variable.$transition;
}
```

> Полный набор рекомендуемых переменных (типографика, отступы, z-index, брейкпоинты) — в `doc/review.md`, раздел 6.

---

## Миксины (текущее состояние)

На текущий момент **миксины отсутствуют**. Все стили реализованы напрямую через BEM-классы, что приводит к дублированию (особенно у кнопок, breakpoints, градиентов карточек).

**Рекомендованный набор миксинов** (с кодом) — в `doc/review.md`, раздел 6:
- `mq($name, $direction)` — медиа-запросы
- `flex-center($direction, $gap)` — flex-центрирование
- `font($size, $weight, $line)` — типографика
- `button-base` / `button-variant($bg, $color, $hover)` — кнопки
- `transition($props)` — переходы
- `card-gradient` — градиент карточек
- `visually-hidden` — доступное скрытие
- `reduced-motion` — поддержка `prefers-reduced-motion`

---

## Функции SCSS

В проекте **пользовательские функции не определены**. Рекомендуется добавить в `sass/abstracts/_functions.scss`:

```scss
@function rem($px, $base: 16px) {
  @return math.div($px, $base) * 1rem;
}

@function color-yiq($color) {
  $r: red($color); $g: green($color); $b: blue($color);
  @return if(($r * 0.299 + $g * 0.587 + $b * 0.114) >= 150, #000, #fff);
}
```

---

## JavaScript модули

| Файл | Назначение | Глобальные слушатели |
|---|---|---|
| `script.js` | Шапка: меню, поиск с dropdown, авторизация | `DOMContentLoaded` ×2, `click` ×2, `input` |
| `accordion.js` | Раскрытие секций аккордеона | `DOMContentLoaded`, `click` на триггерах |
| `article.js` | Сворачивание списка источников + копирование | `DOMContentLoaded`, `click` |
| `pagination-selector.js` | Год-селектор | `DOMContentLoaded`, `click` ×2 |
| `viewing.js` | Анимация счётчика при появлении во вьюпорте | `DOMContentLoaded`, `scroll` |

> Текущая реализация использует `var`-free стиль, но **без ES-модулей**. Каждый файл — глобальный IIFE через `DOMContentLoaded`. Подробный разбор и рефакторинг — в `doc/review.md`.

---

## Запуск

Проект **не имеет системы сборки**. Достаточно открыть `index.html` в браузере или поднять любой статический сервер:

```bash
# Python 3
python -m http.server 8000

# Node.js (без зависимостей)
npx serve .

# VS Code
# Live Server extension
```

Для разработки SCSS:

```bash
# Установить Dart Sass
sass --watch sass/style.scss sass/style.css --style=expanded
```

> Рекомендация: мигрировать на Vite (см. `doc/review.md`, раздел 8.3).

---

## Браузерная поддержка

Поддерживаются современные браузеры (последние 2 версии):

- Chrome / Edge
- Firefox
- Safari

Используются современные CSS-фичи, требующие проверки:
- `:has()` — Safari 15.4+, Firefox 121+, Chrome 105+
- `inset` — везде, кроме IE
- `gap` для flexbox — Chrome 84+, Safari 14.1+

Для старых браузеров требуется fallback (см. `doc/review.md` §4.13).

---

## Известные проблемы

Подробный список — в [`doc/review.md`](./doc/review.md). Основные:

- ❌ Учётные данные хранятся в исходниках `js/script.js`
- ❌ Шапка дублируется на 6 страницах (нет шаблонизации)
- ❌ `<div>` используется вместо `<button>` для интерактивных элементов
- ❌ `outline: none` без замены (нарушение WCAG)
- ❌ Дублирование `_selector.scss` и части `_pagination.scss`
- ❌ Нет `package.json`, сборщика, линтеров
- ❌ Магические числа в CSS без переменных

---

## Лицензия

© 2013–2026 ФГБОУ ВО «Саратовский национальный исследовательский
государственный университет имени Н. Г. Чернышевского».
