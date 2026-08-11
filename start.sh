#!/usr/bin/env bash
# HealthMate AI — single-command launcher for macOS/Linux
# Run from the healthmate-ai/ folder (the one containing backend/ and frontend/):
#   chmod +x start.sh && ./start.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting HealthMate AI backend (FastAPI, port 8000)..."
(cd "$ROOT/backend" && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

sleep 2

echo "Starting HealthMate AI frontend (Vite, port 5173)..."
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend  -> http://localhost:8000/docs  (pid $BACKEND_PID)"
echo "Frontend -> http://localhost:5173       (pid $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
