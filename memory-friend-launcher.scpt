
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

