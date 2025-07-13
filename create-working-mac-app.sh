#!/bin/bash

# Create a working Mac App for Memory Friend
APP_NAME="Memory Friend"
APP_DIR="$HOME/Desktop/claude projects/task-manager"
HTML_FILE="$APP_DIR/index.html"

echo "Creating working Mac app: $APP_NAME"

# Remove any existing app
rm -rf "$APP_DIR/$APP_NAME.app"

# Create the app bundle structure
mkdir -p "$APP_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_DIR/$APP_NAME.app/Contents/Resources"

# Create Info.plist
cat > "$APP_DIR/$APP_NAME.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>MemoryFriend</string>
    <key>CFBundleIdentifier</key>
    <string>com.memoryfriend.app</string>
    <key>CFBundleName</key>
    <string>Memory Friend</string>
    <key>CFBundleDisplayName</key>
    <string>Memory Friend</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>MEMF</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
EOF

# Create the executable script (using Python for better compatibility)
cat > "$APP_DIR/$APP_NAME.app/Contents/MacOS/MemoryFriend" << 'EOF'
#!/usr/bin/env python3

import os
import sys
import subprocess
import webbrowser
from pathlib import Path

def find_html_file():
    """Find the index.html file"""
    # Get the app bundle path
    app_path = Path(__file__).parent.parent.parent
    
    # Try different locations
    possible_locations = [
        app_path / "index.html",
        app_path / ".." / ".." / "index.html",
        Path.home() / "Desktop" / "claude projects" / "task-manager" / "index.html"
    ]
    
    for location in possible_locations:
        if location.exists():
            return location.resolve()
    
    return None

def open_in_browser(html_file):
    """Open the HTML file in the best available browser"""
    file_url = f"file://{html_file}"
    
    # Try Chrome in app mode first
    chrome_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/usr/bin/google-chrome",
        "/usr/local/bin/google-chrome"
    ]
    
    for chrome_path in chrome_paths:
        if os.path.exists(chrome_path):
            try:
                subprocess.run([
                    chrome_path,
                    f"--app={file_url}",
                    "--disable-web-security",
                    "--user-data-dir=/tmp/memory-friend-chrome",
                    "--hide-crash-restore-bubble"
                ], check=False)
                return
            except:
                pass
    
    # Fallback to default browser
    webbrowser.open(file_url)

def main():
    html_file = find_html_file()
    
    if html_file:
        print(f"Opening Memory Friend from: {html_file}")
        open_in_browser(html_file)
    else:
        # Show error dialog
        script = '''
        tell application "System Events"
            display dialog "Memory Friend HTML file not found. Please make sure the app is in the correct location." with title "Memory Friend" buttons {"OK"} default button "OK" with icon caution
        end tell
        '''
        subprocess.run(["osascript", "-e", script])

if __name__ == "__main__":
    main()
EOF

# Make the executable script runnable
chmod +x "$APP_DIR/$APP_NAME.app/Contents/MacOS/MemoryFriend"

# Copy the web app files into the app bundle
cp "$APP_DIR/index.html" "$APP_DIR/$APP_NAME.app/Contents/Resources/"
cp "$APP_DIR/styles.css" "$APP_DIR/$APP_NAME.app/Contents/Resources/"
cp "$APP_DIR/friendly-assistant.js" "$APP_DIR/$APP_NAME.app/Contents/Resources/"
cp "$APP_DIR/voice-handler.js" "$APP_DIR/$APP_NAME.app/Contents/Resources/"
cp "$APP_DIR/manifest.json" "$APP_DIR/$APP_NAME.app/Contents/Resources/"

# Create a simple icon (you can replace this with a proper .icns file later)
echo "Creating temporary icon..."

echo "Mac app created successfully at: $APP_DIR/$APP_NAME.app"
echo ""
echo "To install:"
echo "1. Drag '$APP_NAME.app' to your Applications folder"
echo "2. Double-click to launch"
echo ""
echo "If macOS shows a security warning:"
echo "1. Go to System Preferences > Security & Privacy"
echo "2. Click 'Open Anyway' for Memory Friend"
echo "3. Or right-click the app and select 'Open'"
EOF

chmod +x "$APP_DIR/create-working-mac-app.sh"