/**
 * Prevents the game from updating events outside of the screen
 * @experimental Can break cutscenes with characters that move offscreen. Disable if happens so
 */
function eventCulling() {
    Game_Event.prototype.update = function() {
        const dx = this.x - $gamePlayer.x;
        const dy = this.y - $gamePlayer.y;
        if ((Math.abs(dx) > 20 || Math.abs(dy) > 15) && !this._trigger)
            return;
        
        this.checkEventTriggerAuto();
        this.updateParallel();
        return Game_Character.prototype.update.call(this);
    };
}

/** Caches script steps instead of evaling them all the time */
function cacheScripts() {
    const cache = {}; 

    Game_Interpreter.prototype.command355 = function() {
        let script = this.currentCommand().parameters[0];
        while (this.nextEventCode() === 655) {
            this._index++;
            script += this.currentCommand().parameters[0];
        }

        if (!cache[script]) {
            try {
                cache[script] = new Function(script);
            } catch (e) {
                cache[script] = function() { console.error("Script error: " + e); };
            }
        }
        
        cache[script].call(this);
        return true;
    };
}

/**
 * Disables blur on scenes sometimes causing lags
 * @experimental Makes backgrounds blank with a tradeoff of possibly bringing little to no performance
 */
function disableSceneBlur() {
    SceneManager.snapForBackground = function() {
        // this._backgroundBitmap = this.snap();
        this._backgroundBitmap = null;
    };
    Scene_MenuBase.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = null;
        this.addChild(this._backgroundSprite);
    }
}

/**
 * Tweaks image settings
 */
function tweakImages() {
    ImageManager.loadTitle2 = () => null // stub out unused titles2 (start again unused sprite)
    ImageCache.limit = 100 * 1000 * 1000; // 10MP -> 100MP cache 
}

/**
 * Tweaks PIXI.JS settings
 */
function tweakPixi() {
    PIXI.utils.skipHello();
    PIXI.settings.PRECISION_FRAGMENT = "mediump";
    PIXI.settings.GC_MAX_CHECK_COUNT = 1200;
    PIXI.settings.GC_MAX_IDLE = 7200;
}

/**
 * Applies various optimizations to the game
 * @param {boolean} experimental Should include potentially game breaking optimizations? 
 */
export default function applyOptimizations(experimental) {
    tweakPixi()
    tweakImages()
    cacheScripts()
    if (experimental) {
        disableSceneBlur()
        eventCulling()
    }

    // enable unused garbage collector from ports
    if (typeof window.gc === "function")
        console.run_gc = () => window.gc()
}