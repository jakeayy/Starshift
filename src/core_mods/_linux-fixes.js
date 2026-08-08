import { basename, dirname, join, relative } from "path"
import { existsSync, readdirSync } from "fs"
import { platform } from "os"

import { fileURLToPath, pathToFileURL } from "url"

/** @satisfies {import("@/types").ModConfig} */
export const config = {
	name: "Linux Fixes",
	author: "jakeayy",
	description: "Fixes various Linux port issues",
	version: "1.0",

	forceDisable: () => platform() !== "linux"
}

/** @type {Map<string, Map<string, string>>} */
const dirMapCache = new Map()

function getTrueCasePath(targetPath) {
  const cachedPath = dirMapCache.get(targetPath)
  if (cachedPath) return cachedPath
  if (existsSync(targetPath)) return targetPath;


  const dir = dirname(targetPath);
  const base = basename(targetPath);

  // TODO: make function recursive in case of future directory case mismatches
  if (!existsSync(dir)) return targetPath;

  const files = readdirSync(dir);
  const match = files.find(f => f.toLowerCase() === base.toLowerCase());

  if (match) {
    const result = join(dir, match)
    dirMapCache.set(targetPath, result)
    return result
  }

  return targetPath;
}

export const onLoad = () => {


	// file case fix
	chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const reqUrl = details.url;

        if (!reqUrl.startsWith('chrome-extension://') && !reqUrl.startsWith('file://'))
            return {};

        try {
            let localPath = '';

            if (reqUrl.startsWith('file://'))
                localPath = fileURLToPath(reqUrl);
            else if (reqUrl.startsWith('chrome-extension://')) {
                const urlObj = new URL(reqUrl);
                const relativePath = urlObj.pathname.substring(1); // remove leading slash
                localPath = join(process.cwd(), relativePath);
            }

            if (localPath) {
                const actualPath = getTrueCasePath(localPath);

                if (actualPath !== localPath) {
                    let newUrl = '';

                    if (reqUrl.startsWith('file://'))
                        newUrl = pathToFileURL(actualPath).href;
                    else {
                        const urlObj = new URL(reqUrl);
                        const relativeNewPath = relative(process.cwd(), actualPath);
                        newUrl = `chrome-extension://${urlObj.host}/${relativeNewPath.replace(/\\/g, '/')}`;
                    }

                    return { redirectUrl: newUrl };
                }
            }
        } catch (e) {
            console.error('[Starshift] Error intercepting request:', e);
        }

        return {};
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
	);
}
