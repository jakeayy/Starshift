import { build } from "esbuild";
import { mkdir, rm, cp, readFile, writeFile } from "fs/promises";
import { join } from "path"

import importGlobPlugin from "esbuild-plugin-import-glob"
import htmlPlugin from "./plugins/html"

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
    plugins: [importGlobPlugin(), htmlPlugin],
    loader: {
        ".html": "text"
    }
})


await Promise.all([
    writeFile(
        join(DIST_MOD_DIR, "index.js"),
        await readFile(join(DIST_MOD_DIR, "index.js"), "utf-8")
            .then(text => text.replace(/throw new Error\("Module not found in bundle: "\+(.+?)\)/, "return import($1)"))
    ),
    mkdir(join(DIST_MOD_DIR, "mods")),
    cp(INCL_DIR, DIST_DIR, { force: true, recursive: true })
])