// Подгружаем все темы
const cssLoad = localStorage.getItem("extension_css");
const css = cssLoad ? JSON.parse(cssLoad) : {};

// Вставляем offline-shim в контекст страницы (если нужно заблокировать внешние вызовы)
(async function(){
    try{
        const shimUrl = chrome.runtime.getURL('content/scripts/offline-shim.js');
        const res = await fetch(shimUrl);
        const code = await res.text();
        const s = document.createElement('script');
        s.textContent = code + '\n//# sourceURL=offline-shim.js';
        (document.head || document.documentElement).appendChild(s);
        s.parentNode && s.parentNode.removeChild(s);
        console.info('offline-shim injected');
    }catch(e){ console.warn('offline-shim injection failed', e); }
})();

// --- Demo mode for local testing: визуально включаем заблокированные функции ---
// Ensure demo mode is ON by default unless explicitly disabled
if (localStorage.getItem('demo_mode') === null) localStorage.setItem('demo_mode', '1');
window.__DEMO_MODE = localStorage.getItem('demo_mode') === '1';
function toggleDemoMode(value){
    if(typeof value === 'boolean') window.__DEMO_MODE = value;
    else window.__DEMO_MODE = !window.__DEMO_MODE;
    localStorage.setItem('demo_mode', window.__DEMO_MODE ? '1' : '0');
    applyDemoUI();
}

function applyDemoUI(){
    try{
        // Добавляем легкие переопределения стилей, чтобы скрыть блоки 'подписка' и показать функции
        const css = `
            /* Скрыть визуальные маркеры подписки */
            .subscribe_btn, .subscribe-info, .subscribe-icon, .purchase-subscribe, #premium { display: none !important; }
            /* Убрать затемнения/замки */
            .locked, .lock-overlay, .lock { display: none !important; }
            /* Включить кнопки */
            .btn[disabled], button[disabled], input[disabled], .btn.disabled { opacity: 1 !important; pointer-events: auto !important; }
        `;
        let s = document.getElementById('demo-style');
        if(!s){ s = document.createElement('style'); s.id = 'demo-style'; document.head.appendChild(s); }
        s.textContent = window.__DEMO_MODE ? css : '';

        // Раскрываем скрытые секции премиум (если они скрыты через inline styles)
        if(window.__DEMO_MODE){
            document.querySelectorAll('[data-premium], .premium, #premium').forEach(el => {
                el.style.display = '';
                el.classList.remove('hidden');
            });

            // Активируем кнопки и помечаем элементы как визуально скрытые (не удаляем их)
            document.querySelectorAll('.subscribe_btn, .purchase-subscribe').forEach(el => el.classList.add('demo-hidden'));
            document.querySelectorAll('button, a.btn').forEach(b => { try{ b.disabled = false; b.classList.remove('disabled'); }catch(e){} });

            // Текстовые правки: заменяем упоминания о подписке на доступно
            document.querySelectorAll('*').forEach(n => {
                if(n.childNodes && n.childNodes.length && n.innerText){
                    n.innerHTML = n.innerHTML.replace(/доступно только по подписке/ig, 'Доступно');
                    n.innerHTML = n.innerHTML.replace(/только с PREMIUM подпиской/ig, 'Доступно');
                }
            });
        }
    }catch(e){ console.warn('applyDemoUI error', e); }
}

