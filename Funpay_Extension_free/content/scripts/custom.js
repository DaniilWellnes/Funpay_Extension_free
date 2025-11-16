if (userData["custom"] && window.location.href != "https://funpay.com/extension") {
    let selectedElement;

    $(document).on("mouseenter", "*", function (event) {
        if (
            this.tagName !== "HTML" && 
            this.tagName !== "BODY" &&
            $(this).closest(".custom-panels").length === 0 
        ) {
            $(".hv").removeClass("hv");
            $(this).addClass("hv");
            selectedElement = $(this);
        }
    });

    $(document).on("mouseleave", "*", function (event) {
        if (this.tagName !== "HTML" && this.tagName !== "BODY") {
            $(this).removeClass("hv");
            selectedElement = null;
        }
    });

    // выбор элемента
    $(document).on("click", ".class-swap", function () {
        $(".theme-custom h4").text( $(this).text() );

        $(".theme-custom").addClass("edit");
    });

    // Редактирование в ирл времени (визуально)
    $(document).on("input", ".custom-panels input", function() {
        if ($(this).attr("type") != "checkbox") {
            if ($(this).attr("type") == "color")
                $(this).parents(".checkbox-activate").find("label input").prop("checked", true);
            else
                $(this).parents(".checkbox-label").find(".checkbox-activate label input").prop("checked", true);
        }

        // Вся тема
        let custom_theme = localStorage.getItem("custom-theme-json");
        custom_theme = custom_theme ? JSON.parse(custom_theme) : {};

        custom_theme[$(".theme-panel").data("element")] = buildTheme()[0];
        custom_theme["body"] = buildTheme()[1];

        $(".theme-css").html(buildCss(custom_theme));
    });

    $(document).on("input", ".body-custom input", function() {
        if (!$(this).hasClass("bg-active"))
            $(".bg-active").prop("checked", true);
    });

    // активация всех border-*
    $(document).on("input", ".border-all > input", function() {
        const block = $(this).parents(".checkbox-label").find(".range-px");

        const wall_border = block.find(".checkbox-activate");

        wall_border.each((index, element) => {
            $(element).find("> input").val($(this).val());
            $(element).find("label input").prop("checked", true);
        });
    });

    // Сейв темы
    $(document).on("click", ".settings-action button", () => {
        // текущие настройки
        const theme = buildTheme();

        const element = $(".theme-panel").data("element");

        // Вся тема
        let custom_theme = localStorage.getItem("custom-theme-json");

        // если уже есть — парсим, если нет — создаём пустой объект
        custom_theme = custom_theme ? JSON.parse(custom_theme) : {};

        custom_theme[element] = theme[0];

        // проверка настройки фона
        if (theme[1].active)
            custom_theme["body"] = theme[1];

        console.log(custom_theme);

        localStorage.setItem("custom-theme-json", JSON.stringify(custom_theme));

        // преображаем в css для моментальной загрузки в кастом тему
        const css = buildCss(custom_theme);

        // сохраняем
        const allCss = JSON.parse(localStorage.getItem("extension_css"));
        allCss["custom"] = css;
        localStorage.setItem("extension_css", JSON.stringify(allCss));
    });

    // переключение разделов меню
    $(document).on("change", ".switch-themes input", function() {
        const state = $(this).prop("checked");

        $(".default-settings").css("display", state ? "none" : "flex");
        $(".hover-settings").css("display", state ? "flex" : "none")
    });

    // отслеживание кнопок
    $(document).on("keydown", function (event) {
        if (selectedElement) {
            switch (event.key) {
                case "x":
                    selectedElement.remove();

                    break;
                case "ArrowDown":
                    event.preventDefault();

                    const newSelect = selectedElement.children();

                    if (newSelect[0]) {
                        selectedElement = newSelect.eq(0);

                        $(".hv").removeClass("hv");
                        selectedElement.addClass("hv");
                    }

                    break;
                case "ArrowUp":
                    event.preventDefault();

                    selectedElement = selectedElement.parent();

                    $(".hv").removeClass("hv");
                    selectedElement.addClass("hv");
                    break;
                case "ArrowRight":
                    event.preventDefault();

                    const nextElement = selectedElement.next();
                    if (nextElement[0]) {
                        selectedElement = nextElement;
                    
                        $(".hv").removeClass("hv");
                        selectedElement.addClass("hv");
                    }

                    break;
                case "ArrowLeft":
                    event.preventDefault();

                    const prevElement = selectedElement.prev();
                    if (prevElement[0]) {
                        selectedElement = prevElement;
                    
                        $(".hv").removeClass("hv");
                        selectedElement.addClass("hv");
                    }

                    break;
                case "z":
                    if ($(".custom-panels")[0]) {
                        $($(".theme-panel").data("element")).attr("style", "");
                        $(".custom-panels").remove();
                        return;
                    }

                    const element = buildPath(selectedElement);

                    // стили элемента если он раньше настраивался
                    let element_config = localStorage.getItem("custom-theme-json");
                    element_config = element_config ? JSON.parse(element_config) : {};

                    $(element).css("border", "1px solid red");

                    $("body").append(`
                        <div class="custom-panels">
                            <div>
                                <p>Иногда после внесённых изменений элементы могут отображаться некорректно. Чтобы увидеть правильный результат, обновите страницу.</p>
                            </div>
                            <div class="body-custom">
                                <div class="checkbox-label">
                                    <span>Цвет фона</span>
                                    <input class="bg-url" placeholder="Ссылка на изображение" value="${element_config["body"] ? element_config["body"].url : ""}">
                                    <div class="checkbox-activate">
                                        <label><input type="checkbox" class="bg-active" ${element_config["body"] ? element_config["body"].active ? "checked" : "" : ""}></label>
                                        <input class="color-mark bg-color" type="color" value="${element_config["body"] ? element_config["body"].color : "0"}">      
                                    </div>
                                </div>
                                <div class="checkbox-label">
                                    <span>Затемнение краев</span>
                                    <input class="range-box bg-border" type="range" data-key="background" max="100" value="${element_config["body"] ? element_config["body"].borderRange : "0"}">
                                </div>
                            </div>
                            <div class="theme-panel" data-element="${element}">
                                <div class="default-settings part" data-key="default">
                                    <div class="checkbox-label">
                                        <span>Цвет фона</span>
                                        <input class="range-box" type="range" data-key="background" max="1000" value="${element_config[element] ? element_config[element].default.background.range : "1000"}">
                                        <div class="checkbox-activate bg" data-key="background">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default.background.active ? "checked" : "" : ""}></label>
                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default.background.color : ""}">      
                                        </div>
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Цвет текста</span>
                                        <div class="checkbox-activate" data-key="color">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default.color.active ? "checked" : "" : ""}></label>
                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default.color.color : ""}">      
                                        </div>
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Обводка</span>
                                        <div class="checkbox-activate border-active" data-key="border">
                                            <label><input type="checkbox" checked></label>  
                                        </div>
                                        <div class="checkbox-activate border-all" data-key="nulls">
                                            <label><input type="checkbox"></label>
                                            <input class="color-mark" type="color">      
                                        </div>
                                        <div class="box-h range-px">
                                            <div class="checkbox-activate" data-key="border-left">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element].default["border-left"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["border-left"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-top">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element].default["border-top"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["border-top"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-right">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element].default["border-right"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["border-right"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-bottom">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element].default["border-bottom"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["border-bottom"].color : ""}">      
                                            </div>
                                        </div>
                                    </div>
                                    <div class="checkbox-label"  data-key="border-radius">
                                        <span>Закругление краев</span>
                                        <div class="checkbox-activate" data-key="border-radius">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["border-radius"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="border-radius" max="20" value="${element_config[element] ? element_config[element].default["border-radius"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Растояние краев</span>
                                        <div class="checkbox-activate" data-key="padding">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["padding"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="padding" max="30" value="${element_config[element] ? element_config[element].default["padding"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Размер текста</span>
                                        <div class="checkbox-activate" data-key="font-size">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["font-size"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="font-size" min="10" max="30" value="${element_config[element] ? element_config[element].default["font-size"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Прозрачность</span>
                                        <div class="checkbox-activate" data-key="opacity">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["opacity"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="opacity" min="0" max="10" value="${element_config[element] ? element_config[element].default["opacity"].range : "0"}">
                                    </div>
                                    ${
                                        ($(element)[0].scrollHeight > $(element)[0].clientHeight) ?
                                            `
                                                <div class="checkbox-label">
                                                    <span>Скролл бар</span>
                                                    <div class="box-h scroll">
                                                        <div class="checkbox-activate" data-key="scroll-bar">
                                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["scroll-bar"].active ? "checked" : "" : ""}></label>
                                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["scroll-bar"].color : ""}">      
                                                        </div>
                                                        <div class="checkbox-activate" data-key="scroll-bg">
                                                            <label><input type="checkbox" ${element_config[element] ? element_config[element].default["scroll-bg"].active ? "checked" : "" : ""}></label>
                                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element].default["scroll-bg"].color : ""}">      
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                        : ""
                                    }
                                </div>
                                <div class="hover-settings part" data-key=":hover">
                                    <div class="checkbox-label">
                                        <span>Цвет фона</span>
                                        <input class="range-box" type="range" data-key="background" max="1000" value="${element_config[element] ? element_config[element][":hover"].background.range : "1000"}">
                                        <div class="checkbox-activate bg" data-key="background">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"].background.active ? "checked" : "" : ""}></label>
                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"].background.color : ""}">      
                                        </div>
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Цвет текста</span>
                                        <div class="checkbox-activate" data-key="color">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"].color.active ? "checked" : "" : ""}></label>
                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"].color.color : ""}">      
                                        </div>
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Обводка</span>
                                        <div class="checkbox-activate border-active" data-key="border">
                                            <label><input type="checkbox" checked></label>  
                                        </div>
                                        <div class="checkbox-activate border-all" data-key="nulls">
                                            <label><input type="checkbox"></label>
                                            <input class="color-mark" type="color">      
                                        </div>
                                        <div class="box-h range-px">
                                            <div class="checkbox-activate" data-key="border-left">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["border-left"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["border-left"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-top">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["border-top"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["border-top"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-right">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["border-right"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["border-right"].color : ""}">      
                                            </div>
                                            <div class="checkbox-activate" data-key="border-bottom">
                                                <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["border-bottom"].active ? "checked" : "" : ""}></label>
                                                <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["border-bottom"].color : ""}">      
                                            </div>
                                        </div>
                                    </div>
                                    <div class="checkbox-label"  data-key="border-radius">
                                        <span>Закругление краев</span>
                                        <div class="checkbox-activate" data-key="border-radius">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["border-radius"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="border-radius" max="20" value="${element_config[element] ? element_config[element][":hover"]["border-radius"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Растояние краев</span>
                                        <div class="checkbox-activate" data-key="padding">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["padding"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="padding" max="30" value="${element_config[element] ? element_config[element][":hover"]["padding"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Размер текста</span>
                                        <div class="checkbox-activate" data-key="font-size">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["font-size"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="font-size" min="10" max="30" value="${element_config[element] ? element_config[element][":hover"]["font-size"].range : "0"}">
                                    </div>
                                    <div class="checkbox-label">
                                        <span>Прозрачность</span>
                                        <div class="checkbox-activate" data-key="opacity">
                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["opacity"].active ? "checked" : "" : ""}></label>
                                        </div>
                                        <input class="range-box" type="range" data-key="opacity" min="0" max="10" value="${element_config[element] ? element_config[element][":hover"]["opacity"].range : "0"}">
                                    </div>
                                    ${
                                        ($(element)[0].scrollHeight > $(element)[0].clientHeight) ?
                                            `
                                                <div class="checkbox-label">
                                                    <span>Скролл бар</span>
                                                    <div class="box-h scroll">
                                                        <div class="checkbox-activate" data-key="scroll-bar">
                                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["scroll-bar"].active ? "checked" : "" : ""}></label>
                                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["scroll-bar"].color : ""}">      
                                                        </div>
                                                        <div class="checkbox-activate" data-key="scroll-bg">
                                                            <label><input type="checkbox" ${element_config[element] ? element_config[element][":hover"]["scroll-bg"].active ? "checked" : "" : ""}></label>
                                                            <input class="color-mark" type="color" value="${element_config[element] ? element_config[element][":hover"]["scroll-bg"].color : ""}">      
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                        : ""
                                    }
                                </div>
                                <div class="settings-action">
                                    <button>Сохранить</button>
                                    <label class="switch-themes">
                                        Наведение
                                        <input type="checkbox">
                                    </label>
                                </div>
                            </div>
                        </div>
                    `);

                    break;
            }
        }
    });

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

    function buildPath($el) {
        let path = [];
        let current = $el;

        while (current.length) {
            let tag = current.prop("tagName").toLowerCase();
            let cls = current.attr("class");

            // если это исходный элемент (тот что передали в функцию)
            if ($el.is(current)) {
                if (current.attr("id")) {
                    tag += "#" + current.attr("id");
                } else if (cls) {
                    tag += "." + cls.trim().replace(/\s+/g, ".");
                }
                path.unshift(tag);
            } else {
                if (cls && !cls.split(/\s+/).includes("hv")) {
                    path.unshift(tag + "." + cls.trim().replace(/\s+/g, "."));
                    break;
                } else {
                    path.unshift(tag);
                }
            }

            current = current.parent();
        }

        return path.join(" ").replace(".hv", "");
    }

    function buildTheme() {
        const background = {
            active: $(".bg-active").val(),
            color: $(".bg-color").val(),
            borderRange: $(".bg-border").val(),
            url: $(".bg-url").val()
        }

        const result = {
            "default": {},
            ":hover": {}
        };

        $(".theme-panel .checkbox-activate").each(( index, element ) => {
            const key = $(element).data("key");
            const part = $(element).parents(".part").data("key");

            result[part][key] = {
                active: $(element).find("label input").prop("checked"),
                color: $(element).find("> input").val()
            }
        });

        $(".theme-panel .range-box").each(( index, element ) => {
            const key = $(element).data("key");
            const part = $(element).parents(".part").data("key");

            if (result[part][key])
                result[part][key].range = $(element).val();
            else 
                result[part][key] = { range: $(element).val() };
        });

        return [result, background];
    }
}