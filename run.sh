#!/bin/bash

# Car Rental System - Single Command Runner
# This script will run the entire application with one command

echo "=== Car Rental System Launcher ==="
echo "Starting setup process..."

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed." >&2
  echo "Please install Docker from https://docs.docker.com/get-docker/"
  exit 1
fi

# Check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  # Check if Docker Compose is available as a Docker plugin
  if ! docker compose version > /dev/null 2>&1; then
    echo "Error: Docker Compose is not installed." >&2
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
  else
    # Use the new Docker Compose
    COMPOSE_CMD="docker compose"
  fi
else
  # Use the standalone Docker Compose
  COMPOSE_CMD="docker-compose"
fi

echo "✓ Prerequisites checked"

# Stop any existing containers
echo "Stopping any existing containers..."
$COMPOSE_CMD down

# Build and start the application
echo "Building and starting the application..."
$COMPOSE_CMD up -d --build

# Check if containers are running
if [ $? -eq 0 ]; then
  echo ""
  echo "====================================="
  echo "✓ Car Rental System is now running!"
  echo "✓ The application is available at: http://localhost:3000"
  echo ""
  echo "To view logs: $COMPOSE_CMD logs -f"
  echo "To stop the system: $COMPOSE_CMD down"
  echo "====================================="
else
  echo "Error: Failed to start the application." >&2
  echo "Please check the logs with: $COMPOSE_CMD logs"
  exit 1
fi