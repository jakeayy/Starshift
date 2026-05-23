import { process } from "htmlnano"
import { readFile } from "fs/promises"

/** @satisfies {import("esbuild").Plugin} */
const htmlPlugin = {
    name: "htmlPlugin",
    setup: function (build) {
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
}

export default htmlPlugin;