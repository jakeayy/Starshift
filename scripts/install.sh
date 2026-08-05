#!/bin/bash

# Exit on error, on unset variables, and on failures inside pipelines.
set -euo pipefail

# --- Configuration ---
# Both titles are confirmed to work with this mod loader, so we search for either.
GAME_NAMES=("In Stars And Time" "In Stars And Time Demo")
# NOTE: pinned deliberately — this must match the version the game's
# original Windows build ships with, so don't bump it casually.
NWJS_VERSION="0.49.2"
REPO_URL="https://codeberg.org/jakeayy/Starshift"

# --- Colors for Output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set DEV=1 to install the SDK build of NW.js (includes DevTools)
# ${DEV:-} avoids an "unbound variable" error under `set -u` when DEV isn't set at all.
if [[ "${DEV:-}" == "1" ]]; then
    NWJS_URL="https://dl.nwjs.io/v${NWJS_VERSION}/nwjs-sdk-v${NWJS_VERSION}-linux-x64.tar.gz"
else
    NWJS_URL="https://dl.nwjs.io/v${NWJS_VERSION}/nwjs-v${NWJS_VERSION}-linux-x64.tar.gz"
fi

TEMP_DIR=$(mktemp -d) || { echo -e "${RED}Error: failed to create a temporary directory.${NC}"; exit 1; }
# Always clean up the temp dir, whether we exit cleanly, on error, or via Ctrl-C.
trap 'rm -rf "$TEMP_DIR"' EXIT

