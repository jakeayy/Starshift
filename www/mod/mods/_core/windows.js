export class Window_ModMenu extends Window_Selectable {
    scene;
    constructor(scene) {
        super(0, 0, 500, 500)
        this.scene = scene;

        this._data = Array.from(window.Starshift.mods.values())
        this.refresh()

        this.updatePlacement()
        this.select(0)

        this.activate()
        this.handleEvents()
    }

    handleEvents() {
        this.setHandler("cancel", () => {
            this.scene._commandWindow.activate()
            this.scene.removeChild(this)
        })
    }

    maxItems() {
        return this._data ? this._data.length : 0;
    }

    itemHeight() {
        return this.lineHeight() * 2;
    }

    isCurrentItemEnabled() {
        return !this._data[this.index()].forced;
    }

    drawItem(index) {
        const item = this._data[index];
        const rect = this.itemRect(index);
        
        this.changePaintOpacity(!item.forced);
        this.drawText(`${item.name} by ${item.author || "Unknown"}`, rect.x, rect.y, rect.width);
        this.drawText(item.description || "", rect.x, rect.y + this.lineHeight(), rect.width);
        this.changePaintOpacity(true);
    }

    updatePlacement() {
        this.x = (Graphics.boxWidth - this.width) / 2;
        this.y = (Graphics.boxHeight - this.height) / 2;
    }
}