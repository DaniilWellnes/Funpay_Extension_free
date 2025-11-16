if (!localStorage.getItem("extension")) { localStorage.setItem("extension", "{}") };
const userData = JSON.parse(localStorage.getItem("extension"));

if (!localStorage.getItem("accounts")) { localStorage.setItem("accounts", "[]") };
const userAccounts = JSON.parse(localStorage.getItem("accounts"));

const domain = "https://fpextension.biz";

// подгружаем темы
if (userData.theme && userData.theme[0] != "default") {
    $("html").append(`<style type="text/css" class="theme-css">${JSON.parse(localStorage.getItem("extension_css"))[userData.theme[0]]}</style>`);

    const getBody = new MutationObserver(() => {
        if ($("body")[0]) {
            $(".theme-css").remove();
            $("html").append(`<style type="text/css" class="theme-css">${JSON.parse(localStorage.getItem("extension_css"))[userData.theme[0]]}</style>`);
            getBody.disconnect();
        };
    });
    
    getBody.observe(document, {
        childList: true,
        subtree: true
    });
}; 

const loadFunpay = new MutationObserver(function() {
    if (!$(".nav.navbar-nav.navbar-right.logged")[0]) { return }

    this.disconnect();

    $(".nav.navbar-nav.navbar-right.logged").prepend(`<li><a href="https://funpay.com/extension" class="redirection-extension">extension</a></li>`);

    // меняем логотип на svg что бы можно было редактировать цвета
    // $(".navbar-brand").replaceWith(`
    //     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30000 11317" version="1.1" class="logo">
    //         <path fill="#000" d="M27726 8340V7139l2274-4161h-1276l-1512 2917h-65l-1544-2917h-1298l2274 4161v1201h1147zm-5367-4075h75l837 2102h-1748l836-2102zm-525-1287l-2381 5362h1212l418-954h2638l419 954h1244l-2381-5362h-1169zm-3959 2938h-1502V3997h1427c300 0 557 107 729 310 129 172 225 397 225 655 0 268-86 493-246 675-151 183-366 279-633 279zm2027-954c0-547-215-1019-558-1362-375-397-901-622-1501-622h-2617v5362h1147V6935h1470c600 0 1147-247 1523-633 332-354 536-826 536-1340zM9589 6066V2978H8442v3142c0 396-129 708-333 922-214 225-514 365-890 365-364 0-665-129-901-375-225-226-343-537-343-912V2978H4828v3088c0 654 257 1244 675 1684 418 418 987 676 1716 676 676 0 1234-236 1652-622 461-440 718-1051 718-1738zM0 2978v5362h1148V6238h2670V5219H1148V4007h3002V2978H0z" class=""></path>
    //         <path fill="#4384d0" d="M9724 2978L12407 0l2684 2978h-1263v3507l-2917-3507H9724zm5367 5362l-2684 2977-2683-2977h1273V4822l2906 3518h1188z" class=""></path>
    //     </svg>
    // `)

    // цель
    const price = userData["target-price"];

    if (price?.active) {
        const element = $(".badge.badge-balance");

        if (element[0]) {
            const balance = Number(element.text().split(" ")[0].replaceAll(".", ""));
            const valute = element.text().split(" ")[1];

            element.text(
                `${balance} ${valute}` +
                (price.money ? ` | ${Number(price.summa.replaceAll(".", "")) - balance} ${valute}` : "") +
                (price.procent ? ` | ${(balance / Number(price.summa.replaceAll(".", "")) * 100).toFixed(1)}%` : "") +
                (price.name ? ` | ${price["collection-name"]}` : "")
            );
        }
    }

    // калькулятор
    if (userData["calculator"]?.active) {
        $(".dropdown.hidden-sm.hidden-xs li").eq(0).after(`<li class="dropdown"><input placeholder="Калькулятор" id="calculator" /></li>`);

        $("#calculator").on("keyup", function (event) {
            if (event.key === "=") {
                const expression = $(this).val().replace(/=/g, "").replace(/:/g, "/");

                try {
                    const result = evaluateExpression(expression);
                    $(this).val(result);
                } catch {
                    $(this).val("Ошибка");
                }
            }
        });
    }

    // Мульти аккаунты
    if (userData["multy-accounts"]?.active) {
        $(".menu-item-logout").text("Выйти и удалить куки");
        $(".menu-item-logout").eq(0).parent("li").before(`<li><a class="logout">Выйти</a></li>`)

        $(".logout").on("click", () => { chrome.runtime.sendMessage({ key: "delete_cookie" }) }); 

        $(".dropdown.hidden-sm.hidden-xs > .dropdown-menu").append(`
            <div class="accounts">
                <div class="account-list"></div>
                <button class="add-multy-account">Добавить новый аккаунт</dutton>
            </div>
        `);

        userAccounts.forEach(( account ) => {
            $(".account-list").prepend(`<button class="loadAccount"><span value="${account[1]}">${account[0]}</span><button class="multy-delete">Удалить</button></button>`);
        });

        $(".add-multy-account").on("click", async () => {  // Сохранение аккаунта
            const cookie = await chrome.runtime.sendMessage({ key: "getCookie" });

            $(".account-list").prepend(`<button class="loadAccount"><span value="${cookie}">${$(".user-link-name").eq(0).text()}</span><button class="multy-delete">Удалить</button></button>`);
            saveAccounts();
        });

        $(".accounts").on("click", ".loadAccount span", function() { // Переход по аккаунтам
            chrome.runtime.sendMessage({ key: "setCookie", cookie: $(this).attr("value") })
        });

        $(".accounts").on("click", ".multy-delete", function () { // удаление аккаунта
            $(this).parents(".loadAccount").remove();
            saveAccounts();
        });

        $(".accounts").on("click", (event) => {
            event.preventDefault();
            event.stopPropagation(); 
        });
    }
    
    // анимированный логотип
    if (userData["anim-logo"]?.active) { $(".logo-color").addClass("logo-anim") } 
    
    // кастомный курсор
    if (userData["custom-cursor"]?.active) { $("html").append(`<style type="text/css" class="theme-css">* { cursor: url("${userData["custom-cursor"]?.["cursor-url"] ? userData["custom-cursor"]["cursor-url"] : "https://img.icons8.com/tiny-color/16/middle-finger.png"}"), auto !important; }</style>`) }

    // снег за курсором
    if (userData["snow-cursore"]?.active) {
        $(document).mousemove((cursor) => {
            for (let i = 0; i < 5; i++) {
                const snow = $(`<div class="snow"></div>`);
        
                const offsetX = Math.random() * 20 - 20;
                const offsetY = Math.random() * 20 - 20;
        
                snow.css({
                    left: cursor.pageX + offsetX + "px",
                    top: (cursor.pageY + 10)+ offsetY + "px"
                });
        
                $("body").append(snow);
        
                setTimeout(() => { snow.remove() }, 500);
            }
        });
    }
});

