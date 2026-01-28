![](/assets/icon.webp)
# Starshift
Starshift is a powerful Mod Loader for game ISAT (In Stars And Time) with minimal footprint and as much performance as possible!
> [!CAUTION]
> Currently this project is in **VERY** early stage, things **WILL** break. Pull requests and bug reports are welcome. Although modding with raw game variables would be possible already!


## Installing
### a) Automatic (Linux Only)
This project includes an installation script that looks for the game's directory and installs all needed files! (Including Steam Integration Fix)
```sh
bash <(curl -sSL https://raw.githubusercontent.com/jakeayy/Starshift/main/scripts/install.sh)
```
> [!WARNING]
> Even though this script is trusted, ALWAYS check it's source before executing! - as a safety measure.

### b) Manual
1. Go to [Releases](https://github.com/jakeayy/Starshift/releases) page
2. Download latest release
3. Unpack all files to game directory. **Ensure path of `www` directory matches the one you just unpacked!**

### c) Building
#### Prerequisites:
- [git (most likely already included if you're on Linux)](https://git-scm.com)
- [npm (included with NodeJS)](https://nodejs.org/) or preferably [bun runtime](https://bun.sh) (for this guide we'll use bun)
#### Tutorial:
1. Clone the repo with:
    ```sh
    git clone https://github.com/jakeayy/Starshift.git
    ```
2. Navigate to the newly downloaded directory
3. Download dependencies with:
    ```sh
    bun install
    ```
4. Build it!
    ```sh
    bun run build
    ```
5. The final files should be in `dist` directory! Just follow the same steps as from [Manual Guide](#b-manual) or you can use `bun inject` to automatically install it to your game
> [!CAUTION]
> Injecting currently works only on Linux and **OVERRIDES ALL YOUR MOD LOADER DATA**. Be sure to backup any mods you care about.


## Options
### Arguments
- `--no-mods` - Runs the game with no mods whatsoever. (also prevents from showing Mods list and it's settings - they're in CORE mod)
### Environment Variables
- `DEBUG` - Running this will enable some useful features for modding, such as internal NWJS' dev tools


## TODO
- [ ] - REWRITE - internal variable typings
- [x] - REWRITE - loading screen
- [ ] - REWRITE - logs
- [x] - Ability to disable specific mods from menu
- [ ] - Mods and loader in-fly building and caching
- [ ] - Built-in helpers and API
- [ ] - Universal Game Interpreter API for easier RPG Maker scripting support
- [x] - Proper install script w/ Linux Support - **CURRENTLY LINUX ONLY**
- [ ] - Possibly more game optimizations? (including memory leak fix)

...and more


## Licenses
Both Starshift and Greenworks (that is bundled with this project for compatibility reasons) are licensed under MIT License! Check Starshift's license [here](/LICENSE) and Greenwork's license [here](/www/lib/GREENWORKS_LICENSE)
