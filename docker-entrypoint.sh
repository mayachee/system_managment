#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
RETRIES=30
until pg_isready -h db -U postgres; do
  echo "PostgreSQL not available, retrying... ($RETRIES remaining)"
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -eq 0 ]; then
    echo "PostgreSQL not available, giving up"
    exit 1
  fi
  sleep 2
done
echo "PostgreSQL ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Start the app
echo "Starting the application..."
exec "$@"