loadFunpay.observe(document, {
    childList: true,
    subtree: true
});

// Глобаные фунции (используются в нескольких местах)
async function translate(text, from = "en", to = "ru") {
    const fromText = text.replace(/[^a-zA-Zа-яА-Я0-9\s]/g, " ").replaceAll("\n", " 96300112 ").replace(/\s{2,}/g, " ");

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${fromText}`);
    const data = (await response.json());

    return data[0].map(innerArray => innerArray[0]).join("").replaceAll("96300112", "\n");
}

// расчет калькулятора
function evaluateExpression(expression) {
    const tokens = expression.match(/(\d+(\.\d+)?|[+\-*/()])/g);
    if (!tokens) throw "Неверное выражение";

    const outputQueue = [];
    const operatorStack = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };

    for (const token of tokens) {
        if (!isNaN(token)) {
            outputQueue.push(Number(token));
        } else if ("+-*/".includes(token)) {
            while (
            operatorStack.length &&
            "*/+-".includes(operatorStack.at(-1)) &&
            precedence[operatorStack.at(-1)] >= precedence[token]
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if (token === "(") {
            operatorStack.push(token);
        } else if (token === ")") {
            while (operatorStack.at(-1) !== "(") {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.pop();
        }
    }

    outputQueue.push(...operatorStack.reverse());

    const evaluationStack = [];
    for (const token of outputQueue) {
        if (typeof token === "number") {
            evaluationStack.push(token);
        } else {
            const b = evaluationStack.pop();
            const a = evaluationStack.pop();
            switch (token) {
                case "+": evaluationStack.push(a + b); break;
                case "-": evaluationStack.push(a - b); break;
                case "*": evaluationStack.push(a * b); break;
                case "/": evaluationStack.push(a / b); break;
            }
        }
    }

    return evaluationStack[0];
}

// сохранение биндов
function saveAccounts() {
    const accounts = $(".loadAccount").map(( index, item ) => [[$(item).find("span").text(), $(item).find("span").attr("value")]]).get();

    localStorage.setItem("accounts", JSON.stringify(accounts));
}

// параметры для дубликации лотов и тд
async function getParams(id) {
    const lot = await fetch(`https://funpay.com/lots/offerEdit?node=${id.part}&offer=${id.lot}&location=offer`);

    const params = $(await lot.text()).find(".form-control").map(( index, item ) => `${$(item).attr("name")}=${$(item).val()}`).get();

    return params
}

