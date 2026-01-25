![](/icon.webp)
# Starshift
Starshift is a powerful Mod Loader for game ISAT (In Stars And Time) with minimal footprint and as much performance as possible!
> [!CAUTION]
> Currently this project is in **VERY** early stage, things **WILL** break. Pull requests and bug reports are welcome. Although modding with raw game variables would be possible already!

## Installing
1. Clone the repo with `Code` button or:
```sh
git clone https://github.com/jakeayy/Starshift.git
```
2. Move the **`index.html` & `mod`** files to **`www`** directory in your game files!

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
- [ ] - Proper install script w/ Linux Support
- [ ] - Linux Port - Fix Steam connection errors
- [ ] - Possibly more game optimizations? (including memory leak fix)

...and more