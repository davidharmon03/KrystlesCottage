@echo off
cd /d "%~dp0"
echo === Git status ===
git status
echo.
echo === Staging server/package.json ===
git add server/package.json
echo.
echo === Committing ===
git commit -m "Fix server/package.json syntax error"
echo.
echo === Pushing ===
git push
echo.
echo === Done ===
pause
