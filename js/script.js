document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.header');
    const searchInput = document.getElementById('searchInput');
    if (!header) return;
    const dropdownList = header.querySelector('.header__dropdown-list');
    const dropdown = header.querySelector('.header__dropdown');
    const arrow = header.querySelector('.header__content-arrow');

    const termLinks = [
        {
            text: "ансамбли нелинейных осцилляторов",
            link: ""
        },
        {
            text: "нейронные сети",
            link: ""
        },
        {
            text: "азимутальная неоднородность",
            link: ""
        },
        {
            text: "динамическая система",
            link: ""
        },
        {
            text: "бифуркация",
            link: ""
        },
        {
            text: "теория колебаний",
            link: ""
        },
        {
            text: "вращательное движение",
            link: ""
        },
        {
            text: "линейная функция",
            link: ""
        },
        {
            text: "ансамбли нелинейных осцилляторов",
            link: ""
        },
        {
            text: "нейронные сети",
            link: ""
        },
        {
            text: "азимутальная неоднородность",
            link: ""
        },
        {
            text: "динамическая система",
            link: ""
        },
        {
            text: "бифуркация",
            link: ""
        },
        {
            text: "теория колебаний",
            link: ""
        },
        {
            text: "вращательное движение",
            link: ""
        }
    ];

    // Функция для отображения элементов спискa
    function showDropdownItems(itemsArray) {
        dropdownList.innerHTML = '';

        if (itemsArray.length === 0) {
            const li = document.createElement('li');
            li.className = 'header__dropdown-item';
            li.textContent = 'Ничего не найдено';
            dropdownList.appendChild(li);
            return;
        }

        itemsArray.forEach(term => {
            const li = document.createElement('li');
            li.className = 'header__dropdown-item';

            const a = document.createElement('a');
            a.className = 'header__dropdown-link';
            a.href = term.link || '#';
            a.textContent = term.text;

            a.addEventListener('click', function (e) {
                e.preventDefault();
                searchInput.value = term.text;
                searchInput.placeholder = "Выбрать из списка";
                dropdown.classList.remove('show');
                arrow.classList.remove('active');
            });

            li.appendChild(a);
            dropdownList.appendChild(li);
        });
    }

    // Показываем все элементы при клике на поле ввода
    searchInput.addEventListener('click', function () {
        this.placeholder = "Начните вводить слово";
        showDropdownItems(termLinks);
        dropdown.classList.add('show');
        arrow.classList.add('active');
    });


    // Скрываем список при клике вне поля
    document.addEventListener('click', function (event) {
        if (!searchInput.contains(event.target) && !dropdownList.contains(event.target)) {
            dropdown.classList.remove('show');
            arrow.classList.remove('active');
            if (!searchInput.value.trim()) {
                searchInput.placeholder = "Выбрать из списка";
            }
        }
    });

    // Фильтрация при вводе текста
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();

        if (searchTerm.length === 0) {
            // Показываем все элементы при пустом поле
            showDropdownItems(termLinks);
            dropdown.classList.remove('show'); // Скрываем dropdown при пустом поле
        } else {
            // Фильтруем по полю text в объектах
            const filteredItems = termLinks.filter(item =>
                item.text.toLowerCase().includes(searchTerm)
            );
            showDropdownItems(filteredItems);
            dropdown.classList.add('show'); // Показываем dropdown
        }
    });


    //  ------------------------------------------------------------------------------------------------------------------------------


    const menuItems = header.querySelectorAll('.header__item');
    const contentItems = header.querySelectorAll('.header__content-item');
    const closeBtns = header.querySelectorAll('.header__content-close');
    const menuBtns = header.querySelectorAll('.header__item-btn');
    console.log(menuBtns)
    let closeIndex = null;


    menuItems.forEach((item, index) => {
        const menuBtn = item.querySelector('.header__item-btn');
        menuBtn.addEventListener('click', function () {
            const content = contentItems[index].querySelectorAll('.header__content');
            if (content.length > 1) {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    content[1].classList.toggle('active');
                } else {
                    content[0].classList.toggle('active');
                }
            } else {
                content[0].classList.toggle('active');
            }
            menuBtn.classList.toggle('active');
            if (closeIndex != null && closeIndex != index) {
                menuBtns[closeIndex].classList.remove('active');
                const closeContent = contentItems[closeIndex].querySelectorAll('.header__content');
                setTimeout(() => {
                    if (closeContent.length > 1) {
                        const savedUser = localStorage.getItem('currentUser');
                        if (savedUser) {
                            closeContent[1].classList.remove('active');
                        } else {
                            closeContent[0].classList.remove('active');
                        }
                    } else {
                        closeContent[0].classList.remove('active');
                    }
                }, 500);
            }
            closeIndex = index;
        });
    });

    // Обработчики для кнопок закрытия
    closeBtns.forEach((closeBtn, index) => {
        closeBtn.addEventListener('click', function () {
            closeAllMenus();
        });
    });


    allContents = document.querySelectorAll('.header__content');
    // Функция закрытия всех меню
    function closeAllMenus() {
        allContents.forEach(items => {
            items.classList.remove('active');
        });

        document.querySelectorAll('.header__item-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // Закрытие по клику вне меню
    document.addEventListener('click', function (event) {
        const isMenuBtn = event.target.closest('.header__item-btn');
        const isMenuContent = event.target.closest('.header__content');

        if (!isMenuBtn && !isMenuContent) {
            closeAllMenus();
        }
    });


    //  ------------------------------------------------------------------------------------------------------------------------------

});

