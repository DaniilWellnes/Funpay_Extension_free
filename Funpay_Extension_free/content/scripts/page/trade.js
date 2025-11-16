if (userData["calculator-lots"]?.active) {
    $(".container").eq(1).append(`
        <div class="stats-part">
            Количество товара:
            <span id="count-part">загрузка...</span>
            <br>
            Сумма всех товаров:
            <span id="summa-part">загрузка...</span>
        </div>
    `);

    (async () => {
        const res = await fetch(`${domain}/runner`, { // отправляем все лоты на наш сервер
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                body: $("body").html(),
                action: "calculator-lots",
                token: localStorage.getItem("token")
            })
        });

        const calculator = await res.json();

        $("#count-part").text(calculator.count);
        $("#summa-part").text(calculator.summa);
    })();
}