// Добавляем небольшой переключатель в правый верхний угол для локального теста
function injectDemoToggle(){
    if(document.getElementById('demo-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'demo-toggle';
    btn.textContent = window.__DEMO_MODE ? 'DEMO:ON' : 'DEMO:OFF';
    btn.style.position = 'fixed';
    btn.style.right = '12px';
    btn.style.top = '12px';
    btn.style.zIndex = 99999;
    btn.style.background = window.__DEMO_MODE ? '#1e90ff' : '#666';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '8px';
    btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
    btn.onclick = function(){ toggleDemoMode(); btn.textContent = window.__DEMO_MODE ? 'DEMO:ON' : 'DEMO:OFF'; btn.style.background = window.__DEMO_MODE ? '#1e90ff' : '#666'; };
    document.body.appendChild(btn);
}

// Запуским инъекцию при первой загрузке (если DOM уже готов, иначе после вставки страницы)
if(document.readyState !== 'loading'){
    injectDemoToggle(); applyDemoUI();
} else {
    document.addEventListener('DOMContentLoaded', function(){ injectDemoToggle(); applyDemoUI(); });
}

// --- Visual text replacements for subscription labels (visual only) ---
(function(){
    function replaceSubscriptionText(){
        try{
            // Target specific selectors first
            const targets = [
                '.subscribe-info', '.subscribe-btn', '.purchase-subscribe', '.subscribe', '.subscribe-text', '.subscribe-label'
            ];
            targets.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    if(el.innerHTML && /подписк/i.test(el.innerHTML)){
                        el.innerHTML = el.innerHTML.replace(/доступно только по подписке/ig, 'Доступно');
                        el.classList.add('subscribe-replaced');
                    }
                });
            });

            // Fallback: scan small subset of nodes for the phrase and replace (avoid heavy full-scan)
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            const needle = /доступно только по подписке/ig;
            const nodes = [];
            while(walker.nextNode()){ nodes.push(walker.currentNode); if(nodes.length>5000) break; }
            nodes.forEach(t => {
                if(needle.test(t.nodeValue)){
                    t.nodeValue = t.nodeValue.replace(needle, 'Доступно');
                }
            });
        }catch(e){ console.warn('replaceSubscriptionText failed', e); }
    }

    if(document.readyState !== 'loading') replaceSubscriptionText(); else document.addEventListener('DOMContentLoaded', replaceSubscriptionText);
    // Re-run after some dynamic updates (e.g., AJAX content insert)
    setTimeout(replaceSubscriptionText, 1200);
    setTimeout(replaceSubscriptionText, 3000);
})();

["black", "night", "cosmo"].forEach(async (name) =>  {
    const result = await fetch(chrome.runtime.getURL(`assets/css/${name}.css`));
    css[name] = await result.text();

    localStorage.setItem("extension_css", JSON.stringify(css)); 
});