function buildCss(theme) {
    let css = ""

    Object.entries(theme).forEach(([element, styles]) => {
        console.log(element, styles);

        if (element == "body") {
            css += 
            `body {\n` +
                `background: ${styles.color} !important;\n` +
                (styles.url ? `background-image: radial-gradient(circle, rgba(0,0,0,0.5) ${styles.borderRange}%, rgba(0,0,0,0.9) 100%), url("${styles.url}") !important;\n` : "") +
                (styles.url ? `background-repeat: no-repeat !important;\n` : "") +
                (styles.url ? `background-size: cover !important;\n` : "") +
                (styles.url ? `background-position: center center !important;\n` : "") +
                (styles.url ? `background-attachment: fixed !important;\n` : "") +
            `}\n\n`

            return;
        }

        Object.entries(styles).forEach(([key, value]) => {
            css += 
            `${element}${key == ":hover" ? key : ""} {\n` +
                (value["background"].active ? `background: rgb(${hexToRgb(value["background"].color).join(", ")}, ${value["background"].range / 1000}) !important;\n` : "") +
                (value["border-bottom"].active ? `border-bottom: ${value["border"].active ? `1px solid ${value["border-bottom"].color}` : "none"} !important;\n` : "") +
                (value["border-top"].active ? `border-top: ${value["border"].active ? `1px solid ${value["border-top"].color}` : "none"} !important;\n` : "") +
                (value["border-left"].active ? `border-left: ${value["border"].active ? `1px solid ${value["border-left"].color}` : "none"} !important;\n` : "") +
                (value["border-right"].active ? `border-right: ${value["border"].active ? `1px solid ${value["border-right"].color}` : "none"} !important;\n` : "") +
                (value["color"].active ? `color: ${value["color"].color} !important;\n` : "") +
                (value["border-radius"].active ? `border-radius: ${value["border-radius"].range}px !important;\n` : "") +
                (value["padding"].active ? `padding: ${value["padding"].range}px !important;\n` : "") +
                (value["font-size"].active ? `font-size: ${value["font-size"].range}px !important;\n` : "") +
                (value["opacity"].active ? `opacity: ${value["opacity"].range / 10} !important;\n` : "") +
                (key != ":hover" ? `transition: border-radius 0.2s ease-in-out;` : "") +
            "}\n\n"

            if (value["scroll-bar"]) {
                css += 
                `${element}::-webkit-scrollbar${key == ":hover" ? key : ""} {\n` +
                    `background-color: ${value["scroll-bar"].color} !important;\n` +
                "}\n\n"
            }

            if (value["scroll-bg"]) {
                css += 
                `${element}::-webkit-scrollbar-thumb${key == ":hover" ? key : ""} {\n` +
                    `background-color: ${value["scroll-bg"].color} !important;\n` +
                "}\n\n"
            }
        });
    });

    return css;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
        hex = hex.split("").map(x => x + x).join("");
    }
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
}