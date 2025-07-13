#!/bin/bash

# Create Mac App for Memory Friend
APP_NAME="Memory Friend"
APP_DIR="$HOME/Desktop/claude projects/task-manager"
HTML_FILE="$APP_DIR/index.html"

echo "Creating Mac app: $APP_NAME"

# Create the app bundle structure
mkdir -p "$APP_DIR/$APP_NAME.app/Contents/MacOS"
mkdir -p "$APP_DIR/$APP_NAME.app/Contents/Resources"

# Create Info.plist
cat > "$APP_DIR/$APP_NAME.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>memory-friend</string>
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
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create the executable script
cat > "$APP_DIR/$APP_NAME.app/Contents/MacOS/memory-friend" << 'EOF'
#!/bin/bash
APP_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HTML_FILE="$APP_PATH/../../index.html"

# Check if HTML file exists
if [ ! -f "$HTML_FILE" ]; then
    HTML_FILE="$APP_PATH/index.html"
fi

# Open in default browser in app mode (Chrome/Safari)
if command -v "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" &> /dev/null; then
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --app="file://$HTML_FILE" --disable-web-security --user-data-dir=/tmp/memory-friend-chrome
elif command -v safari &> /dev/null; then
    open -a Safari "file://$HTML_FILE"
else
    open "$HTML_FILE"
fi
EOF

# Make the executable script runnable
chmod +x "$APP_DIR/$APP_NAME.app/Contents/MacOS/memory-friend"

echo "Mac app created at: $APP_DIR/$APP_NAME.app"
echo "You can now drag this to your Applications folder or Dock!"
EOF