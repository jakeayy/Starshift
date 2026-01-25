import { loadSettings, getSettingId } from "./_core/settings.js";
import { Window_ModMenu } from "./_core/windows.js"

export const meta = {
    name: "CORE",
    author: "jakeayy",
    description: "Essentials for mod loader.",
    forced: true,
    settings: {
        fps: {
            title: "FPS Limit",
            description: "Set max amount of FPS (can't get higher than supported amount on your PC)",
            type: "scale",
            min: 0,
            max: 60,
            step: 10,
            default: 60,
            suffix: " FPS"
        },
        saveSettings: {
            title: "Save Settings",
            description: "Saves mod loader settings",
            type: "button",
            onOk: () => {
                window.Starshift.saveSettings()
                SoundManager.playSave()
            }
        },
        restartNoMod: {
            title: "Disable Mod Loader",
            description: "Force disables loading any mods for next run!",
            type: "button",
            onOk: () => {
                SoundManager.playLoad()
                SceneManager._scene.fadeOutAll()

                setTimeout(() => {
                    require("child_process").spawn(process.execPath, ["--no-mods"], { detached: true, stdio: "ignore" }).unref()
                    nw.App.quit();
                }, 1000)
            }
        }
    }
}


export const onRegister = () => {
    console.log("if you see this, that means core mod is working! :D")
}

export const onLoad = () => {
    loadSettings()

    // mods button
    const title_makeCommandList = Window_TitleCommand.prototype.makeCommandList
    Window_TitleCommand.prototype.makeCommandList = function() {
        title_makeCommandList.bind(this)()
        this.addCommand("Mods", 'mods');
    }

    const title_createCommandWindow = Scene_Title.prototype.createCommandWindow
    Scene_Title.prototype.createCommandWindow = function() {
        title_createCommandWindow.bind(this)()
        this._commandWindow.setHandler('mods', () => {
            const menu = new Window_ModMenu(this);
            this.addChild(menu)
        });
    }

    // fps limiter
    SceneManager.requestUpdate = function() {
        const targetFps = ConfigManager[getSettingId(meta.name, "fps")];

        if (!this._stopped) {
            requestAnimationFrame(timestamp => {
                if (targetFps <= 0) return SceneManager.update();

                if (!SceneManager._lastFrameTime) SceneManager._lastFrameTime = timestamp;
                var elapsed = timestamp - SceneManager._lastFrameTime;
                var interval = 1000 / targetFps;
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