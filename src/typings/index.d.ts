import type { RegisteredMod, ModSettingsStore } from "@/types"

declare global {
  interface Window {
    /** Starshift manager variable */
    Starshift: {
      /** Is game running in debug mode? */
      get isDebug(): boolean;

      mods: Map<string, RegisteredMod>;
      /** Starshift settings */
      settings: Map<string, ModSettingsStore>
      /** Loads Starshift settings, true if loaded successfully */
      loadSettings(): Promise<boolean>;
      /** Saves Starshift settings, true if saved successfully */
      saveSettings(): Promise<boolean>;

      /** Creates temporary directory for mods to use */
      tempDir(): string;

      /** Helpers useful for mod making */
      API: typeof import ("@/api")
    };

    /** Starshift constants */
    StarshiftConst: typeof import("@/const");
  }
}
