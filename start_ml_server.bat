@echo off
cd /d "c:\Users\jaswa\OneDrive\jashu\python project\ML-model"
echo Starting ML API Server...
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
pause