const GENERIC_NONE = JSON.stringify("")

/**
 * @param {string} modId 
 * @param {string} settingId 
 * @param {import("@/types").ModSetting} setting 
 */
const createPickOption = (modId, settingId, setting) => {
    const updateValue = (add) => JSON.stringify(`
        const internalId = this.commandSymbol(this.index());
        const newValue = (this.getConfigValue(internalId) ${add ? "+" : "-"} 1).clamp(0, ${setting.choices.length - 1});
        
        window.Starshift.settings.get("${modId}")["${settingId}"] = newValue
        this.changeValue(internalId, newValue)
    `)

    const draw = JSON.stringify(`
        var rect = this.itemRectForText(index);
        var statusWidth = this.statusWidth();
        var titleWidth = rect.width - statusWidth - 140;
        var quarterWidth = statusWidth / 2;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawOptionsName(index);

        var symbol = this.commandSymbol(index);
        var value = this.getConfigValue(symbol);

        const list = ${JSON.stringify(setting.choices)}
        for (let i = 0; i < list.length; i++) {
            this.changePaintOpacity(value === i);
            var text = list[i];
            this.drawText(text, titleWidth + quarterWidth * (i + 1), rect.y, quarterWidth, 'center');
        }
    `)

    return {
        DrawItemCode: draw,
        ProcessOkCode: updateValue(true),
        CursorRightCode: updateValue(true),
        CursorLeftCode: updateValue(false),
    }
}

const createLabelOption = () => {
    return {
        Enable: JSON.stringify("enabled = false"),
        DrawItemCode: JSON.stringify(`
            var rect = this.itemRectForText(index);
            var statusWidth = this.statusWidth();
            this.resetTextColor();
            this.changePaintOpacity(false);
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, "center");
        `),
    }
}

/**
 * @param {string} modId 
 * @param {string} settingId 
 * @param {import("@/types").ModSetting} setting 
 */
const createScaleOption = (modId, settingId, setting) => {
    const changeValCode = (add) => JSON.stringify(`
        const internalId = this.commandSymbol(this.index());
        const newValue = (this.getConfigValue(symbol) ${add ? "+" : "-"} ${setting.step ?? 1}).clamp(${setting.min}, ${setting.max});

        window.Starshift.settings.get("${modId}")["${settingId}"] = newValue
        this.changeValue(internalId, newValue)
    `)

    const draw = JSON.stringify(`
        var rect = this.itemRectForText(index);
        var statusWidth = this.statusWidth();
        var titleWidth = rect.width - statusWidth;
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawOptionsName(index);
        var value = this.getConfigValue(symbol);
        var rate = value / ${setting.max};
        this.drawOptionsGauge(index, rate, this.textColor(20), this.textColor(21));
        this.drawText(value+"${setting.suffix ?? ""}", titleWidth, rect.y, statusWidth, 'center');
    `)

    return {
        DrawItemCode: draw,
        ProcessOkCode: changeValCode(true),
        CursorRightCode: changeValCode(true),
        CursorLeftCode: changeValCode(false),
    }
}

/**
 * @param {import("@/types").ModSetting} setting 
 */
const createButtonOption = (setting) => {
    const draw = JSON.stringify(`
        var rect = this.itemRectForText(index);
        var statusWidth = this.statusWidth();
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        this.drawText(\`(\${this.commandName(index)})\`, rect.x, rect.y, rect.width, "left");
    `)

    return {
        DrawItemCode: draw,
        ProcessOkCode: JSON.stringify(`(${setting.onOk})()`),
    }
};

/**
 * Creates option based on the setting
 * @param {string} modId 
 * @param {string} settingId 
 * @param {import("@/types").ModSetting} setting
 */
const createOption = (modId, settingId, setting) => {
    const internalId = [modId, settingId].join("_")
    ConfigManager[internalId] = window.Starshift.settings.get(modId)[settingId]

    let codeData;
    switch (setting.type) {
        case "scale": codeData = createScaleOption(modId, settingId, setting); break;
        case "pick": codeData = createPickOption(modId, settingId, setting); break;

        case "button": codeData = createButtonOption(setting); break;

        default:
        case "label": codeData = createLabelOption(); break;
    }

    

    return {
        Name: setting.title,
        Symbol: internalId,
        HelpDesc: JSON.stringify(`<wordwrap>${setting.helpMessage ?? ""}`),
        Ext: JSON.stringify("ext = 0"),
        Enable: JSON.stringify("enabled = true"),
        ShowHide: JSON.stringify(`show = true`),
        MakeCommandCode: JSON.stringify("this.addCommand(name, symbol, enabled, ext);"),
        DefaultConfigCode: GENERIC_NONE,
        SaveConfigCode: GENERIC_NONE,
        LoadConfigCode: GENERIC_NONE,
        DrawItemCode: GENERIC_NONE,
        ProcessOkCode: GENERIC_NONE,
        CursorRightCode: GENERIC_NONE,
        CursorLeftCode: GENERIC_NONE,
        ...codeData
    }
}

/** Prepare internal options object and push it to game data */
export default function prepareSettingsMenu() {
    // preparing settings
    const settings = [...window.Starshift.mods.entries()]
        .filter(([, mod]) => mod.settings)
        .flatMap(([ modId, mod ]) => {
            const titleOption = createOption(modId, "", {
                title: mod.name,
                helpMessage: `(by ${mod.author}) ${mod.description}`,
                type: "label",
            })

            return [
                titleOption,
                ...Object.entries(mod.settings)
                    .map(([settingId, setting]) => createOption(modId, settingId, setting))
            ]
        });
    
    // pushing mods category
    Yanfly.Param.OptionsCategories.push({
        Name: "\\i[135]Mods",
        HelpDesc: JSON.stringify("Options for mods"),
        OptionsList: settings
    })
}