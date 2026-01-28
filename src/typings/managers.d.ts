export {}

declare global {
  interface Window {
    /** Manages RPG Maker's storage such as saves */
    StorageManager: {
        /** Gets path to the game save directory */
        localFileDirectoryPath: () => string
    },
    /** Manages RPG Maker's scenes */
    SceneManager: {
      /** Initializes and shows scene */
      run(sceneClass: any): void
    }
  }
}