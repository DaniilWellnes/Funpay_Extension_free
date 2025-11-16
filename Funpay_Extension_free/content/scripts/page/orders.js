if (userData?.["fast-report"]?.active) {
    (async () => {
        const res = await fetch(`${domain}/runner`, { // отправляем данные лота на наш сервер
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                body: $("body").html(),
                action: "report",
                token: localStorage.getItem("token")
            })
        });

        const btns = await res.json();

        btns.forEach(( element ) => {
            $(".btn.btn-warning.btn-block.mb5.btn-refund").before(element);
        });
    })();
}

if (userData["bind"]?.[0]) {
    $(".chat-float").append(`<div id="bind-chat" class="order-chat"></div>`);

    userData["bind"].forEach((element) => {  
        if (element.active) {
            $("#bind-chat").append(`<button class="btn_bind" value="${element.value.replaceAll("\"", "&quot;")}" data-send="${element["auto-send"]}">${element.name}</button>`);
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
}