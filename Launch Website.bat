@echo off
echo Starting Website server...
start "Website Server" cmd /c "cd /d C:\Users\sctr1\claude && python -m http.server 3000"
timeout /t 2 /nobreak >nul
start chrome "https://claude.ai/project/019cf3c9-63fa-7484-ad61-ee64b28dfb27"
start chrome "http://localhost:3000"
