if (!localStorage.getItem("users-status")) { localStorage.setItem("users-status", "{}") };
const usersStatus = JSON.parse(localStorage.getItem("users-status"));

if (userData.translate?.active) {
    $(".chat-form form .chat-form-input").after(`<div class="send-translate">Перевести</div>`);

    $(".send-translate").on("click", async () => {
        const text = $(".chat-form-input textarea").val();

        const result = await translate(text, "ru", "en");

        $(".chat-form-input textarea").val(result);
    });


    $(".chat-message-list").on("click", ".chat-msg-item", async function() {
        if ($(this).find(".chat-msg-translate")[0]) { return }

        const text = $(this).find(".chat-msg-text").text();

        if (/[а-яА-Я]/.test(text) || !/[a-zA-Z]/.test(text)) { return }

        const result = await translate(text, "en", "ru");
        $(this).find(".chat-msg-body").append(`<div class="chat-msg-translate">${result}</div>`);
    });
}

if (userData["user-buy"]?.active) {
    $(".chat-detail-list.custom-scroll").append(`
        <div class="param-item">
            <h5>Продажи, направленные вам.</h5>
            <div id="buy-info">Выполняется подсчёт, пожалуйста, подождите.</div>
        </div>
        <div class="param-item">
            <h5>Продажи, направленные оппоненту.</h5>
            <div id="sell-info">Выполняется подсчёт, пожалуйста, подождите.</div>
        </div>
        <div class="param-item">
            <h5>Рейтинг пользователя</h5>
            <div id="rating-info">Выполняется подсчёт, пожалуйста, подождите.</div>
        </div>
    `);

    (async () => {
        let response = await get_orders(`https://funpay.com/orders/?id=&seller=${$(".media-body").find("a").text()}&state=&game=`);
        $("#sell-info").text(`${response.transaction} транзакций, на общую сумму ${response.summa} рублей.`);

        response = await get_orders(`https://funpay.com/orders/trade?id=&buyer=%09+${$(".media-body").find("a").text()}&state=&game=`);
        $("#buy-info").text(`${response.transaction} транзакций, на общую сумму ${response.summa} рублей.`);

        response = await fetch($(".media-body").find("a").attr("href"));
        const userInfo = $(await response.text());

        $("#rating-info").text(`На данный момент у продавца ${userInfo.find(".text-mini.text-light.mb5").text().split(" ")[0]} отзыва с общей оценкой ${userInfo.find(".big").eq(0).text()}⭐.`);
    })();
}

if (userData["bind"]?.[0]) {
    $(".chat-form").append(`<div id="bind-chat"></div>`);   
    $(".chat-detail-list.custom-scroll").append(`<div id="bind-right"></div>`);   

    userData["bind"].forEach((element) => {  
        if (element.active) {
            $(element["in-right"] ? "#bind-right" : "#bind-chat").append(`<button class="btn_bind" value="${element.value.replaceAll("\"", "&quot;")}" data-send="${element["auto-send"]}">${element.name}</button>`);
        }
    });

    $(".btn_bind").on("click", function() {
        const bind = $(this);

        $(".chat-form-input textarea").val(
            bind.attr("value")
            .replaceAll("{name}", $(".media-body a").text())
            .replaceAll("{myname}", $(".user-link-name").eq(0).text())
            .replaceAll("{sell}", $(".badge.badge-trade")[0] ? $(".badge.badge-trade").eq(0).text() : "0")
        );
        
        const text_size = (37 + (bind.attr("value").split("\n").length - 1) * 17);
        $(".chat-form-input textarea").css("height", text_size + "px");

        if (JSON.parse(bind.data("send"))) { $(".btn.btn-gray.btn-round").click() }
    });
};

if (userData["warning-user"]?.active) {
    const registerDate = $(".param-item").eq(0).text();

    if (["сегодня", "вчера", "2 дня"].some(( item ) => registerDate.indexOf(item) != -1)) {
        $(".param-item div").eq(0)
        .css("background", "red")
        .css("padding", "5px")
        .css("color", "black");
    };
}

if (userData["key-word"]?.active) {
    $(".chat-form-input textarea").on("input", function() {
        let text = $(this).val();

        const words = userData["key-word"].value.split("\n");

        words.forEach(( word ) => {
            if (word.indexOf(" & ") != -1)
                text = text.replaceAll(word.split(" & ")[0] + " ", word.split(" & ")[1] + " ");
        });

        $(this).val(text);
    });
}

if (userData["notes-user"]?.active) {
    const users = Object.keys(usersStatus);

    $(".dropdown-menu-right").eq(0).append(`
        <li>
            <a class="set-status" data-color="red">Мошенник</a>
        </li>
        <li>
            <a class="set-status" data-color="orange">Неадекват</a>
        </li>
        <li>
            <a class="set-status" data-color="lime">Постоянный</a>
        </li>
        <li>
            <a class="set-status" data-color="">Убрать статус</a>
        </li>
    `);

    $(".set-status").on("click", function() {
        const color = $(this).data("color");
        const user = $(".contact-item.active").data("id");

        const contact_item = $("a.contact-item.active");

        if (!contact_item.find(".user-status")[0])
            contact_item.append("<span class=\"user-status\"></span>");

        contact_item.find(".user-status").css("background-color", color);

        if (color != "")
            usersStatus[user] = color;
        else
            delete usersStatus[user];

        localStorage.setItem("users-status", JSON.stringify(usersStatus));
    });

    $("a.contact-item").each(( _, element ) => {
        const user = $(element).data("id");

        if (users.includes(String(user))) {
            $(element).append("<span class=\"user-status\"></span>");
            $(element).find(".user-status").css("background-color", usersStatus[user]);
        }
    });
}

async function get_orders(url) {
    const order = await fetch(url);
    const orders = $(await order.text()).find(".tc-item");

    const stats = {
        transaction: 0,
        summa: 0
    }

    orders.each(( index, element ) => {
        if ($(element).find(".text-warning")[0]) { return }

        stats.transaction ++;
        stats.summa += Number($(element).find(".tc-price").text().split(".")[0]);
    });

    return stats;
}