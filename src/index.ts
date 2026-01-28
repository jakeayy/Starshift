import { readdir, readFile, rmdir, writeFile } from "fs/promises"
import type { Mod, ModConfig, ModModule, ModSettingsStore } from "@/types";
import { basename, join } from "path";
import { existsSync, mkdirSync } from "fs";
import loaderHtml from "./loader.html"

window.Starshift = class {
    static get isDebug() { return typeof process.env["DEBUG"] === "string"; }
    static get isDisabled() { return nw.App.argv.includes("--no-mods") }

    static mods = new Map();
    static settings = new Map();
    static async loadSettings() {
        try {
            if (!existsSync(window.StarshiftConst.SETTINGS_PATH)) return true;

            const data = JSON.parse(
                await readFile(window.StarshiftConst.SETTINGS_PATH, "utf-8")
            )
            window.Starshift.settings = new Map(Object.entries(data))
            return true
        } catch(e) {
            console.error("Could not load Starshift settings!", e)
            return false
        }
    }
    static async saveSettings() {
        try {
            const data = JSON.stringify(
                Object.fromEntries(window.Starshift.settings)
            )
            await writeFile(window.StarshiftConst.SETTINGS_PATH, data)
            return true
        } catch(e) {
            console.error("Could not save Starshift settings!", e)
            return false
        }
    }

    static tempDir() {
        const path = join(window.StarshiftConst.TEMP_DIR, Math.random().toString(36).slice(2));
        mkdirSync(path, { recursive: true })
        return path
    }

    static API = require("./api")
};

window.StarshiftConst = require("./const.ts");

async function debugLoad() {
    if (!window.Starshift.isDebug) return;
    const win = nw.Window.get();

    win.showDevTools()
    // capturing to prevent others from intercepting the key
	document.body.addEventListener("keydown", ({ key }) =>
        key === "F12" && win.showDevTools(),
    { capture: true })
}

class LoadingScreen {
    private static element?: HTMLDivElement;
    private static modsListEl?: HTMLDivElement;
    private static modsElsMap: Map<string, HTMLSpanElement> = new Map()
    private static protipEl?: HTMLSpanElement;
    private static readonly PROTIPS: string[] = [
        "in fact, alpha was not alpha, i accidentally removed half of alpha and had to rewrite it lol (-7 hours)",
        "originally there was no linux support! but i added it because i play on linux... (isat linux wen)",
        "this is my first ever mod loader project! i think i did good",
        "first EVER mod for starshift was Starshuffler! a randomizer for isat! (by me)",
        "you'll likely never read this message because the loader is so fast i had to artificially slow it down!",
        "you'll never read this protip because i made it not show up in game :b"
    ]

    static loadModNames(names: string[]) {
        if (!this.modsListEl) throw new Error("Loading screen is not ready yet! use .setup() first")

        this.modsElsMap = new Map(
            names.map(n => {
                const el = document.createElement("span")
                el.innerText = n;
                return [n, el]
            })
        )

        this.modsListEl.innerHTML = ""
        this.modsListEl.append(...this.modsElsMap.values())
    }

    static finishLoadingMod(name: string) {
        const el = this.modsElsMap.get(name)
        if (!el) return;

        el.classList.add("finished")
        this.modsElsMap.delete(name)
    }

    static setProtip(text: string) {
        if (!this.protipEl) throw new Error("Loading screen is not ready yet! use .setup() first")
        this.protipEl.innerText = text
    }

    static setRandomProtip() {
        const protip = this.PROTIPS[Math.floor(Math.random() * (this.PROTIPS.length-1))]!
        this.setProtip(protip)
    }

    static setup() {
        if (this.element) return;
        this.element = document.createElement("div")
        this.element.innerHTML = loaderHtml;
        document.body.prepend(this.element)

        this.modsListEl = this.element.querySelector("#to-load")!
        this.protipEl = this.element.querySelector("#protip")!
    }

    static destroy() {
        if (!this.element) return;
        this.modsElsMap.clear()
        this.element.remove()

        this.protipEl = undefined;
        this.modsListEl = undefined;
        this.element = undefined;
    }
}

type ImportedMod = [string, ModModule, boolean]
async function getMods(): Promise<ImportedMod[]> {
    // @ts-expect-error Glob importing
    const { default: builtinMods, filenames: builtInModNames } = await import("./core_mods/*.js") as { default: any[], filenames: string[] }
    const modNames = await readdir(window.StarshiftConst.MODS_DIR, { withFileTypes: true })
        .then(l =>
            l.filter(f =>
                f.isFile()
                && f.name.endsWith(".js")
                && !builtInModNames.includes(basename(f.name, ".js"))
            )
            .map(f => f.name)
            .sort((na, nb) => na.localeCompare(nb))
        )
    
    return [
        // builtin mods
        ...builtInModNames.map<ImportedMod>((n, i) => [n, builtinMods[i], true]),
        // loaded mods
        ...await Promise.all(
            modNames.map<Promise<ModModule>>((n) => import("./" + join(window.StarshiftConst.RELATIVE_MODS_DIR, n)))
        ).then(l => l.map<ImportedMod>((m, i) => [modNames[i]!, m, false]))
    ]
}

async function prepareSettingsStore(id: string, settingsMeta: ModConfig["settings"]): Promise<ModSettingsStore> {
    const store: ModSettingsStore = window.Starshift.settings.get(id) ?? (() => {
        const store = { enabled: true }
        window.Starshift.settings.set(id, store)
        return store
    })()

    if (settingsMeta) {
        for (const [key, meta] of Object.entries(settingsMeta)) {
            if ("default" in meta) {
                store[key] ??= meta.default
                continue;
            }

            switch (meta.type) {
                case "pick": store[key] ??= 0; break;
                case "scale": store[key] ??= meta.min ?? meta.max ?? 0; break;
            }
        }
    }

    return store
}

async function registerMod(id: string, { config, onLoad, onRegister }: ModModule, builtIn: boolean) {
    const settings = await prepareSettingsStore(id, config.settings);
    const isEnabled: boolean = config.forceDisable
        ? !config.forceDisable()
        : (settings["enabled"] ?? true);

    // ensuring enabled always exists
    settings.enabled = isEnabled;

    const mod: Mod = {
        id,
        builtIn,
        store: { settings },
        onLoad,
        onRegister,
        ...config,
    }

    window.Starshift.mods.set(id, mod);
    LoadingScreen.finishLoadingMod(id)
    if (isEnabled) await onRegister?.(mod);
}

async function load() {
    window.onload = null; // delaying game load

    LoadingScreen.setup()
    LoadingScreen.setRandomProtip()

    // clean temporary files
    // @ts-ignore version difference
    await rmdir(window.StarshiftConst.TEMP_DIR, { recursive: true })

    // load mod settings
    await window.Starshift.loadSettings()

    // mod registering
    const mods = await getMods()
    LoadingScreen.loadModNames(mods.map(([n]) => n))
    
    for (const [id, mod, builtIn] of mods)
        await registerMod(id, mod, builtIn)

    const loadGame = async () => {
        await Promise.all(
            [...window.Starshift.mods.values()]
                .filter(m => m.store.settings.enabled)
                .map(mod => mod.onLoad?.(mod))
        )

        LoadingScreen.destroy()
        window.SceneManager.run(Scene_Boot);
    }

	if (document.readyState === "complete") loadGame();
	else window.onload = () => loadGame()
}

if (!window.Starshift.isDisabled)
    Promise.all([
        debugLoad(),
        load()
    ]).catch(e => {
        console.error("ERROR LOADING STARSHIFT! ", e)
        alert("There was an error loading Starshift! Check debug console!")
    })