#!/bin/bash

# --- Configuration ---
GAME_NAME="In Stars And Time"

# --- Auto-detect Game Directory ---
find_game_dir() {
    # Known default Steam root locations
    local steam_roots=(
        "$HOME/.steam/steam"
        "$HOME/.local/share/Steam"
        "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"  # Flatpak
        "/usr/share/steam"
        "/usr/local/share/steam"
    )

    # Collect all steamapps paths: defaults + any extra libraries from libraryfolders.vdf
    local steamapps_dirs=()
    for root in "${steam_roots[@]}"; do
        local vdf="$root/steamapps/libraryfolders.vdf"
        steamapps_dirs+=("$root/steamapps")
        if [ -f "$vdf" ]; then
            # Parse "path" entries — covers both old and new VDF formats
            while IFS= read -r line; do
                local lib_path
                lib_path=$(echo "$line" | grep -i '"path"' | sed 's/.*"path"[[:space:]]*"\([^"]*\)".*/\1/')
                if [ -n "$lib_path" ] && [ -d "$lib_path/steamapps" ]; then
                    steamapps_dirs+=("$lib_path/steamapps")
                fi
            done < "$vdf"
        fi
    done

    # Search each steamapps directory for the game folder
    for dir in "${steamapps_dirs[@]}"; do
        local candidate="$dir/common/$GAME_NAME"
        if [ -d "$candidate" ]; then
            echo "$candidate"
            return 0
        fi
    done

    return 1
}

GAME_DIR=$(find_game_dir)

if [ -z "$GAME_DIR" ]; then
    GAME_DIR="$HOME/Games/Steam/steamapps/common/In Stars And Time"
fi

rm -rf "$GAME_DIR/www/mod"
cp -r dist/* "$GAME_DIR"