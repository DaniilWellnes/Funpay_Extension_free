importScripts("modules\\auto-up.js");
importScripts("modules\\auto-answer.js");
importScripts("modules\\auto-review.js");

let userData = {}

// При старте сервис-воркера читаем демо-флаг и при необходимости подставляем демонстрационный конфиг
(async function initDemo() {
    try {
        const store = await chrome.storage.local.get(["demo_mode","extension"]);
        if (store.demo_mode) {
            const demoKeys = [
                "auto-up", "auto-answer", "auto-review",
                "download-lots", "analitik", "sale-panel",
                "translate-product", "disable-lots", "total-count", "instant-complaint", "quick-trade"
            ];

            const ext = store.extension || {};
            demoKeys.forEach(k => {
                ext[k] = ext[k] || {};
                ext[k].active = true;
            });

            await chrome.storage.local.set({ extension: ext });
            userData = ext;

            // Запускаем одноразово фоновые демонстрационные задачи
            try { if (userData["auto-up"].active) await autoUp(); } catch(e){}
            try { if (userData["auto-answer"].active) { await autoAnswer(); await autoAnswer(true); } } catch(e){}
            try { if (userData["auto-review"].active) await autoReview(); } catch(e){}
        }
    } catch (e) { console.warn('initDemo failed', e); }
})();

chrome.alarms.get("auto-up", (alarm) => {
    if (!alarm)
        chrome.alarms.create("auto-up", { periodInMinutes: 5 });
});

chrome.alarms.get("auto-answer", (alarm) => {
    if (!alarm)
        chrome.alarms.create("auto-answer", { periodInMinutes: 1 });
});

chrome.alarms.get("auto-review", (alarm) => {
    if (!alarm)
        chrome.alarms.create("auto-review", { periodInMinutes: 1 });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // Получение данных из страницы фанпея
    switch (message.key) {
        case "delete_cookie":
            (async () => {
                const cookies = await chrome.cookies.getAll({url: "https://funpay.com"});

                for (const cookie of cookies) {
                    await chrome.cookies.remove({
                        url: "https://funpay.com",
                        name: cookie.name,
                        storeId: cookie.storeId
                    });
                }

                chrome.tabs.reload(sender.tab.id);
            }) ();

            break;
        case "getCookie":
          (async () => {
            const golden_key = await chrome.cookies.get({
                url: "https://funpay.com",
                name: "golden_key"
            });

            sendResponse(golden_key.value);
          }) ();

          return true;
        case "setCookie":
            chrome.cookies.set(
                {
                    url: "https://funpay.com",
                    name: "golden_key",
                    value:  message.cookie,
                    domain: "funpay.com",
                    path: "/",
                    secure: true,
                    httpOnly: true,
                    expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
                }
            );

            chrome.tabs.reload(sender.tab.id);
            break;
        case "get-time":
            chrome.alarms.get(message.value, (alarm) => {
                const timeDiffMs = alarm.scheduledTime - Date.now();
                sendResponse(Math.round(timeDiffMs / 1000));
            });

            return true;
        case "advanced":
            autoAnswer(true);
            autoReview(true);
            chrome.storage.local.set({"extension": message.value});
            break;
        case "demo_mode":
            // Сохраняем флаг демо в chrome.storage, чтобы alarms и background знали о демонстрации
            (async () => {
                try {
                    await chrome.storage.local.set({ demo_mode: message.value });
                    // При включении демо принудительно запускаем фоновые задачи для демонстрации
                    if (message.value === true) {
                        // обновить userData из хранилища и включить имитацию активных функций
                        const storage = await chrome.storage.local.get(["extension"]);
                        if (storage.extension) {
                            userData = storage.extension;
                        }

                        userData["auto-up"] = userData["auto-up"] || {};
                        userData["auto-up"].active = true;
                        userData["auto-answer"] = userData["auto-answer"] || {};
                        userData["auto-answer"].active = true;
                        userData["auto-review"] = userData["auto-review"] || {};
                        userData["auto-review"].active = true;

                        // Запускаем задачи немедленно для демонстрации
                        try { if (userData["auto-up"].active) await autoUp(); } catch(e){}
                        try { if (userData["auto-answer"].active) { await autoAnswer(); await autoAnswer(true); } } catch(e){}
                        try { if (userData["auto-review"].active) await autoReview(); } catch(e){}
                    }
                } catch (e) {}
            })();
            break;
    }
});

chrome.alarms.onAlarm.addListener(async alarm => {
    const storage = await chrome.storage.local.get(["extension"]); // обновляем данные при каждом вызове

    // backward compatibility
    if (storage.extension) userData = storage.extension;
    else return;

    // Если включён demo_mode — принудительно помечаем ключевые функции как активные
    try {
        const demoStorage = await chrome.storage.local.get(["demo_mode"]);
        if (demoStorage.demo_mode) {
            userData["auto-up"] = userData["auto-up"] || {};
            userData["auto-up"].active = true;
            userData["auto-answer"] = userData["auto-answer"] || {};
            userData["auto-answer"].active = true;
            userData["auto-review"] = userData["auto-review"] || {};
            userData["auto-review"].active = true;
        }
    } catch(e) {}

    switch (alarm.name) {
        case "auto-up":
            if (userData?.["auto-up"]?.active) await autoUp();
            break;
        case "auto-answer":
            if (userData?.["auto-answer"]?.active) {
                await autoAnswer(); // Парсим чаты и отвечаем на сообщения
                await autoAnswer(true); // После парса заходим и ставим ласт id
            }
            break;
        case "auto-review":
            if (userData?.["auto-review"]?.active) await autoReview();
            break;
        default:
            break;
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "https://funpay.com/extension"
    });
});