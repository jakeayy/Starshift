import "setimmediate"

import { glob } from "fast-glob";
import { Unzip, UnzipInflate, type FlateError, type UnzipFile } from "fflate/node";
import { createReadStream, createWriteStream, mkdirSync } from "fs";
import { join, normalize } from "path";
import { rm } from "fs/promises";
import { spawn } from "child_process";

/**
 * Manager for Packed (ZIP) mods
 */
export default class PackedModManager {
  private static unzipper: Unzip = (() => {
    const o = new Unzip()
    o.register(UnzipInflate);
    return o
  })()

  /**
   * Unpacks packed mod to the mod loader dir
   * @param path Path to the mod archive
   */
  static async prepareMod(path: string) {
    if (!path.endsWith(".zip")) return // not an archive

    const extractionPromises: Promise<void>[] = []

    this.unzipper.onfile = (file: UnzipFile) => {
      const fileName = normalize(file.name)

      if (fileName.endsWith("/")) {
        mkdirSync(
          join(window.StarshiftConst.MODS_DIR, fileName),
          { recursive: true }
        )
        return
      }

      const ws = createWriteStream(join(window.StarshiftConst.MODS_DIR, fileName))

      extractionPromises.push(new Promise<void>((resolve, reject) => {
          ws.on("finish", resolve)
          ws.on("error", reject)
      }))

      file.ondata = (err: FlateError | null, data: Uint8Array<ArrayBuffer>, final: boolean) => {
        if (err) {
          ws.destroy(err)
          return
        }

        ws.write(data)
        if (final) ws.end()
      }

      file.start()
    }

    // loop through chunks
    for await (const chunk of createReadStream(path))
      this.unzipper.push(new Uint8Array(chunk), false)

    this.unzipper.push(new Uint8Array(0), true)
  }

  /**
   * Looks through Mods directory and prepares them all
   */
  static async prepareFromModsDir() {
    const modsPromises: Promise<void>[] = []
    const mods = await glob("*.zip", { cwd: window.StarshiftConst.MODS_DIR })

    for (const fileName of mods) {
      const filePath = join(window.StarshiftConst.MODS_DIR, fileName)

      modsPromises.push(
        this.prepareMod(filePath),
        rm(filePath, { force: true }) // cleanup
      )
    }

    await Promise.all(modsPromises)
  }

  // drag and drop mod install feature
  private static isAdding = false
  private static async handleDragDrop(ev: DragEvent) {
    ev.preventDefault()
    if (this.isAdding || !ev.dataTransfer || ev.dataTransfer.files.length === 0) return;
    this.isAdding = true

    const promises: Promise<void>[] = []
    for (const file of Array.from(ev.dataTransfer.files)) {
      // nwjs adds absolute system path to File API
      const filePath = (file as File & { path: string }).path

      promises.push(
        this.prepareMod(filePath)
      )
    }

    await Promise.all(promises)
    this.isAdding = false

    const shouldRestart = confirm(`New mods (${promises.length}) have been added. Do you want to restart?`)
    if (shouldRestart) {
      SceneManager._scene.fadeOutAll()

      setTimeout(() => {
          spawn(process.execPath, { detached: true, stdio: "ignore" }).unref()
          nw.App.quit();
      }, 1000)
    }
  }

  /**
   * Adds drag and drop event for the install method
   */
  static prepareDragDrop() {
    document.addEventListener("dragover", ev => {
      ev.preventDefault()
      if (ev.dataTransfer)
        ev.dataTransfer.dropEffect = "copy"
    })

    document.addEventListener("drop", this.handleDragDrop.bind(this))
  }
}
