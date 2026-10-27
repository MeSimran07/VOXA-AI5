Write-Host "Starting VOXA AI Backend with local .venv..." -ForegroundColor Cyan
& "$PSScriptRoot\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 127.0.0.1 --port 8000
