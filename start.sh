#!/bin/bash
export PORT=8080

# Start backend
node_modules/.bin/tsx artifacts/api-server/src/index.ts &
BACKEND_PID=$!

# Start frontend
node_modules/.bin/vite --config artifacts/ai-diary/vite.config.ts --port 5000 --host 0.0.0.0 &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
