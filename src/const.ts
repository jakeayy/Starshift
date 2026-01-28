import { existsSync, mkdirSync } from "fs";
import { join, relative } from "path";

export const ROOT = join(nw.__dirname, "www");
export const MOD_ROOT = join(ROOT, "mod");
export const LOGS_PATH = join(MOD_ROOT, "logs");
export const MODS_DIR = join(MOD_ROOT, "mods");
export const TEMP_DIR = join(MOD_ROOT, "temp");
export const RELATIVE_MODS_DIR = relative(MOD_ROOT, MODS_DIR);
export const SETTINGS_PATH = join(window.StorageManager.localFileDirectoryPath(), "mod.json");

// directories existance checks
[MODS_DIR, LOGS_PATH].forEach(path =>
    !existsSync(path) && mkdirSync(path, { recursive: true })
)