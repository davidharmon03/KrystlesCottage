@echo off
cd /d "%~dp0"

echo === Pushing with force-with-lease ===
git push --force-with-lease

echo.
echo === Done ===
pause
