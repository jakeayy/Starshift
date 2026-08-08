import loaderHtml from "./template.html"

/**
 * Manages the loading screen when mods are loading
 */
export default class LoaderScreen {
    /** The main DIV element of loader */
    private static element?: HTMLDivElement;
    /** Parent for the mods list currently loaded */
    private static modsListEl?: HTMLDivElement;
    /** Map keeping mods bound to it's span element */
    private static modsElsMap: Map<string, HTMLSpanElement> = new Map()
    private static readonly PROTIPS: string[] = [
        "in fact, alpha was not alpha, i accidentally removed half of alpha and had to rewrite it lol (-7 hours)",
        "originally there was no linux support! but i added it because i play on linux... (isat linux wen)",
        "this is my first ever mod loader project! i think i did good",
        "first EVER mod for starshift was Starshuffler! a randomizer for isat! (by me)",
        "you'll likely never read this message because the loader is so fast i had to artificially slow it down!",
        "you'll never read this protip because i made it not show up in game :b"
    ]

    /**
     * Sets up loading screen
     * @returns did succeed?
     */
    static setup() {
      this.element = document.createElement("div")
      this.element.innerHTML = loaderHtml;

      this.modsListEl = this.element.querySelector<HTMLDivElement>("#to-load")!

      this.element.querySelector<HTMLSpanElement>(".protip-container > span")!.innerText = this.PROTIPS[
          Math.floor(Math.random() * (this.PROTIPS.length - 1))
      ]!

      document.body.prepend(this.element)
      return true
    }

    /**
     * Loads all mod names to separate span elements
     * @param names mod names (usually it's file name to load them as quick as possible)
     */
    static loadModNames(names: string[]) {
        if (!this.modsListEl) return

        this.modsElsMap = new Map(
            names.map(name => {
                const el = document.createElement("span")
                el.innerText = name;
                return [name, el]
            })
        )

        this.modsListEl.replaceChildren(...this.modsElsMap.values())
    }

    /**
     * Mark element as finished and hide it
     * @param name mod name
     */
    static finishLoadingMod(name: string) {
        const el = this.modsElsMap.get(name)
        if (!el) return;

        el.classList.add("finished")
        this.modsElsMap.delete(name)
    }

    /**
     * Quick loader cleanup
     */
    static destroy() {
        if (!this.element) return;
        this.modsElsMap.clear()
        this.element.remove()

        this.modsListEl = undefined;
        this.element = undefined;
    }
}
