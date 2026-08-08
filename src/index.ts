import { readFile, rmdir, writeFile } from "fs/promises"
import type { RegisteredMod, ModConfig, ModModule, ModSettingsStore } from "@/types";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import glob from "fast-glob";
import PackedModManager from "./PackedMods";
import LoaderScreen from "./loader"

import * as API from "./api"
import * as Const from "./const"

window.Starshift = class {
    static get isDebug() { return typeof process.env["DEBUG"] === "string"; }

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

    static API = API
};

window.StarshiftConst = Const;


type ImportedMod = {
  id: string,
  module: ModModule,
  isBuiltIn: boolean
}

/**
 * Gets list of all mods
 */
async function getMods(): Promise<ImportedMod[]> {
    // @ts-expect-error Glob importing
    const { default: builtinMods, filenames: builtInModNames } = await import("./core_mods/*.js") as { default: ModModule[], filenames: string[] }

    // unpack packed mods first
    await PackedModManager.prepareFromModsDir()

    // THEN load all of them
  const modNames = await glob("*.{js,cjs,mjs}", {
    cwd: window.StarshiftConst.MODS_DIR,
    ignore: [
      `${builtInModNames.map(n => n.replace(/,/, "\\,")).join(",")}.{js,mjs,cjs}`
    ]
  }).then(l => l.sort((na, nb) => na.localeCompare(nb)))

    return [
        // builtin mods
        ...builtInModNames.map<ImportedMod>((id, i) => ({
          id,
          module: builtinMods[i]!,
          isBuiltIn: true
        })),

        // loaded mods
        ...(await Promise.all(
          modNames.map<Promise<ModModule>>((n) =>
            // i hate this hack with burning passion
            new Function("p", "return import(p)")(`./${window.StarshiftConst.RELATIVE_MODS_DIR}/${n}`)
          )
        )).map<ImportedMod>((module, i) => ({
          id: modNames[i]!,
          module,
          isBuiltIn: false
        }))
    ]
}

/**
 * Prepares a store for mod to be used for storing data
 * @param id mod id
 * @param settingsMeta settings of a mod
 * @returns Mod settings store, a reference
 */
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

/**
 * Registers a mod and loads it to the game triggering register event
 * @param mod imported mod to register
 */
async function registerMod({ id, module, isBuiltIn }: ImportedMod) {
    const settings = await prepareSettingsStore(id, module.config.settings);
    const isEnabled: boolean = module.config.forceDisable
        ? !module.config.forceDisable()
        : (settings["enabled"] ?? true);

    // ensuring enabled always exists
    settings.enabled = isEnabled;

    const mod: RegisteredMod = {
        id,
        builtIn: isBuiltIn,
        store: { settings },
        onLoad: module.onLoad,
        onRegister: module.onRegister,
        ...module.config,
    }

    window.Starshift.mods.set(id, mod);
    LoaderScreen.finishLoadingMod(id)

    if (isEnabled)
      await mod.onRegister?.(mod);
}

async function debugLoad() {
    if (!window.Starshift.isDebug) return;

    setTimeout(() => {
      const win = nw.Window.get();

      // capturing to prevent others from intercepting the key
      document.body.addEventListener("keydown", ({ key }) =>
        key === "F12" && win.showDevTools(), { capture: true })

      win.showDevTools()
    }, 2000) // small delay to let the document load
}

async function load() {
  window.onload = null; // delaying game load
  LoaderScreen.setup()

  // clean temporary files and import mods
  const [ mods ] = await Promise.all([
    getMods(), // import mods
    rmdir(window.StarshiftConst.TEMP_DIR, { recursive: true }), // remove temporary files
    window.Starshift.loadSettings() // load settings
  ])

  LoaderScreen.loadModNames(mods.map(({ id }) => id))

  // mod registering
  for (const mod of mods)
    await registerMod(mod)

    const loadGame = async () => {
        await Promise.all(
          Array.from(window.Starshift.mods.values())
                .filter(m => m.store.settings.enabled)
                .map(mod => mod.onLoad?.(mod))
        )

      PackedModManager.prepareDragDrop()
      LoaderScreen.destroy()
      // @ts-expect-error Proper way of loading a scene
      window.SceneManager.run(Scene_Boot);
    }

	if (document.readyState === "complete") loadGame();
	else window.addEventListener("load", loadGame, { once: true })
}


if (!nw.App.argv.includes("--no-mods"))
  Promise.all([
      debugLoad(),
      load()
  ]).catch(e => {
      const msg: string = "message" in e ? e.message : String(e)
      alert(`ERROR LOADING STARSHIFT!\nCheck console for more info.\n\n${msg}`)
      console.error("Could not load Starshift:\n", e)
  })
