/**
 * Shows dialogue box on scene
 * 
 * TEMPORARY METHOD UNTIL GAMEINTERPRETERAPI IS MADE. DO NOT USE. IT'S HIGHLY UNSTABLE
 * @param {string} message 
 */
const tempMessageAdd = async (message) => {
    if (!SceneManager._scene._spriteset) {
        SceneManager._scene._spriteset = new Sprite();
        SceneManager._scene.addChild(SceneManager._scene._spriteset);
    }
    if (!SceneManager._scene._spriteset._messageBustSprites) {
        var spriteset = SceneManager._scene._spriteset;
        spriteset._messageBustSprites = [null];
        
        for (var i = 1; i <= 10; i++)
            spriteset._messageBustSprites[i] = new Sprite_VisualNovelBust(i);
    }
    if (!SceneManager._scene._messageWindow) {
        const msg = new Window_Message();
        SceneManager._scene._messageWindow = msg;
        SceneManager._scene.addChild(msg);
    }

    $gameMessage.setPositionType(1);
    $gameMessage.add(message)

    return new Promise(resolve => {
        const term = SceneManager._scene._messageWindow.terminateMessage
        SceneManager._scene._messageWindow.terminateMessage = function() {
            SceneManager._scene._messageWindow.terminateMessage = term;
            term.call(this);
            resolve()
        }
    })
}

export default class Window_ModMenu extends Window_Selectable {
    parentWindow;
    modChanged = false;
    /** @type {import("@/types").Mod[]} */
    _data = [
        ...window.Starshift.mods.values(),
        {
            id: "1111.js",
            name: "test mod",
            description: "test mod not real",
            author: "ok",
            builtIn: false,
            version: "0.0",
            store: { settings: { enabled: true } }
        }
    ]

    constructor(parentWindow) {
        super(0, 0, 500, 500)
        this.parentWindow = parentWindow;
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
        
        this.refresh()
        this.select(0)
        
        this.setHandler("cancel", async () => {
            this.close()

            window.Starshift.saveSettings()
            if (this.modChanged)
                await tempMessageAdd("\\m[vtuto][Psst!\\| You need to restart the game if you want to\ndisable mods! Just saying~]")
            
            this.parentWindow.activate()
        })

        this.setHandler("ok", () => {
            this.modChanged ||= true;
            
            const settings = this._data[this.index()].store.settings;
            settings.enabled = !settings.enabled

            this.redrawCurrentItem();
            this.activate()
        })
        
        this.activate()
        this.open()
    }

    maxItems() { return this._data?.length ?? 0; }

    maxPageRows() {
        const pageHeight = this.height - this.padding * 2 - this.titleHeight()
        return Math.floor(pageHeight / this.itemHeight());
    }

    separatorPadding = 10;
    separatorSize = 2;
    titleTextHeight = 30;
    titleHeight() { return this.titleTextHeight + (this.separatorPadding * 2) + this.separatorSize; }
    modNameHeight = 25;
    modMetaHeight = 15;
    
    itemHeight() { return this.modNameHeight + this.modMetaHeight * 2 + this.padding; }

    itemRect(index) {
        const rect = super.itemRect(index);
        rect.y += this.titleHeight();
        return rect;
    }

    isCurrentItemEnabled() { return !this._data[this.index()]?.builtIn; }

    /** Draws title on top of window */
    drawTitle() {
        this.contents.fontSize = this.titleTextHeight

        // text
        const text = "\\i[135]Mods";
        this.drawTextEx(text, (this.width - this.textWidth(text)) / 2, 0)
        
        // separator
        const lineY = this.titleTextHeight + this.separatorPadding;
        this.contents.fillRect(0, lineY, this.contentsWidth(), this.separatorSize, this.normalColor());
    }

    drawItem(index) {
        const mod = this._data[index];
        if (!mod)
            throw new Error(`No mod found under index ${index}??? That shouldn't happen`)

        const rect = this.itemRect(index);
        this.changeTextColor(mod.store.settings.enabled ? this.normalColor() : "#F00")
        this.changePaintOpacity(!mod.builtIn);

        // title
        this.contents.fontSize = this.modNameHeight;
        this.drawText(`${mod.name} v${mod.version}${mod.store.settings.enabled ? "" : " [X]"}`, rect.x, rect.y, rect.width, "center")
        
        // meta
        this.contents.fontSize = this.modMetaHeight;
        const metaY = rect.y + this.modNameHeight;

        const metaStr = [
            `by ${Array.isArray(mod.author) ? mod.author.join(", ") : mod.author}`,
            mod.description
        ]
        
        for (let i = 0; i < metaStr.length; i++)
            this.drawText(metaStr[i], rect.x, metaY + (i * this.modMetaHeight), rect.width, "center")
    }

    drawAllItems() {
        this.drawTitle()
        super.drawAllItems()
    }
}