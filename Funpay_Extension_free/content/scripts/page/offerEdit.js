if (userData["translate-product"]?.active) {
    $(".form-group.lot-field.bg-light-color.modal-custom-bg-block.modal-custom-bg-block-top").append(`<label class="translate-state control-label">Автоматический переводчик включен</label>`);

    $(`[name="fields[desc][ru]"], [name="fields[summary][ru]"], [name="fields[payment_msg][ru]"]`).on("change", async function() {
        const type = $(this).attr("name").split("[")[1].split("]")[0];

        const result = await translate($(`[name="fields[${type}][ru]"]`).val(), "ru", "en");
        
        $(`[name="fields[${type}][en]"]`).val(result);
    });
}

if (userData["exact-price"]?.active) {
    const inputPrice = $(`input[name="price"]`);

    inputPrice.after(`<div class="set-exact-price">Сделать цену ровной</div>`);   

    $(".set-exact-price").on("click", () => {
        const price = Number(inputPrice.val());
        const commisia = Number($(".js-calc-table-body").find("tr").eq(3).find("td").text().replaceAll(" ", "").split(".")[0]);
        
        if (!/[0-9]/.test(price.toString()) || commisia === 0) { return }
        
        inputPrice.val((price / (1 + (((commisia - price)/price)))).toFixed(2));
    });
}

if (userData["sale-panel"]?.active) {
    (async () => {
        const res = await fetch($(".js-back-link").attr("href").split("trade")[0]);
        const lots = await res.text();

        const panel = await fetch(`${domain}/runner`, { // отправляем все лоты на наш сервер для анализа
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                body: lots,
                action: "panel",
                token: localStorage.getItem("token")
            })
        });

        $(".btn.btn-primary.btn-block.js-btn-save").parent(".margin-top").after(await panel.text());

        $(".set-price").on("click", function() {
            const price = $(this).parents(".panel-product").find(".product-price").text().split(" руб")[0];

            $(`.form-control[name="price"]`).val((+price -0.01).toFixed(2));
        });
    })();
}

if (userData["set-word"]?.active) {
    $(".lot-fields-multilingual").append(`
        <div class="form-group modal-custom-bg-block bg-light-color">
            <label class="control-label">шрифт</label>
            <select class="form-control select-shrift">
                <option value="">Выберите шрифт</option>
                    <option value="small">ᴨоᴨᴩобуй ϶ᴛоᴛ ɯᴩиɸᴛ</option>
                    <option value="canad">ᴨᗝᴨᴩᗝᘜᎽᕫ ϶ᴛᗝᴛ ɯᴩᑌɸᴛ</option>
                    <option value="runi">ᚢᛜᚢᚹᛜᎶᚴᛋ Ⰵᛠᛜᛠ Ⱎᚹᛋᛄᛠ</option>
                    <option value="efilopia">ከዐከየዐፔነህ ጓፐዐፐ ሠየሀዋፐ</option>
                    <option value="angle">⧼п⧽⧼о⧽⧼п⧽⧼р⧽⧼о⧽⧼б⧽⧼у⧽⧼й⧽ ⧼э⧽⧼т⧽⧼о⧽⧼т⧽ ⧼ш⧽⧼р⧽⧼и⧽⧼ф⧽⧼т⧽</option>
            </select>
        </div>
    `);

    $(".lot-field-input").on("input", function(event) {
        const text = event.originalEvent.data;

        if (!text) { return }
        const newFonts = fonts[$(".select-shrift").val()][text.toLowerCase()];

        $(this).val(
            $(this).val().slice(0, -1) + (newFonts ? newFonts : text)
        )
    });
}