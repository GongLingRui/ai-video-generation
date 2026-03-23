#!/bin/bash
cd "$(dirname "$0")"

PORT=${PORT:-3080}

# Force stop any process on port 3080
echo "==> Checking port ${PORT}..."
PID=$(lsof -ti:${PORT})
if [ -n "$PID" ]; then
    echo "==> Killing process $PID on port ${PORT}..."
    kill -9 $PID
    sleep 1
fi

echo "==> Installing dependencies..."
npm install

echo "==> Starting Daliu-Jimeng on http://localhost:${PORT}"
npx next dev -p "$PORT"
