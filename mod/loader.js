const { join } = require("path")
const { readdir, readFile, writeFile } = require("fs/promises")
const { existsSync, readFileSync } = require("fs")

import { MOD_ROOT, MODS_DIR, RELATIVE_MODS_DIR, SETTINGS_PATH } from "./const.js"
import Logger from "./logger.js"
Logger.patchConsole() // logger functionality

const IS_DISABLED = nw.App.argv.includes("--no-mods")

// delay game load
if (!IS_DISABLED)
	window.onload = null;

window.Starshift = {
	debugMode: typeof process.env.DEBUG === "string",
	mods: new Map(),
	settings: (() => {
		if (!existsSync(SETTINGS_PATH)) return new Map()

		const json = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"))
		return new Map(Object.entries(json))
	})(),
	saveSettings: () =>
		writeFile(SETTINGS_PATH, JSON.stringify(Object.fromEntries(window.Starshift.settings)))
	
}

// DEBUG INIT
if (window.Starshift.debugMode) {
	const win = nw.Window.get();
	document.addEventListener("keydown", ({ key }) => key === "F12" && win.showDevTools())
	win.showDevTools()
}

/** Gets mod loader screen */
const getLoadScreen = (() => {
	let el = null;
	return async () => {
		if (el) return el;
		el = document.createElement("div")

		el.id = "__LOADER"
		el.innerHTML = await readFile(join(MOD_ROOT, "status.html"))
		document.body.prepend(el)

		return el;
	}
})()

/** Prepares, loads and launches mods */
const loadMod = async (fileName) => {
	const { meta = {}, onLoad, onRegister } = await import("./" + join(RELATIVE_MODS_DIR, fileName))

	// default values
	meta.name ??= fileName
	meta.author ??= "Unknown"
	await onRegister?.()

	return { ...meta, onLoad }
}

// async loading process
;(async()=>{
	if (IS_DISABLED) return;

	// preparing mods and loader screen
	const [mods, loader] = await Promise.all([
		readdir(MODS_DIR, { withFileTypes: true })
			.then(l =>
				l.filter(f =>
					f.isFile()
					&& f.name.endsWith(".js")
				)
				.map(f => f.name)
				.sort((na, nb) => na.localeCompare(nb))
			),
		getLoadScreen()
	])

	// loader screen
	const toLoadEl = loader.querySelector("#to-load"),
		currentLoadingEl = loader.querySelector("#currently-loading")
	const updateList = (loadIndex = 0) => {
		toLoadEl.innerHTML = ""

		const els = mods
			.slice(loadIndex)
			.map(f => {
				const el = document.createElement("span")
				el.innerText = f
				return el
			})

		toLoadEl.append(...els)
	}

	// loading...
	for (let i = 0; i < mods.length; i++) {
		updateList(i)

		const fileName = mods[i]
		try {
			currentLoadingEl.innerText = fileName;
			window.Starshift.mods.set(
				fileName,
				await loadMod(fileName)
			)
		}
		catch(e) {
			console.error(`ERROR LOADING ${fileName} -> `, e)
			alert(`Could not load mod ${fileName}! Check "${Logger.LOG_PATH}" for more info.`)
		}
	}

	const loadGame = () => {
		;[...window.Starshift.mods.values()]
			.forEach(({ onLoad }) => onLoad?.());

		SceneManager.run(Scene_Boot);
		loader.remove();
	}

	if (document.readyState === "complete") loadGame();
	else window.onload = () => loadGame()
})();