#!/bin/bash

export GAME_DIR="/home/$USER/.steam/steam/steamapps/common/In Stars And Time/"

rm -r "$GAME_DIR/www/mod"
cp -r dist/* "$GAME_DIR"