// Ждем загрузки страницы 
const loadpage = new MutationObserver(async () => {
    if (!$(".cd.cd-empty.mb50")[0]) { return };
    
    loadpage.disconnect();

    const FPname = $(".user-link-name").eq(0).text();

    $(".theme-css").remove();
    $(".wrapper-content").empty();
    $(".wrapper-footer").remove();

    $(".wrapper-content").append(
        `<div>
            <span class="loadSub">Загрузка</span>
            <span class="descriptionSub">Обновляем информацию о вас</span>
        </div>`
    );

    const PAGE = await fetch(`${domain}/runner`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            body: $("body").html(),
            token: localStorage.getItem("token")
        })
    });

    $(".wrapper-content").empty();
    $(".wrapper-content").append((await PAGE.text()).replace("{FPname}", FPname));

    $(".version span").text(chrome.runtime.getManifest().version);

    const stack = $(".stack-alert");

    if (stack.data("id") > (localStorage.getItem("stackId") == undefined ? -1 : Number(localStorage.getItem("stackId")))) {
        stack.css("display", "flex")
    };

    stack.find("p").text(
        stack.find("p").text()
        .replaceAll("{version}", chrome.runtime.getManifest().version)
    );

    stack.find("#stack-kill").on("click", () => {
        localStorage.setItem("stackId", stack.data("id"));
        stack.css("display", "none")
    });

    // темы
    $("#active-theme").css("background-image", `url(${chrome.runtime.getURL(`assets/img/theme/${userData.theme ? userData.theme[0] : "default"}.png`)})`);
    $("#active-theme span span").text(userData.theme ? userData.theme[1] : "Белая");

    $("#themes").find("div").each(( index, element ) => {
        const img = $(element).attr("id").split("-")[1];
        $(`#theme-${img}`).css("background-image", `url(${chrome.runtime.getURL(`assets/img/theme/${img}.png`)})`);
    });

    $("#themes div").on("click", function() {
        const newTheme = $(this).attr("id").split("-")[1];
        const explanation = $(this).find(".img-explanation").text();

        $("#active-theme").css("background-image", `url(${chrome.runtime.getURL(`assets/img/theme/${newTheme}.png`)})`);
        $("#active-theme span span").text(explanation);

        userData.theme = [newTheme, explanation];
        localStorage.setItem("extension", JSON.stringify(userData));
    });

    // Ограничители
    $(".settings-menu").on("click", function(event) { 
        if (["input", "textarea", "label"].includes(event.target.tagName.toLowerCase())) { return }

        event.preventDefault();
        event.stopImmediatePropagation();
    });

    $(".subscribe_btn").on("click", function(event) {
        // если клик был не по ссылке <a>, останавливаем обработку
        if (!$(event.target).closest("a").length || !$(event.target).attr("href")) {
            event.preventDefault();
            event.stopPropagation();
        }
    });

    // Посредственные функции по типу получение времени при наводке и тд
    $(".time").on("mouseenter", async function() {
        const value = $(this).data("value");

        const time = await chrome.runtime.sendMessage({key: "get-time", value: value});

        $(this).find(".get-time").text(time);
    });

    setInterval(() => {
        $(".get-time").each(( index, element ) => {
            const time = +$(element).text() - 1;

            $(element).text(time > 0 ? time : 0);
        });
    }, 1000);

    // Авто заполнение из конфига (функции)
    $(".function").each(( index, element ) => {
        const action = $(element);
        const status = action.find(".active");

        if (userData[status.data("key")]) {
            if (userData[status.data("key")].active) { status.prop("checked", true) }

            action.find(".settings-menu input, .settings-menu textarea").each(( index, element ) => {
                const type = $(element).attr("type")

                if (type == "checkbox")
                    $(element).prop("checked", userData[status.data("key")][$(element).data("key")])
                else
                    $(element).val(userData[status.data("key")][$(element).data("key")])
            });
        }
    });

    // Авто заполнение из конфига (Авто ответ)
    if (userData["auto-answer"] && userData["auto-answer"].commands)
        userData["auto-answer"].commands.forEach(( element ) => {
            $(".commands").append(`
                <div class="auto-answer-block">
                    <div class="commands-pane"><input type="text" class="d-input auto-answer-key" placeholder="Команда" value="${element.command}"><button class="settings-btn delete-commands">Удалить</button></div>
                    <textarea class="open-input d-input auto-answer-value" placeholder="Содержимое авто-ответа&#10;&#10;&#10;Ключеные слова:&#10;{username} - имя оппонента&#10;{myusername} - ваше имя">${element.message}</textarea>
                </div>
            `);
        });

    // Авто заполнение из конфига (бинды)
    userData.bind?.forEach(( element ) => { $("#bind-container").append( bindSample(element) ) });
 
    // авто включение кастомизатор из конфига
    if (userData["custom"])
        $(".custom-active").text("Закончить кастомизацию");

    // свап окон на меню настроек (функции)
    $(".settings-swap").on("click", function() {
        const box = $(this).parents(".function");

        const window = box.find(".settings-menu").css("display");
        
        box.find(".settings-menu").css("display", window == "flex" ? "none" : "flex");
    });

    // свап окон на меню настроек (бинды)
    $("#bind-container").on("click", ".bind-swap, .bind", function (event) {
        if ($(event.target).hasClass("bind-swap")) {
            $(this).find(".bind-front").css("display", "flex");
            $(this).find(".bind-back").css("display", "none");
            return;
        };
        
        $(this).find(".bind-front").css("display", "none");
        $(this).find(".bind-back").css("display", "flex");
    });

    // Создание нового бинда
    $("#bind-add").on("click", () => {
        $("#bind-container").append( bindSample( {"name": "Новый бинд", "value": "", "active": false, "auto-send": false, "in-right": false } ) );
        bindSave();
    });

    // Удаление бинда
    $("#bind-container").on("click", ".bind-delete", function () {
        $(this).parents(".bind").remove();
        bindSave();
    });

    // Разделение десятков на input
    $(".numbers").on("input", function () {
        let value = $(this).val().replace(/\D/g, "");
        
        if (value) { value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".") }
        $(this).val(value);
    });

    // активация кастом темы
    $(".custom-buttons .custom-active").on("click", function() {
        const text = $(this).text();

        if (text == "Начать кастомизацию") {
            $(this).text("Закончить кастомизацию");
            userData["custom"] = true;
            window.location.href = "https://funpay.com";
        } else {
            $(this).text("Начать кастомизацию");
            userData["custom"] = false;
            window.location.reload();
            
        }

        localStorage.setItem("extension", JSON.stringify(userData));
    });

    // кастом тема поделиться
    $(".custom-share").on("click", function () {
        const json = localStorage.getItem("custom-theme-json");

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = $("<a>")
            .attr("href", url)
            .attr("download", ".json")
            .appendTo("body");

        a[0].click();
        a.remove();

        URL.revokeObjectURL(url);
    });

    // загрузка кастом темы
    $(".custom-load-main").on("change", function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const theme = e.target.result;

                localStorage.setItem("custom-theme-json", theme);

                css["custom"] = buildCss(JSON.parse(theme));
                localStorage.setItem("extension_css", JSON.stringify(css)); 
                textAlert("Тема успешно закреплена и сохранена для дальнейшего использования.");
            } catch (err) {
                textAlert("Был загружен некорректный или непонятный файл, поэтому текущая тема осталась без изменений и продолжает отображаться в прежнем виде.");
            }
        };

        reader.readAsText(file);
    });

    // удаление кастом темы
    $(".custom-delete").on("click", () => {
        localStorage.removeItem("custom-theme-json");
        css["custom"] = "";
        localStorage.setItem("extension_css", JSON.stringify(css)); 

        textAlert("Тема успешно удалена и доступна для дальнейшего редактирования.");
    });

    // Авто сейв конфига
    $(`.function input, .function textarea`).on("change", function() { 
        functionSave(this);

        chrome.runtime.sendMessage({ // отправляем на сейв в extension
            key: "advanced",
            value: { 
                "auto-up": userData["auto-up"], 
                "auto-answer": userData["auto-answer"],
                "auto-review": userData["auto-review"],
                "token": localStorage.getItem("token")
            }
        });
    });

    $("#bind-container").on("change", ".bind-back input, .bind-back textarea", function() { 
        $(this).parents(".bind").find(".bind-front h3").text($(this).parents(".bind").find(".bind-name").val());
        bindSave();
    });

    $(".commands").on("change", ".auto-answer-key, .auto-answer-value", () => { commandsSave() });

    // создание новой команды
    $(".add-command").on("click", () => {
        $(".commands").append(`
            <div class="auto-answer-block">
                <div class="commands-pane"><input type="text" class="d-input auto-answer-key" placeholder="Команда" value=""><button class="settings-btn delete-commands">Удалить</button></div>
                <textarea class="open-input d-input auto-answer-value" placeholder="Содержимое авто-ответа&#10;&#10;&#10;Ключеные слова:&#10;{username} - имя оппонента&#10;{myusername} - ваше имя"></textarea>
            </div>
        `)

        commandsSave();
    });

    // удаление старой команды
    $(".commands").on("click", ".delete-commands", function() {
        $(this).parents(".auto-answer-block").remove();

        commandsSave();
    });

    // Открытие config manager
    $(document).keyup((event) => {
        if (event.originalEvent.code == "ControlRight") {
            $(".config-manager").css("display", $(".config-manager").css("display") == "flex" ? "none" : "flex")
        }
    });    

    // Генерация конфига
    $("#config-generation").on("click", () => { 
        const key = $("#config-active-key");

        key.val(btoa(unescape(encodeURIComponent(JSON.stringify(userData)))));

        key.attr("disabled", false);
        key.select();
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
        key.attr("disabled", true);
        $("body")[0].focus();

        textAlert("Сгенерирован ключ от вашего конфига, он скопирован в буфер обмена");
    });

    // Сохранение конфига
    $("#config-save").on("click", () => { 
        const key = $("#config-save-key").val();

        const config = decodeURIComponent(escape(atob(key)));

        if (typeof JSON.parse(config) == "object" && config.indexOf("{") != -1) {
            localStorage.setItem("extension", config);
            location.reload();
        } else { textAlert("Ключ не является подленным") }
    });

    // обновление статистики
    $(".stats-update").on("click", async () => {
        const sell = await parseLots(true);
        const buy = await parseLots();
        
        const result = await fetch("https://funpay.com/account/balance");
        const profile = $(await result.text());
        const balance = profile.find(".badge-balance")[0] ? Number(profile.find(".badge-balance").text().split(" ")[0].split(".")[0]) : 0;

        $("#stats-name").text(profile.find(".user-link-dropdown .user-link-name").eq(0).text());
        $("#stats-balance").text(`${balance - (balance * 0.03)} ₽`);
        $("#total-sales").text(sell.all_order);
        $("#total-purchases").text(buy.all_order);
        $("#sales-amount").text(`${sell.summa} ₽`);
        $("#purchases-amount").text(`${buy.summa} ₽`);
        $("#max-sale").text(`${sell.max_price} ₽`);
        $("#max-purchase").text(`${buy.max_price} ₽`);
        $("#unique-sellers").text([...new Set(sell.uniq)].length);
        $("#unique-buyers").text([...new Set(buy.uniq)].length);

        textAlert("Статистика собрана, можете закрыть окно");
    });

    $("#lotsInput").on("change", function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            
            const lots = JSON.parse(content);
            
            importLots(lots, lots.length);
        };
        reader.readAsText(file);
    });


    $(".tg-subscribe").on("click", () => {
        $(".tg-code-enter").css("display", "flex");
    });

    $(".cancel-tg-code").on("click", () => {
        $(".tg-code-enter").css("display", "none");
    });

    $(".accept-tg-code").on("click", () => {
        if ($(".tg-code").val() == stack.data("code")) {
            $(".tg-subscribe").parents(".subscribe_btn").remove();
            textAlert("Код подписки на Telegram успешно сохранён. Теперь доступны все функции.");
            userData.tg_code = $(".tg-code").val();
            localStorage.setItem("extension", JSON.stringify(userData));
        } else { textAlert("Введён неверный код подписки"); }
    })

    if (userData.tg_code == stack.data("code"))
        $(".tg-subscribe").parents(".subscribe_btn").remove()

    $(".save-token").on("click", function() {
        const token = $(this).parents(".token-select").find("input").val();

        userData.token = token;
        localStorage.setItem("token", token);

        textAlert("Новый токен был успешно сохранён. В случае, если это действие было выполнено по ошибке и вы потеряли основной токен, незамедлительно свяжитесь с технической поддержкой и сообщите об этом администратору.");
    });
});

