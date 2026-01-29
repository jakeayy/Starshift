import { join } from "path"
import { readdirSync } from "fs"
import { platform } from "os"

import { ROOT } from "@/const"

/** @satisfies {import("@/types").ModConfig} */
export const config = {
	name: "Linux Fixes",
	author: "jakeayy",
	description: "Fixes various Linux port issues",
	version: "1.0",

	forceDisable: () => platform() !== "linux"
}

export const onLoad = () => {
	/** @type {Map<string, Map<string, string>>} */
	const dirMapCache = new Map()
	
	// file case fix
	const loadBitmap = ImageManager.loadBitmap
	ImageManager.loadBitmap = function(dir, fileName, ...args) {
		let fileMap = dirMapCache.get(dir)

		if (!fileMap) {
			fileMap = new Map();

			try {
				readdirSync(join(ROOT, dir)).forEach(f => {
					const baseName = f.split('.').slice(0, -1).join('.');
					fileMap.set(baseName.toLowerCase(), baseName)
				})
			} catch(e) { console.warn("Could not setup fileMap cache! ", e) }

			dirMapCache.set(dir, fileMap)
		}

		const correctedFileName = fileMap.get(fileName.toLowerCase()) ?? fileName;
		return loadBitmap.apply(this, [dir, correctedFileName, ...args])
	}
}