// treat demo mode as an override to show analytics UI for demonstration
const DEMO = localStorage.getItem('demo_mode') === '1';
if (userData.analitik?.active || DEMO) {
    const parent = $(".col-md-3.col-sm-4.hidden-xs .pull-right");

    parent.prepend(`<a class="btn btn-default btn-wide analitik">Анализировать рынок</a>`);

    $(".col-md-3.col-sm-4.hidden-xs").append(`<div class="analitik-table"><table class="analitik-block"><tr><th>Проанализировано лотов</th><td id="count"></td></tr><tr><th>Максимальная цена</th><td id="max-price"></td></tr><tr><th>Минимальная цена</th><td id="min-price"></td></tr><tr><th>Средняя цена</th><td id="average"></td>        </tr>        <tr>            <th>Различных продавцов</th>            <td id="individual-sellers"></td>        </tr>        <tr>            <th>Не рублевки</th>            <td id="ruble-plus"></td>        </tr>        <tr>            <th>Проверенных продавцов</th>            <td id="verified-sellers"></td>        </tr>    </table>    <button class="hide-parent">Скрыть</button></div>`);

    $(".analitik").on("click", async () => {
        const res = await fetch(`${domain}/runner`, { // отправляем все лоты на наш сервер
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                body: $("body").html(),
                action: "analitik",
                token: localStorage.getItem("token")
            })
        });

        const data = await res.json(); // результат

        Object.keys(data).forEach(( element ) => { // вставляем все данные в html страницу
            $(`.analitik-table #${element}`).text(data[element]);
        });

        $(".analitik-table").css("display", "flex");
    });

    $(".hide-parent").on("click", function() { $(this).parents(".analitik-table").css("display", "none") });
}

if (userData["download-lots"]?.active || DEMO) {
    const parent = $(".col-md-3.col-sm-4.hidden-xs .pull-right")

    const data = {};

    $(".tc-item").each(( index, element ) => {
        const lot = $(element);

        data[lot.find(".tc-desc-text").text()] = {
            url: lot.attr("href"),
            price: lot.find(".tc-price").data("s"),
            seller: lot.find(".media-body span").text(),
            sellerReview: lot.find(".rating-mini-count").text()
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    parent.prepend(`<a href="${url}" download="lots.json" class="btn btn-default btn-wide export-lot">Экспорт лотов</a>`);
}