loadpage.observe(document, {
    childList: true,
    subtree: true
});

// Дополнительные функции
function bindSample(bind) {
    return (
        `<div class="bind">
            <div class="bind-front bind-chapter">
                <div class="edit-text">
                    <i class="fa-solid fa-pencil"></i>
                    <p>Нажмите для редактирования</p>
                </div>
                <h3>${bind.name}</h3>
                <p class="bind-hover">Наведитесь для подробной информации</p>
                <div class="bind-stats">
                    <div class="bind-active">${bind.active ? "Включён" : "Выключён"}</div>
                    <div class="bind-use">Авто-отправка <span>${bind["auto-send"] ? "включена" : "выключена"}</span></div>
                    <div class="bind-date">${bind["in-right"] ? "В" : "Не в"} расширенной части</div>
                </div>
            </div>
            <div class="bind-back bind-chapter">
                <div class="bind-name-swap">
                    <input type="text" class="d-input bind-name" data-key="name" placeholder="Название бинда" value="${bind.name}">
                    <button class="btn-btn bind-swap">Вернуться</button>
                </div>
                <textarea class="open-input d-input" data-key="value" placeholder="Содержимое бинда\n\nКлючевые слова:\n{name} - имя собеседника\n{myname} - ваше имя\n{sell} - количество активных продаж">${bind.value}</textarea>
                <div class="bind-settings">
                    <div class="settings-btns bind-checkbox">
                        <label class="settings-btn">
                            <input type="checkbox" data-key="active" ${bind.active ? "checked" : ""}>
                            Активен
                        </label>
                        <label class="settings-btn">
                            <input type="checkbox" data-key="auto-send" ${bind["auto-send"] ? "checked" : ""}>
                            Авто-отправка
                        </label>
                        <label class="settings-btn advanced-bind">
                            <input type="checkbox" data-key="in-right" ${bind["in-right"] ? "checked" : ""}>
                            В расширенную часть
                        </label>
                    </div>
                    <button class="btn-btn bind-delete">Удалить</button>
                </div>
            </div>
        </div>`
    )
}

