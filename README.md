![](/assets/icon.webp)

[![](https://img.shields.io/badge/GameBanana-get-FFF?logo=gamebanana&logoColor=FFF)](https://gamebanana.com/mods/700828)
[![](https://img.shields.io/badge/Home_Page-visit-FFF)](https://starshift.jakeayy.ch)
[![](https://img.shields.io/gitea/v/release/jakeayy/Starshift?gitea_url=https%3A%2F%2Fcodeberg.org&include_prereleases&logo=codeberg&logoColor=FFF&color=FFF)](https://codeberg.org/jakeayy/Starshift/releases)

# Starshift
Starshift is a powerful Mod Loader for game ISAT (In Stars And Time) with minimal footprint and as much performance as possible!
> [!CAUTION]
> Currently this project is in **VERY** early stage, things **WILL** break. Pull requests and bug reports are welcome. Although modding with raw game variables would be possible already!


## Installing
### a) Automatic
This project includes an installation script that looks for the game's directory and installs all needed files! (Including Steam Integration Fix if on Linux)
#### Windows
```ps1
irm https://codeberg.org/jakeayy/Starshift/raw/branch/main/scripts/install.ps1 | iex
```
#### Linux
```sh
bash <(curl -sSL https://codeberg.org/jakeayy/Starshift/raw/branch/main/scripts/install.sh)
```
> [!WARNING]
> Even though this script is trusted, ALWAYS check it's source before executing! - as a safety measure.

### b) Manual
1. Go to [Releases](https://codeberg.org/jakeayy/Starshift/releases) page
2. Download latest release
3. Unpack all files to game directory. **Ensure path of `www` directory matches the one you just unpacked!**

### c) Building
#### Prerequisites:
- [git (most likely already included if you're on Linux)](https://git-scm.com)
- [npm (included with NodeJS)](https://nodejs.org/) or preferably `pnpm` (`npm i -g pnpm`)
#### Tutorial:
1. Clone the repo with:
    ```sh
    git clone https://codeberg.org/jakeayy/Starshift.git
    ```
2. Navigate to the newly downloaded directory
3. Download dependencies with:
    ```sh
    pnpm install --frozen-lockfile
    ```
4. Build it!
    ```sh
    pnpm build
    ```
5. The final files should be in `dist` directory! Just follow the same steps as from [Manual Guide](#b-manual) or you can use `pnpm inject` to automatically install it to your game
> [!CAUTION]
> Injecting currently works only on Linux and **OVERRIDES ALL YOUR MOD LOADER DATA**. Be sure to backup any mods you care about.


## Options
### Arguments
- `--no-mods` - Runs the game with no mods whatsoever. (also prevents from showing Mods list and it's settings - they're in CORE mod)
### Environment Variables
> [!WARNING]
> The `DEBUG` variable is deprecated! If you have dev variant installed you can enable dev tools with F12.
### Installation Environment Variables
- `DEV` - Installs SDK version of NW.js that includes features like Dev Tools **(USE ONLY AS MOD CREATOR/PROJECT CONTRIBUTOR)**
  When on Windows it asks you by default but you can set it with `$Env:DEV = '1'`.

## TODO
- [ ] - REWRITE - logs
- [ ] - Update Check
- [ ] - Built-in helpers and API
- [ ] - Possibly more game optimizations? (including memory leak fix)

...and more


## Licenses
Both Starshift and Greenworks (that is bundled with this project for compatibility reasons) are licensed under MIT License! Check Starshift's license [here](LICENSE) and Greenwork's license [here](www/lib/GREENWORKS_LICENSE)
