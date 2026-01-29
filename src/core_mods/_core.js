import applyOptimizations from "./_core/optimizations"
import prepareSettingsMenu from "./_core/settings"
import Window_ModMenu from "./_core/windows"
import { spawn } from "child_process"

/** @satisfies {import("@/types").ModConfig} */
export const config = {
    name: "CORE",
    description: "Core features of Starshift",
    author: "jakeayy",
    version: "0.0",
    settings: {
        fps: {
            title: "FPS Limit",
            helpMessage: "Set max amount of FPS (can't get higher than supported amount on your PC)",
            type: "scale",
            min: 0,
            max: 60,
            step: 10,
            default: 60,
            suffix: " FPS"
        },
        optimizations: {
            title: "Optimizations",
            helpMessage: "Turn on optimizations, REQUIRES GAME RESTART",
            type: "pick",
            choices: ["OFF", "ON"],
            default: 1
        },
        experimentalOptimizations: {
            title: "+ EXPERIMENTAL",
            helpMessage: "(EXPERIMENTAL) Enables unsafe optimizations that might or might not break the game!",
            type: "pick",
            choices: ["OFF", "ON"],
            default: 1
        },
        saveSettings: {
            title: "Save Settings",
            helpMessage: "Saves mod loader settings",
            type: "button",
            onOk: () => {
                window.Starshift.saveSettings()
                SoundManager.playSave()
            }
        },
        restartNoMod: {
            title: "Disable Mod Loader",
            helpMessage: "Force disables loading any mods for next run!",
            type: "button",
            onOk: () => {
                SoundManager.playLoad()
                SceneManager._scene.fadeOutAll()

                setTimeout(() => {
                    spawn(process.execPath, ["--no-mods"], { detached: true, stdio: "ignore" }).unref()
                    nw.App.quit();
                }, 1000)
            }
        }
    }
}

const addModsBtn = () => {
    // button
    const title_makeCommandList = Window_TitleCommand.prototype.makeCommandList
    Window_TitleCommand.prototype.makeCommandList = function() {
        title_makeCommandList.bind(this)()
        this.addCommand("Mods", "mods");
    }

    // event
    const title_createCommandWindow = Scene_Title.prototype.createCommandWindow
    Scene_Title.prototype.createCommandWindow = function() {
        title_createCommandWindow.bind(this)()
        this._commandWindow.setHandler("mods", () => {
            const menu = new Window_ModMenu(this._commandWindow);
            this.addChild(menu)
        });
    }
}

/** @param {import("@/types").Mod<typeof config>["store"]["settings"]} settings  */
const patchFpsLimiter = (settings) => {
    // fps limiter
    SceneManager.requestUpdate = function() {
        if (!this._stopped) {
            requestAnimationFrame(timestamp => {
                if (settings.fps <= 0)
                    return SceneManager.update();
                
                if (!SceneManager._lastFrameTime) SceneManager._lastFrameTime = timestamp;
                var elapsed = timestamp - SceneManager._lastFrameTime;
                var interval = 1000 / settings.fps;
                if (elapsed > interval) {
                    SceneManager._lastFrameTime = timestamp - (elapsed % interval);
                    SceneManager.update();
                } else {
                    SceneManager.requestUpdate();
                }
            });
        }
    }
}

/** @param {import("@/types").Mod<typeof config>} mod  */
export function onRegister(mod) {
    if (mod.store.settings.optimizations)
        applyOptimizations(mod.store.settings.experimentalOptimizations)
    patchFpsLimiter(mod.store.settings)
        
    console.log("if you see this, that means core mod is working! :3")
}

export function onLoad() {
    addModsBtn()
    prepareSettingsMenu()
}