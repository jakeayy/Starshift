![](/icon.webp)
# Starshift
Starshift is a powerful Mod Loader for game ISAT (In Stars And Time) with minimal footprint and as much performance as possible!
> [!CAUTION]
> Currently this project is in **VERY** early stage, things **WILL** break. Pull requests and bug reports are welcome. Although modding with raw game variables would be possible already!


## Installing
### a) Automatic (Linux Only)
This project includes an installation script that looks for the game's directory and installs all needed files! (Including Steam Integration Fix)
```sh
curl -sSL https://raw.githubusercontent.com/jakeayy/Starshift/main/install.sh | bash
```
> [!WARNING]
> Even though this script is trusted, ALWAYS check it's source before executing! - as a safety measure.

### b) Manual
1. Clone the repo with `Code` button or:
```sh
git clone https://github.com/jakeayy/Starshift.git
```
2. Move the **`www`** directory to your game directory!


## Options
### Arguments
- `--no-mods` - Runs the game with no mods whatsoever. (also prevents from showing Mods list and it's settings - they're in CORE mod)
### Environment Variables
- `DEBUG` - Running this will enable some useful features for modding, such as internal NWJS' dev tools


## TODO
- [ ] - Ability to disable specific mods from menu
- [ ] - Settings - Boolean option support
- [ ] - Mods and loader in-fly building and caching
- [ ] - Built-in Helpers
- [x] - Proper install script w/ Linux Support - **CURRENTLY LINUX ONLY**
- [x] - Linux Port - Fix Steam connection errors - **INSTALL THROUGH INSTALLER FOR SUPPORT**
- [ ] - Possibly more game optimizations? (including memory leak fix)

...and more


## Licenses
Both Starshift and Greenworks (that is bundled with this project for compatibility reasons) are licensed under MIT License! Check Starshift's license [here](/LICENSE) and Greenwork's license [here](/www/lib/GREENWORKS_LICENSE)