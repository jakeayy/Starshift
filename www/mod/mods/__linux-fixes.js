const { readdirSync } = require("fs")
const { join } = require("path")

import { ROOT } from "../const.js"

export const meta = {
	name: "Linux fixes",
	author: "jakeayy",
	description: "Fixes various Linux port issues!",
	forced: true
}

export const onLoad = () => {
	if (require("os").platform() !== "linux") {
		console.warn("This is not linux! Skipping linux fixes...")
		return
	}

	const filesMap = new Map()
	
	// file case fix
	const originalLoadBitmap = ImageManager.loadBitmap
	ImageManager.loadBitmap = function(folder, file, ...args) {
		/** @type {string[]} */
		const files = filesMap.get(folder) ?? (() => {
			const files = readdirSync(join(ROOT, folder))
				.map(f => f.split(".").slice(0, -1).join("."))
			filesMap.set(folder, files)
			return files
		})()

		const found =
			files.includes(file)
				? file
				: files.find(f => f.toLowerCase() === file.toLowerCase()) ?? file
				
		return originalLoadBitmap.apply(this, [folder, found, ...args])
	}
	

}