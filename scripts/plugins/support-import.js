import { readFile } from "fs/promises";

/** @satisfies {import("esbuild").Plugin} */
const dynamicModLoaderPlugin = {
    name: "dynamic-mod-loader",
    setup(build) {
        build.onLoad({ filter: /src\/index\.ts$/ }, async (args) => {
            let contents = await readFile(args.path, "utf-8");

            const before = `import("./" + join(window.StarshiftConst.RELATIVE_MODS_DIR, n))`;
            const after  = `Promise.resolve().then(() => require("./" + join(window.StarshiftConst.RELATIVE_MODS_DIR, n)))`;

            if (!contents.includes(before)) {
                throw new Error(
                    "[dynamic-mod-loader] Could not find the expected dynamic import expression in index.ts.\n" +
                    "The source may have changed — update this plugin to match."
                );
            }

            return { contents: contents.replace(before, after), loader: "ts" };
        });
    },
};

export default dynamicModLoaderPlugin;