function functionSave(element) {
    const action = $(element).parents(".function");
    const status = action.find(".active");

    if (!userData[status.data("key")]) { userData[status.data("key")] = {} }

    userData[status.data("key")].active = status.prop("checked");

    action.find(".settings-menu input, .settings-menu textarea").each(( index, element ) => {
        const element_type = $(element).attr("type");

        userData[status.data("key")][$(element).data("key")] = element_type == "checkbox" ? $(element).prop("checked") : $(element).val();
    });

    localStorage.setItem("extension", JSON.stringify(userData));
}

// функции расширеных сейвов
function bindSave() {
    userData.bind = [];

    $(".bind-back").each(( index, element ) => {
        const action = $(element);
        const bind = {};
    
        action.find("input, textarea").each(( index, element ) => {
            const element_type = $(element).attr("type");

            bind[$(element).data("key")] = element_type == "checkbox" ? $(element).prop("checked") : $(element).val();
        });
        
        userData.bind.push(bind);
    });

    localStorage.setItem("extension", JSON.stringify(userData));
}

function commandsSave() {
    if (!userData["auto-answer"])
        userData["auto-answer"] = { active: false }

    const config = [];

    $(".auto-answer-block").each(( index, element ) => {
        config.push({
            command: $(element).find(".auto-answer-key").val(),
            message: $(element).find(".auto-answer-value").val()
        });
    });

    userData["auto-answer"].commands = config;

    localStorage.setItem("extension", JSON.stringify(userData));

    chrome.runtime.sendMessage({ 
        key: "advanced",
        value: { 
            "auto-up": userData["auto-up"], 
            "auto-answer": userData["auto-answer"] 
        }
    });
}

