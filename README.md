# Funpay Extension (Free)

Русский / Russian

> Для того чтобы расширение работало в Google Chrome (или Chromium-подобных):
>
> 1. Откройте `chrome://extensions`.
> 2. Включите **режим разработчика** (`Developer mode`) в правом верхнем углу.
> 3. Нажмите **Загрузить распакованное расширение** (`Load unpacked`) и выберите папку с этим репозиторием (папку расширения) на компьютере.

Краткое описание

- Это бесплатная версия расширения для работы с сайтом Funpay. Расширение содержит набор модулей для автоматизации рутины: автo-ответы, автоматическое оставление отзывов и обновления. Оно интегрируется с страницами сайта через content-scripts и использует фоновые скрипты (service worker) для планирования задач.

Особенности (основные модули)

- автоматические ответы в чатах (настраивается).
- автоматическое оставление отзывов (обработка профиля, поиск новых отзывов и отправка).
- автоматическое поднятие (refresh) публикаций/лотов.
- скрипты и стили, которые инжектируются на страницы Funpay для улучшения интерфейса и взаимодействия.
- темы и ресурсы для визуальной части расширения.

Разрешения

- Расширение использует в манифесте права: `storage`, `cookies`, `alarms` и `host_permissions` для `https://funpay.com/*` и стороннего сервиса.

Тестирование и отладка

- Откройте DevTools для `service_worker` фонового скрипта (через `chrome://extensions` → "Service worker" в карточке расширения) для просмотра логов и ошибок.
- При проблемах проверьте консоль background и страницу — там будут сообщения об ошибках сетевых запросов, проблемах парсинга HTML или отсутствии токенов.

Contributing / Вклад

- Код в репозитории можно использовать и модифицировать под свои нужды. Если хотите — создайте issue или pull request с предложениями по улучшению.

License / Лицензия

- Используйте код на свой страх и риск. При публикации или распространении уважайте авторские права и условия использования сайтов, с которыми работает расширение.

English

> To run the extension in Google Chrome (or Chromium-based browsers):
>
> 1. Open `chrome://extensions`.
> 2. Turn on **Developer mode** in the top-right corner.
> 3. Click **Load unpacked** and select the folder that contains this extension on your computer.

Overview

- This is a free Funpay helper extension that automates several routine tasks on Funpay: auto-answering chats, posting reviews, and auto-refreshing listings. It uses content scripts to integrate with site pages and a service worker (background) for scheduled/background tasks.

Key features

- automatic chat replies (configurable).
- automatic posting of reviews (detects new items in profile and posts reviews).
- automatic listing refresh (bump/up).
- injected scripts and styles to enhance site UI and behavior.
- themes and visual resources.

Permissions

- The manifest requests `storage`, `cookies`, `alarms` and host permissions for `https://funpay.com/*` and an external host used by the extension.

Debugging

- Open the service worker console from `chrome://extensions` → the extension card → "Service worker" to see logs and errors.
- If something fails (network error or parsing issue), logs will point to the failing fetch or missing tokens.

Next steps / Suggestions

- If you want more robust HTML parsing, consider switching from regex to a DOMParser-based approach in background scripts.
- If you want, I can update modules to include more detailed debug logging or add a basic UI for toggling features.
