#!/bin/bash

# Create an Automator-based Mac app for Memory Friend
APP_NAME="Memory Friend"
APP_DIR="$HOME/Desktop/claude projects/task-manager"

echo "Creating Automator-based Mac app: $APP_NAME"

# Create AppleScript that will be embedded in Automator
APPLESCRIPT_CONTENT='
on run {input, parameters}
    set htmlFile to POSIX path of (path to home folder) & "Desktop/claude projects/task-manager/index.html"
    set fileURL to "file://" & htmlFile
    
    -- Try Chrome in app mode first
    try
        do shell script "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --app=" & quoted form of fileURL & " --disable-web-security --user-data-dir=/tmp/memory-friend-chrome > /dev/null 2>&1 &"
        return input
    on error
        -- Fallback to default browser
        try
            open location fileURL
            return input
        on error
            display dialog "Could not open Memory Friend. Please check that the files are in the correct location." with title "Memory Friend Error" buttons {"OK"} default button "OK"
            return input
        end try
    end try
end run
'

# Create the script file
echo "$APPLESCRIPT_CONTENT" > "$APP_DIR/memory-friend-launcher.scpt"

echo "AppleScript created at: $APP_DIR/memory-friend-launcher.scpt"
echo ""
echo "To create the Mac app:"
echo "1. Open Automator"
echo "2. Choose 'Application'"
echo "3. Drag 'Run AppleScript' action to the workflow"
echo "4. Copy and paste the content from memory-friend-launcher.scpt"
echo "5. Save as 'Memory Friend' in Applications folder"
echo ""
echo "Or run this command to create it automatically:"
echo "osacompile -o '$APP_DIR/Memory Friend Automator.app' '$APP_DIR/memory-friend-launcher.scpt'"
EOF

chmod +x "$APP_DIR/create-automator-app.sh"