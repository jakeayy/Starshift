#!/bin/bash

# --- Configuration ---
GAME_DIR="$HOME/.steam/steam/steamapps/common/In Stars And Time"
REPO_URL="https://github.com/jakeayy/Starshift"
NWJS_URL="https://dl.nwjs.io/v0.49.1/nwjs-sdk-v0.49.1-linux-x64.tar.gz"
TEMP_DIR=$(mktemp -d)

# --- Colors for Output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${GREEN}=== Starshift Mod Loader Installer ===${NC}"
echo ""

# 1. Verify Clean Install
echo -e "${YELLOW}IMPORTANT:${NC} Before proceeding, please ensure:"
echo "1. You have verified the integrity of game files on Steam."
echo "2. You are running on a CLEAN installation of 'In Stars And Time'."
echo ""
read -p "Have you verified these steps? (y/n): " confirm_clean

if [[ "$confirm_clean" != "y" && "$confirm_clean" != "Y" ]]; then
    echo -e "${RED}Aborting installation. Please verify your game files and try again.${NC}"
    exit 1
fi

# Check if Game Directory Exists
if [ ! -d "$GAME_DIR" ]; then
    echo -e "${RED}Error: Game directory not found at:${NC}"
    echo "$GAME_DIR"
    echo "Please ensure the game is installed via Steam."
    exit 1
fi

# 2. Download and Install Latest Release
echo ""
echo -e "${GREEN}Fetching latest release info...${NC}"

# Get the download URL for the latest release (first asset)
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/jakeayy/Starshift/releases/latest" | grep "browser_download_url" | cut -d '"' -f 4 | head -n 1)

if [ -n "$DOWNLOAD_URL" ]; then
    echo "Downloading Starshift from $DOWNLOAD_URL..."
    
    # Determine filename from URL
    FILENAME=$(basename "$DOWNLOAD_URL")
    DEST_FILE="$TEMP_DIR/$FILENAME"
    
    wget -q --show-progress "$DOWNLOAD_URL" -O "$DEST_FILE"
    
    # Create extraction directory
    mkdir -p "$TEMP_DIR/Starshift"
    
    echo "Extracting..."
    if [[ "$FILENAME" == *.zip ]]; then
        if ! command -v unzip &> /dev/null; then
            echo -e "${RED}Error: 'unzip' is required but not installed.${NC}"
            rm -rf "$TEMP_DIR"
            exit 1
        fi
        unzip -q "$DEST_FILE" -d "$TEMP_DIR/Starshift"
    elif [[ "$FILENAME" == *.tar.gz ]] || [[ "$FILENAME" == *.tgz ]]; then
        tar -xzf "$DEST_FILE" -C "$TEMP_DIR/Starshift"
    else
        echo -e "${RED}Unknown archive format: $FILENAME${NC}"
        rm -rf "$TEMP_DIR"
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
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 3. Optional Linux Port Installation
echo ""
echo -e "${YELLOW}Would you like to install the Linux native port (NW.js)?${NC}"
echo "This allows you to play without using Wine/Proton."
read -p "Install Linux port? (y/n): " install_port

if [[ "$install_port" == "y" || "$install_port" == "Y" ]]; then
    echo ""
    echo -e "${GREEN}Downloading NW.js SDK v0.49.1...${NC}"
    
    # Download tarball
    wget -q --show-progress "$NWJS_URL" -O "$TEMP_DIR/nwjs.tar.gz"
    
    if [ $? -eq 0 ]; then
        echo "Extracting files..."
        # Extract strip-components=1 removes the top folder so files go directly into GAME_DIR
        tar -xzf "$TEMP_DIR/nwjs.tar.gz" -C "$GAME_DIR" --strip-components=1

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
        echo ""
        echo "Note: Steam integration is still experimental! Expect bugs."
        echo "---------------------------------------------------"
    else
        echo -e "${RED}Failed to download NW.js.${NC}"
    fi
else
    echo "Skipping Linux port installation."
fi

# Cleanup
rm -rf "$TEMP_DIR"

# 4. Outro
echo ""
echo -e "${GREEN}Installation complete! Have a great adventure!${NC}"
echo ""
