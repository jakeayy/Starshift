import { Plugin, PluginBuild } from "esbuild";
import { process } from "htmlnano"
import { readFile } from "fs/promises"

const htmlPlugin = {
    name: "htmlPlugin",
    setup: function (build: PluginBuild) {
        build.onLoad({ filter: /\.html$/ }, async ({ path }) => {
            const data = await process(
                await readFile(path, "utf-8"),
                { minifyJs: false }
            )

            return {
                loader: "text",
                contents: data.html
            }
        })
    }
} satisfies Plugin

export default htmlPlugin;