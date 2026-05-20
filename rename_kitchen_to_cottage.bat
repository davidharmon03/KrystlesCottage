@echo off
cd /d "%~dp0"

echo === Clearing stale git lock ===
if exist ".git\index.lock" (
    del /f ".git\index.lock"
    echo Deleted index.lock
) else (
    echo No index.lock found
)

echo === Manually clearing rebase state ===
if exist ".git\rebase-merge" (
    rmdir /s /q ".git\rebase-merge"
    echo Cleared rebase-merge directory
) else (
    echo No rebase-merge directory found
)

echo === Checking git status ===
git status

echo === Renaming Kitchen files to Cottage ===
git mv "Krystle's Kitchen - Complete Project Summary.docx" "Krystle's Cottage - Complete Project Summary.docx"
echo Renamed: Project Summary docx

git mv "Krystle's_Kitchen_Project.md" "Krystle's_Cottage_Project.md"
echo Renamed: Project MD

git mv "client/src/pages/Kitchen.jsx" "client/src/pages/Cottage.jsx"
echo Renamed: Kitchen.jsx -^> Cottage.jsx

echo === Committing ===
git add -A
git commit -m "Rename remaining Kitchen files to Cottage"

echo === Pushing ===
git push

echo.
echo === Done ===
pause