// База данных пользователей
const usersDatabase = [
    {
        id: 1,
        login: '1',
        password: '1',
        surname: 'Иванов',
        name: 'Алексей',
        patronymic: 'Иванович',
        photo: ''
    },
    {
        id: 2,
        login: '2',
        password: '2',
        surname: 'Петров',
        name: 'Дмитрий',
        patronymic: 'Алексеевич',
        photo: ''
    },
    {
        id: 3,
        login: '3',
        password: '3',
        surname: 'Сидорова',
        name: 'Мария',
        patronymic: 'Витальевна',
        photo: ''
    },
    {
        id: 4,
        login: '4',
        password: '4',
        surname: 'Петров',
        name: 'Петр',
        patronymic: 'Петрович',
        photo: 'user1.jpg'
    }
];

// Текущий авторизованный пользователь
let currentUser = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Проверяем сохраненную сессию
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthState();
    }
    // Инициализируем обработчики событий
    initAuthHandlers();
});

// Инициализация всех обработчиков
function initAuthHandlers() {
    const loginSubmit = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Вход в систему
    loginSubmit.addEventListener('click', handleLogin);

    // Выход из системы
    logoutBtn.addEventListener('click', handleLogout);
}

// Функция входа
function handleLogin() {
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password-input');

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();


    // Валидация
    if (!login || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }

    // Поиск пользователя
    const user = usersDatabase.find(u =>
        u.login === login && u.password === password
    );

    if (user) {
        // Успешный вход
        currentUser = {
            id: user.id,
            login: user.login,
            surname: user.surname,
            name: user.name,
            patronymic: user.patronymic,
            photo: user.photo
        };

        // Сохраняем в localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        const loginContent = document.getElementById('login-content');
        const userContent = document.getElementById('user-content');

        loginContent.classList.remove('active');
        userContent.classList.add('active');

        // Обновляем интерфейс
        updateAuthState();

        // Очищаем поля
        loginInput.value = '';
        passwordInput.value = '';
    } else {
        // Неправильные данные
        showMessage('Неверный логин или пароль', 'error');
        loginInput.value = '';
        passwordInput.value = '';
    }
}

// Функция выхода
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthState();

    const loginContent = document.getElementById('login-content');
    const userContent = document.getElementById('user-content');
    const authText = document.getElementById('auth-text');

    loginContent.classList.add('active');
    userContent.classList.remove('active');
    authText.textContent = 'Войти';
}

// Обновление состояния интерфейса
function updateAuthState() {
    const authText = document.getElementById('auth-text');
    const userContent = document.getElementById('user-content');
    const userPhoto = userContent.querySelector('.header__content-img');

    if (currentUser) {
        // Пользователь авторизован
        authText.textContent = 'Профиль';
        if (currentUser.photo) {
            userPhoto.src = `./assets/img/user/${currentUser.photo}`;
        } else {
            userPhoto.src = './assets/img/user/photo.svg';
        }

        // Обновляем информацию в профиле
        document.getElementById('user-surname').textContent = currentUser.surname;
        document.getElementById('user-name').textContent = `${currentUser.name} ${currentUser.patronymic}`;
        document.getElementById('user-id').textContent = `ID: ${currentUser.id}`;
    }
}