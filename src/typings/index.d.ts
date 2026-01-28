import type { Mod, ModSettingsStore } from "@/types"

declare global {
  interface Window {
    /** Starshift manager variable */
    Starshift: {
      /** Is game running in debug mode? */
      get isDebug(): boolean;
      /** Did user run the game with `--no-mods` preventing from loading mods? */
      get isDisabled(): boolean;

      mods: Map<string, Mod>;
      /** Mod settings */
      settings: Map<string, ModSettingsStore>
      /** Loads mod settings, true if loaded successfully */
      async loadSettings(): Promise<boolean>;
      /** Saves mod settings, true if saved successfully */
      async saveSettings(): Promise<boolean>;

      /** Creates temporary directory for mods to use */
      tempDir(): string;

      /** Helpers useful for mod making */
      API: typeof import ("@/api")
    };

    /** Starshift constants */
    StarshiftConst: typeof import("@/const");
  }
}