const { join, relative } = require("path")
const { existsSync, mkdirSync } = require("fs")

export const ROOT = join(nw.__dirname, "www")
export const MOD_ROOT = join(ROOT, "mod")
export const LOGS_PATH = join(MOD_ROOT, "logs")
export const MODS_DIR = join(MOD_ROOT, "mods")
export const RELATIVE_MODS_DIR = relative(MOD_ROOT, MODS_DIR)
export const SETTINGS_PATH = join(StorageManager.localFileDirectoryPath(), "mod.json")

// small file existance checks
if (!existsSync(MODS_DIR))
	mkdirSync(MODS_DIR, { recursive: true })

if (!existsSync(LOGS_PATH))
	mkdirSync(LOGS_PATH, { recursive: true })