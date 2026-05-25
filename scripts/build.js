import { build } from "esbuild";
import { mkdir, rm, cp } from "fs/promises";
import { join } from "path"

import importGlobPluginM from "esbuild-plugin-import-glob"
const { default: importGlobPlugin } = importGlobPluginM

import htmlPlugin from "./plugins/html.js"
import supportImportPlugin from "./plugins/support-import.js"


const PROJECT_ROOT = join(import.meta.dirname, "..")
const SRC_ROOT = join(PROJECT_ROOT, "src")
const INCL_DIR = join(import.meta.dirname, "incl")
const DIST_DIR = join(PROJECT_ROOT, "dist")
const DIST_MOD_DIR = join(DIST_DIR, "www", "mod")

await rm(DIST_DIR, { force: true, recursive: true })
await build({
    entryPoints: [
        join(SRC_ROOT, "index.ts")
    ],
    outdir: DIST_MOD_DIR,

    platform: "node",
    target: "node14",
    format: "cjs",

    bundle: true,
    minify: true,
    sourcemap: true,
    banner: { "js": "/** Use dev console to inspect the source code!  */" },

    external: ["node", "v8", "uv", "zlib", "brotli", "ares", "modules", "nghttp2", "napi", "llhttp", "openssl", "icu", "unicode", "nw", "node-webkit", "nw-commit-id", "nw-flavor", "chromium", "greenworks"],
    plugins: [supportImportPlugin, importGlobPlugin(), htmlPlugin],
    loader: {
        ".html": "text"
    }
})


await Promise.all([
    mkdir(join(DIST_MOD_DIR, "mods")),
    cp(INCL_DIR, DIST_DIR, { force: true, recursive: true })
])