// функции много используемых функций
function parseLots(trade, stats = {summa: 0, uniq: [], max_price: 0, all_order: 0 }, order) {
    textAlert(order 
        ? `Обработка продолжается: достигнут заказ с номером #${order}. Пожалуйста, подождите, пока собирается полная статистика по вашим заказам.` 
        : "Запущен процесс сбора данных по вашим заказам. Пожалуйста, дождитесь завершения анализа."
    );

    return new Promise(async (resolve) => {
        const result = await fetch(`https://funpay.com/orders/${trade ? "trade" : ""}`, {
            "body": order ? new URLSearchParams({ "continue": order }) : null,
            "method": order ? "POST" : "GET",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        }); 

        const data = $(await result.text());
    
        data.find(".text-success").each(( index, element ) => {
            const lot = $(element).parents(".tc-item");
            const price = Number(lot.find(".tc-price").text().split(".")[0]);
        
            stats.summa += price;

            if (stats.max_price < price) { stats.max_price = price }

            stats.all_order ++;
        });

        stats.uniq = [...stats.uniq, ...data.find(".media-body span").map((index, element) => $(element).text())];

        if (data.find(".dyn-table-continue")[0]) {
            setTimeout(async () => {
                resolve(await parseLots(trade, stats, data.find(".tc-item").eq(99).find(".tc-order").text().split("#")[1]));
            }, 1000);
        } else { resolve(stats) }
    });
}

const alertTimeout = [];

function textAlert(text) {
    $(".alert-extension").css("display", "none");
    $(".alert-extension").removeClass("anim-hide");
    clearInterval(alertTimeout[0]);
    clearInterval(alertTimeout[1]);

    setTimeout(() => {
        $(".alert-extension").css("display", "inline-block");
        $(".alert-value").text(text);
    
        alertTimeout[0] = setTimeout(() => { $(".alert-extension").addClass("anim-hide") }, 3000);
        alertTimeout[1] = setTimeout(() => { $(".alert-extension").removeClass("anim-hide"); $(".alert-extension").css("display", "none") }, 4000);
    });
}

async function importLots(lots, start) {
    let lot = lots[0];

    if (lot.query != undefined) {
        Object.entries(lot).forEach((element) => {
            lot += `${element[0]}=${element[1]}&`
        });

        if ($(".subscribe_btn")[0]) {
            textAlert("Файл с лотами не был создан через наше расширение, загрузка этого файла доступна только с PREMIUM подпиской");

            return;
        }
    }

    $("#import-lots span").text("Импортирую лоты " + String(100 - (lots.length / start * 100)).split(".")[0] + "%");
    
    await fetch("https://funpay.com/lots/offerSave", {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        "body":
            `csrf_token=${$("body").data("app-data")["csrf-token"]}&`+ lot,
        "method": "POST",
    });

    lots.shift();

    if (lots[0]) {
        setTimeout(() => {
            importLots(lots, start);
        }, 1500);
    } else {
        $("#import-lots span").text("Никаких действий не производится");
        textAlert("Импортировал все скачанные вами лоты");
    }
}