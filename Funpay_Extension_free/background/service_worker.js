importScripts("modules\\auto-up.js");
importScripts("modules\\auto-answer.js");
importScripts("modules\\auto-review.js");

let userData = {}

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
    }
});

chrome.alarms.onAlarm.addListener(async alarm => {
    const storage = await chrome.storage.local.get(["extension","extension"]); // обновляем данные при каждом вызове

    // backward compatibility
    if (storage.extension) userData = storage.extension;
    else if (storage.extension) userData = storage.extension;
    else return;

    switch (alarm.name) {
        case "auto-up":
            if (userData?.["auto-up"]?.active)
                await autoUp();
        case "auto-answer":
            if (userData?.["auto-answer"]?.active) {
                await autoAnswer(); // Парсим чаты и отвечаем на сообщения
                await autoAnswer(true); // После парса заходим и ставим ласт id
            }
        case "auto-review":
            if (userData?.["auto-review"]?.active)
                await autoReview();
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "https://funpay.com/extension"
    });
});