# --- Dependency Check ---
# curl and wget are both required; tar is always needed for NW.js.
# unzip is only needed if the release ships as a .zip, but we check it
# now so the user can install everything missing in one go.
check_deps() {
    local missing=()
    local required=(curl wget tar)
    local optional=(unzip)

    for bin in "${required[@]}"; do
        if ! command -v "$bin" &> /dev/null; then
            missing+=("$bin")
        fi
    done

    local missing_optional=()
    for bin in "${optional[@]}"; do
        if ! command -v "$bin" &> /dev/null; then
            missing_optional+=("$bin")
        fi
    done

    if [ ${#missing_optional[@]} -gt 0 ]; then
        echo -e "${YELLOW}Warning: optional dependency not found: ${missing_optional[*]}${NC}"
        echo "  'unzip' is required only if the mod release is packaged as a .zip."
        echo "  Install it now to avoid a potential failure later."
        echo ""
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Error: missing required dependencies: ${missing[*]}${NC}"
        echo ""
        echo "Install them with your package manager, for example:"
        echo "  Debian/Ubuntu:  sudo apt install ${missing[*]}"
        echo "  Fedora:         sudo dnf install ${missing[*]}"
        echo "  Arch:           sudo pacman -S ${missing[*]}"
        echo "  openSUSE:       sudo zypper install ${missing[*]}"
        exit 1
    fi
}

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
                # Most lines won't match "path" — grep exits 1 on no-match, so under
                # `pipefail` this whole pipeline would report failure. `|| true` keeps
                # that expected case from tripping `set -e`.
                lib_path=$(echo "$line" | grep -i '"path"' | sed 's/.*"path"[[:space:]]*"\([^"]*\)".*/\1/') || true
                if [ -n "$lib_path" ] && [ -d "$lib_path/steamapps" ]; then
                    steamapps_dirs+=("$lib_path/steamapps")
                fi
            done < "$vdf"
        fi
    done

    # De-duplicate by resolved real path. Several of the "known roots" above
    # are often the same physical directory (e.g. ~/.steam/steam is typically
    # a symlink into ~/.local/share/Steam), and libraryfolders.vdf can also
    # re-list the default library — without this we'd scan the same
    # steamapps folder multiple times and offer duplicate choices.
    local unique_dirs=()
    local seen=""
    for dir in "${steamapps_dirs[@]}"; do
        local resolved
        resolved=$(realpath -m "$dir" 2>/dev/null || echo "$dir")
        if [[ "$seen" != *"|$resolved|"* ]]; then
            seen+="|$resolved|"
            unique_dirs+=("$dir")
        fi
    done
    steamapps_dirs=("${unique_dirs[@]}")

    # Search each steamapps directory for any of the accepted game folder names.
    # Print every match (one per line) so the caller can decide what to do
    # when more than one candidate is found.
    local found=()
    for dir in "${steamapps_dirs[@]}"; do
        for name in "${GAME_NAMES[@]}"; do
            local candidate="$dir/common/$name"
            if [ -d "$candidate" ]; then
                found+=("$candidate")
            fi
        done
    done

    if [ ${#found[@]} -eq 0 ]; then
        return 1
    fi

    local unique_found=()
    seen=""
    for candidate in "${found[@]}"; do
        local resolved
        resolved=$(realpath -m "$candidate" 2>/dev/null || echo "$candidate")
        if [[ "$seen" != *"|$resolved|"* ]]; then
            seen+="|$resolved|"
            unique_found+=("$candidate")
        fi
    done

    printf '%s\n' "${unique_found[@]}"
    return 0
}

clear
echo -e "${GREEN}=== Starshift Mod Loader Installer ===${NC}"
echo ""

# --- Check Dependencies ---
check_deps

# --- Locate Game ---
echo -e "${GREEN}Searching for a supported installation (${GAME_NAMES[*]})...${NC}"
# find_game_dir legitimately returns 1 (with empty output) when nothing is found —
# guard the call so that expected case doesn't trigger `set -e`.
FOUND_DIRS=()
if MATCHES=$(find_game_dir); then
    while IFS= read -r line; do
        [ -n "$line" ] && FOUND_DIRS+=("$line")
    done <<< "$MATCHES"
fi

if [ ${#FOUND_DIRS[@]} -eq 0 ]; then
    echo -e "${YELLOW}Could not auto-detect game directory.${NC}"
    read -rp "Please enter the full path to the game folder: " GAME_DIR < /dev/tty
    GAME_DIR="${GAME_DIR%/}"        # Strip trailing slash
    GAME_DIR="${GAME_DIR/#\~/$HOME}" # Expand a leading ~ manually (the shell won't do it from a read)
elif [ ${#FOUND_DIRS[@]} -eq 1 ]; then
    GAME_DIR="${FOUND_DIRS[0]}"
    echo -e " - Found: ${GREEN}$GAME_DIR${NC}"
else
    echo -e " - Found ${#FOUND_DIRS[@]} matching installations:"
    for i in "${!FOUND_DIRS[@]}"; do
        echo "   $((i + 1))) ${FOUND_DIRS[$i]}"
    done
    echo ""
    while true; do
        read -rp "Which one would you like to install to? (1-${#FOUND_DIRS[@]}): " choice < /dev/tty
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#FOUND_DIRS[@]} ]; then
            GAME_DIR="${FOUND_DIRS[$((choice - 1))]}"
            break
        fi
        echo -e "${RED}Invalid choice. Please enter a number between 1 and ${#FOUND_DIRS[@]}.${NC}"
    done
    echo -e " - Selected: ${GREEN}$GAME_DIR${NC}"
fi
echo ""

# 1. Verify Clean Install
echo -e "${YELLOW}IMPORTANT:${NC} Before proceeding, please ensure:"
echo "1. You have verified the integrity of game files on Steam."
echo "2. You are running on a CLEAN installation of the game."
echo ""
read -p "Have you verified these steps? (y/n): " confirm_clean < /dev/tty

if [[ "$confirm_clean" != "y" && "$confirm_clean" != "Y" ]]; then
    echo -e "${RED}Aborting installation. Please verify your game files and try again.${NC}"
    exit 1
fi

# Check if Game Directory Exists
if [ ! -d "$GAME_DIR" ]; then
    echo -e "${RED}Error: Game directory not found at:${NC}"
    echo "  $GAME_DIR"
    echo "Please ensure one of the supported titles (${GAME_NAMES[*]}) is installed via Steam, then re-run this script."
    exit 1
fi
echo -e " - Game directory confirmed."

# 2. Download and Install Latest Release
echo ""
echo -e "${GREEN}Fetching latest release info...${NC}"

# Get the download URL for the latest release (first asset)
# `|| true` guards against `pipefail`: grep legitimately returns 1 if the API
# response has no matching asset, and that shouldn't kill the script here —
# the `if [ -n "$DOWNLOAD_URL" ]` check below already handles that case.
DOWNLOAD_URL=$(curl -s "https://codeberg.org/api/v1/repos/jakeayy/Starshift/releases?limit=1" | grep -o '"browser_download_url":"[^"]*"' | cut -d '"' -f 4 | head -n 1) || true

if [ -n "$DOWNLOAD_URL" ]; then
    echo "Downloading Starshift from $DOWNLOAD_URL..."

    # Determine filename from URL
    FILENAME=$(basename "$DOWNLOAD_URL")
    DEST_FILE="$TEMP_DIR/$FILENAME"

    if ! wget -q --show-progress "$DOWNLOAD_URL" -O "$DEST_FILE"; then
        echo -e "${RED}Failed to download Starshift release. Check your internet connection.${NC}"
        exit 1
    fi

    # Create extraction directory
    mkdir -p "$TEMP_DIR/Starshift"

    echo "Extracting..."
    if [[ "$FILENAME" == *.zip ]]; then
        if ! unzip -q "$DEST_FILE" -d "$TEMP_DIR/Starshift"; then
            echo -e "${RED}Failed to extract $FILENAME (archive may be corrupt).${NC}"
            exit 1
        fi
    elif [[ "$FILENAME" == *.tar.gz ]] || [[ "$FILENAME" == *.tgz ]]; then
        if ! tar -xzf "$DEST_FILE" -C "$TEMP_DIR/Starshift"; then
            echo -e "${RED}Failed to extract $FILENAME (archive may be corrupt).${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Unknown archive format: $FILENAME${NC}"
        exit 1
    fi

    echo "Copying files to game directory..."

    SOURCE_DIR="$TEMP_DIR/Starshift"
    # Handle case where zip wraps files in a top-level folder
    if [ ! -d "$SOURCE_DIR/www" ]; then
        NUM_DIRS=$(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
        if [ "$NUM_DIRS" -eq 1 ]; then
             SOURCE_DIR=$(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d)
        fi
    fi

    # Copy mod loader files
    if [ -d "$SOURCE_DIR/www" ]; then
        cp -r "$SOURCE_DIR/www" "$GAME_DIR/"
        echo " - Installed www folder"
    else
        echo -e "${RED}Warning: www folder not found in the downloaded release.${NC}"
    fi
else
    echo -e "${RED}Failed to find latest release. Check your internet connection or GitHub API limits.${NC}"
    exit 1
fi

# 3. Optional Linux Port Installation
echo ""
echo -e "${YELLOW}Would you like to install the Linux native port (NW.js)?${NC}"
echo "This allows you to play without using Wine/Proton."
read -p "Install Linux port? (y/n): " install_port < /dev/tty

if [[ "$install_port" == "y" || "$install_port" == "Y" ]]; then
    echo ""
    if [[ "${DEV:-}" == "1" ]]; then
        echo -e "${GREEN}Downloading NW.js SDK v${NWJS_VERSION} (SDK build, includes DevTools)...${NC}"
    else
        echo -e "${GREEN}Downloading NW.js v${NWJS_VERSION}...${NC}"
    fi

    # Download tarball
    if wget -q --show-progress "$NWJS_URL" -O "$TEMP_DIR/nwjs.tar.gz"; then
        echo "Extracting files..."
        # Extract strip-components=1 removes the top folder so files go directly into GAME_DIR
        if ! tar -xzf "$TEMP_DIR/nwjs.tar.gz" -C "$GAME_DIR" --strip-components=1; then
            echo -e "${RED}Failed to extract NW.js archive.${NC}"
            exit 1
        fi

        echo "Configuring Linux Dependencies..."

        # 1. Fix Steam API Library names
        # Check if source files exist before copying to prevent errors
        if [ -f "$GAME_DIR/www/lib/libsteam_api64.so" ]; then
            cp "$GAME_DIR/www/lib/libsteam_api64.so" "$GAME_DIR/www/lib/libsteam_api.so"
            echo " - Configured libsteam_api.so"
        else
            echo -e "${YELLOW}Warning: libsteam_api64.so not found, skipping rename.${NC}"
        fi

        if [ -f "$GAME_DIR/www/lib/libsdkencryptedappticket64.so" ]; then
            cp "$GAME_DIR/www/lib/libsdkencryptedappticket64.so" "$GAME_DIR/www/lib/libsdkencryptedappticket.so"
            echo " - Configured libsdkencryptedappticket.so"
        else
             echo -e "${YELLOW}Warning: libsdkencryptedappticket64.so not found, skipping rename.${NC}"
        fi

        echo -e "${GREEN}Linux port installed successfully.${NC}"
        echo "---------------------------------------------------"
        echo -e "${YELLOW}NOTE FOR STEAM USERS:${NC}"
        echo "To launch this version through Steam, set your Launch Options to:"
        echo -e "${GREEN}./nw %command%${NC}"
        echo "---------------------------------------------------"
    else
        echo -e "${RED}Failed to download NW.js.${NC}"
    fi
else
    echo "Skipping Linux port installation."
fi

# 4. Outro
echo ""
echo -e "${GREEN}Installation complete! Have a great adventure!${NC}"
echo ""
