type MaybePromise<T> = T | Promise<T>

export type ModSetting = { title: string, helpMessage?: string } & (
    | { type?: "label" }
    | {
        type: "button",
        /** Activated when user clicks the button */
        onOk: () => MaybePromise<void>
    }
    | {
        type: "pick",
        /** X number of choices */
        choices: string[],
        /** Index from choice list (starting from 0) */
        default?: number
    }
    | {
        type: "scale",
        /** Value suffix (visual only) */
        suffix?: string,
        /** Minimal number */
        min: number,
        /** Maximal number (must be bigger than `min`) */
        max: number,
        /** By how many should the value change? Should be smaller than `max` */
        step?: number,
        /** Default value */
        default?: number
    }
)

export type ModConfig = {
    /** Name of the mod */
    name: string,
    /** Description of mod */
    description: string,
    /** Mod version */
    version: string,
    /** Author(s) of mod */
    author: string | string[],
    /** Mod settings, refer to {@link ModSetting} */
    settings?: { [Id in string]: ModSetting },

    /** Function that determines if mod loader should load this mod */
    forceDisable?: () => boolean;
}

export type ModSettingsStore<S extends Record<string, any> = Record<string, any>, ST extends Record<keyof S, any> = Record<keyof S, any>> =
    {
        [K in keyof S as 
            S[K] extends { type: "button" | "label" }
                ? never
                : K
        ]: S[K] extends { "default": any }
            ? S[K]["default"]
            : ST[K]
    } & { enabled: boolean }

type ModStore<C extends ModConfig> = {
    settings: ModSettingsStore<
        C["settings"] extends Record<string, any> ? C["settings"] : Record<string, any>
    >
}

export type Mod<C extends ModConfig = ModConfig> = C & {
    id: string;
    /** Is a core mod? (cannot be disabled in normal way) */
    builtIn: boolean,
    /** Activated when game is loaded */
    onLoad?: ModEvent,
    /** Activated when registering plugin */
    onRegister?: ModEvent,
    /** Mod data */
    store: ModStore<C>
}

export type ModEvent = (mod: Mod<ModConfig>) => MaybePromise<void>
export type ModModule = {
    config: ModConfig,
    onLoad?: ModEvent,
    onRegister?: ModEvent
}