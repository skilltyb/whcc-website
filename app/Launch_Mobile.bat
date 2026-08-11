@echo off
echo Checking for updated index.html in Downloads...

set DOWNLOADS=%USERPROFILE%\Downloads
set APP=C:\Users\sctr1\wh-app

if exist "%DOWNLOADS%\index.html" (
    echo Found index.html in Downloads.
    set /p CONFIRM="Overwrite %APP%\index.html with it? [y/N] "
    if /i "%CONFIRM%"=="y" (
        if exist "%APP%\index.html" (
            copy /Y "%APP%\index.html" "%APP%\index.html.bak" >nul
            echo Backed up existing file to index.html.bak
        )
        copy /Y "%DOWNLOADS%\index.html" "%APP%\index.html"
        echo Copied. Leaving the Downloads copy in place ^(not auto-deleting^).
    ) else (
        echo Skipped — using existing app file.
    )
) else (
    echo No new index.html found in Downloads, using existing file.
)

echo Starting Mobile server...
start "Mobile Server" cmd /c "cd /d %APP% && python -m http.server 3001"
timeout /t 2 /nobreak >nul
start chrome "https://claude.ai/project/019cf3cf-c948-73e5-b819-4c93735db8ca"
start chrome "http://localhost:3001"
