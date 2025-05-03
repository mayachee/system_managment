# Docker Setup for Car Rental System

This document explains how to use Docker for deploying the Car Rental System application.

## Quick Start (One Command)

### On Linux/Mac:
```bash
./run.sh
```

### On Windows:
```
run.bat
```

These scripts will check prerequisites, build and start the application for you automatically.

## Prerequisites

- Docker (v20.0+)
- Docker Compose (v2.0+)

## Configuration

The application is configured using environment variables defined in the `docker-compose.yml` file. You may want to modify:

- `DATABASE_URL`: Connection string for PostgreSQL
- `SESSION_SECRET`: Secret key for session encryption
- Database credentials (username, password, database name)

## Manual Build and Run

If you prefer to run commands manually, you can build and start the application with:

```bash
docker-compose up -d
```

This will:
1. Build the application image based on the Dockerfile
2. Start a PostgreSQL database container
3. Start the application container
4. Connect them together on a private network

The application will be available at http://localhost:3000

## Data Persistence

Database data is persisted in a named Docker volume (`postgres_data`).

## Stopping the Application

To stop the application:

```bash
docker-compose down
```

To stop and remove all data (including the database volume):

```bash
docker-compose down -v
```

## Logs

To view logs from the application:

```bash
docker-compose logs -f app
```

To view logs from the database:

```bash
docker-compose logs -f db
```

## Rebuilding

After making changes to the code, rebuild and restart the application:

```bash
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. Update the `SESSION_SECRET` to a secure random string
2. Update the database credentials to secure values
3. Consider using a reverse proxy like Nginx for SSL termination
4. Configure proper volume backups for the database