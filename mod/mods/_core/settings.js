const getDefaultValue = (type, param) => {
    if (param.default !== null && typeof param.default !== "undefined")
        return param.default;

    switch (type) {
        case "scale": return param.min;
        case "boolean": return false;
        case "pick": return 0;

        case "label":
        default: return null;
    }
}

const createPickOption = (id, param) => {
    ConfigManager[id] = window.Starshift.settings.get(id)
        ?? getDefaultValue("pick", param)

    const changeValCode = (increment) => JSON.stringify(`
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        value${increment ? "++" : "--"};
        value = value.clamp(0, ${param.choices.length - 1});
        this.changeValue(symbol, value);

        window.Starshift.settings.set(symbol, value)
    `)

    return {
        MakeCommandCode: JSON.stringify("this.addCommand(name, symbol, enabled, ext);"),
        DrawItemCode: JSON.stringify(`
            var rect = this.itemRectForText(index);
            var statusWidth = this.statusWidth();
            var titleWidth = (rect.width - statusWidth) / 2;
            var quarterWidth = statusWidth / ${param.choices.length};
            this.resetTextColor();
            this.changePaintOpacity(this.isCommandEnabled(index));
            this.drawOptionsName(index);
            
            var symbol = this.commandSymbol(index);
            var value = this.getConfigValue(symbol);
            
            const list = ${JSON.stringify(param.choices)}
            for (let i = 0; i < list.length; i++) {
                this.changePaintOpacity(value === i);
                var text = list[i];
                this.drawText(list[i], titleWidth + quarterWidth * (i+1), rect.y, quarterWidth, 'center');
            }
        `),
        ProcessOkCode: changeValCode(true),
        CursorRightCode: changeValCode(true),
        CursorLeftCode: changeValCode(false),
        DefaultConfigCode: JSON.stringify(""),
        SaveConfigCode: JSON.stringify(""),
        LoadConfigCode: JSON.stringify("")
    }
}

const createLabelOption = () => {
    return {
        MakeCommandCode: JSON.stringify("this.addCommand(name, symbol, enabled, ext);"),
        DrawItemCode: JSON.stringify(`
            var rect = this.itemRectForText(index);
            var statusWidth = this.statusWidth();
            this.resetTextColor();
            this.changePaintOpacity(false);
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, "center");
        `),
        ProcessOkCode: JSON.stringify(""),
        CursorRightCode: JSON.stringify(""),
        CursorLeftCode: JSON.stringify(""),
        DefaultConfigCode: JSON.stringify(""),
        SaveConfigCode: JSON.stringify(""),
        LoadConfigCode: JSON.stringify("")
    }
}

const createScaleOption = (id, param) => {
    ConfigManager[id] = window.Starshift.settings.get(id)
        ?? getDefaultValue("pick", param)

    const changeValCode = (increment) => JSON.stringify(`
        var index = this.index();
        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);
        value ${increment ? "+" : "-"}= ${param.step ?? 1};
        if (value > ${param.max}) value = ${param.min};
        value = value.clamp(${param.min}, ${param.max});
        this.changeValue(symbol, value);

        window.Starshift.settings.set(symbol, value)
    `)

    return {
        MakeCommandCode: JSON.stringify("this.addCommand(name, symbol, enabled, ext);"),
        DrawItemCode: JSON.stringify(`
            var rect = this.itemRectForText(index);
            var statusWidth = this.statusWidth();
            var titleWidth = rect.width - statusWidth;
            this.resetTextColor();
            this.changePaintOpacity(this.isCommandEnabled(index));
            this.drawOptionsName(index);
            var value = this.getConfigValue(symbol);
            var rate = value / ${param.max};
            this.drawOptionsGauge(index, rate, this.textColor(20), this.textColor(21));
            this.drawText(value+"${param.suffix ?? ""}", titleWidth, rect.y, statusWidth, 'center');
        `),
        ProcessOkCode: changeValCode(true),
        CursorRightCode: changeValCode(true),
        CursorLeftCode: changeValCode(false),
        DefaultConfigCode: JSON.stringify(""),
        SaveConfigCode: JSON.stringify(""),
        LoadConfigCode: JSON.stringify("")
    }
}

const createButtonOption = (param) => {
    return {
        MakeCommandCode: JSON.stringify("this.addCommand(name, symbol, enabled, ext);"),
        DrawItemCode: JSON.stringify(`
            var rect = this.itemRectForText(index);
            var statusWidth = this.statusWidth();
            this.resetTextColor();
            this.changePaintOpacity(this.isCommandEnabled(index));
            this.drawText(\`(\${this.commandName(index)})\`, rect.x, rect.y, rect.width, "left");
        `),
        ProcessOkCode: JSON.stringify(`(${param.onOk})()`),
        CursorRightCode: JSON.stringify(""),
        CursorLeftCode: JSON.stringify(""),
        DefaultConfigCode: JSON.stringify(""),
        SaveConfigCode: JSON.stringify(""),
        LoadConfigCode: JSON.stringify("")
    }
};

const createOption = ({ id, title, description, shown, enabled, type = "label", ...param }) => {
    let codeData;
    switch (type) {
        case "scale": codeData = createScaleOption(id, param); break;
        case "pick": codeData = createPickOption(id, param); break;

        case "button": codeData = createButtonOption(param); break;

        default:
        case "label": codeData = createLabelOption(); break;
    }

    return {
        Name: title,
        Symbol: id,
        HelpDesc: JSON.stringify("<wordwrap>" + description ?? ""),

        ShowHide: JSON.stringify(`show = ${shown ?? true};`),
        Enable: JSON.stringify(`enabled = ${enabled ?? true};`),
        Ext: JSON.stringify("ext = 0;"),
        ...codeData
    }
}

const createOptionsCategory = ({ name, description, options }) => {
    const category = {
        Name: name,
        HelpDesc: JSON.stringify(description),
        OptionsList: options
    }

    Yanfly.Param.OptionsCategories.push(category)
}

export const getSettingId = (modName, settingName) => `${modName}_${settingName}`

export const loadSettings = () => {
    const options = [...window.Starshift.mods.values()]
        .filter(({ settings }) => settings)
        .flatMap(({ name, author, description, settings }, i) => {
            const titleOption = createOption({
                id: `___MODS_SPLITTER_${i}`,
                title: name,
                type: "label",
                description: `(by ${author}) ${description}`,
                enabled: false,
            })
            return [
                titleOption,
                ...Object.entries(settings)
                    .map(([id, info]) =>
                        createOption({ ...info, id: getSettingId(name, id) })
                    )
            ]
        });
    
    createOptionsCategory({
        name: "\\i[135]Mods",
        description: "Options for mods",
        options
    })
}