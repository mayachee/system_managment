#!/bin/bash
# Start both Express.js and Django servers for testing purposes

# Check if there's an existing server process and kill it
if [ -f server_script.pid ]; then
  echo "Stopping existing server process..."
  SERVER_PID=$(cat server_script.pid)
  kill -9 $SERVER_PID 2>/dev/null
  rm server_script.pid
fi

# Start the Express.js server
echo "Starting Express.js server..."
npm run dev &

# Store the process ID
echo $! > server_script.pid
echo "Express.js server started with PID: $(cat server_script.pid)"

# Wait a moment for the Express server to fully start
sleep 2

# Start the Django server
echo "Starting Django server..."
python run.py &

echo "Both servers are now running."
echo "Express.js: http://localhost:5000"
echo "Django: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for user input before stopping
read -p "Press Enter to stop servers..."

# Clean up
if [ -f server_script.pid ]; then
  SERVER_PID=$(cat server_script.pid)
  kill -9 $SERVER_PID 2>/dev/null
  rm server_script.pid
fi

# Try to find and kill the Django process
pkill -f "python run.py" 2>/dev/null

echo "Servers stopped."