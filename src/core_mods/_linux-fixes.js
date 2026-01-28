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
	/** @type {Map<string, string[]>} */
	const dirCache = new Map()
	
	// file case fix
	const loadBitmap = ImageManager.loadBitmap
	ImageManager.loadBitmap = function(dir, fileName, ...args) {
		const files = dirCache.get(dir)
			?? (() => {
				const files = readdirSync(join(ROOT, dir))
					.map(f => f.split(".").slice(0, -1).join("."))

				dirCache.set(dir, files)
				return files
			})()

		const correctedFileName =
			files.includes(fileName)
				? fileName
				: files.find(f => f.toLowerCase() === fileName.toLowerCase()) ?? fileName
				
		return loadBitmap.apply(this, [dir, correctedFileName, ...args])
	}
}