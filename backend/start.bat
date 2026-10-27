@echo off
cd /d "%~dp0"
echo Starting VOXA AI Backend...
if exist ".venv\Scripts\uvicorn.exe" (
    ".venv\Scripts\uvicorn.exe" app.main:app --reload --host 127.0.0.1 --port 8000
) else (
    echo [ERROR] Virtual environment not found at .venv
    pause
)
