#!/bin/bash

# Simple launcher for Memory Friend
# This file can be double-clicked to launch the app

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTML_FILE="$SCRIPT_DIR/index.html"
FILE_URL="file://$HTML_FILE"

echo "Launching Memory Friend..."

# Try Chrome in app mode
if [[ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
    echo "Opening in Chrome app mode..."
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --app="$FILE_URL" \
        --disable-web-security \
        --user-data-dir="/tmp/memory-friend-chrome" \
        --hide-crash-restore-bubble &
elif [[ -f "/Applications/Safari.app/Contents/MacOS/Safari" ]]; then
    echo "Opening in Safari..."
    open -a Safari "$FILE_URL"
else
    echo "Opening in default browser..."
    open "$FILE_URL"
fi

echo "Memory Friend should now be open!"