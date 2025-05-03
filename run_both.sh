#!/bin/bash
# Script to run both servers in separate tabs for local development
# This is primarily for local development, not for Replit environment

# Start Django server
gnome-terminal --tab --title="Django Server" -- bash -c "python run.py; exec bash"

# Start Express server
gnome-terminal --tab --title="Express Server" -- bash -c "npm run dev; exec bash"

echo "Started both servers in separate tabs."
echo "Django: http://localhost:8000"
echo "Express: http://localhost:5000"