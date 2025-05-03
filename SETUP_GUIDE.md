# Car Rental System Setup Guide

This comprehensive guide will help you set up and run the Car Rental Management System.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation Options](#installation-options)
  - [Standard Setup](#standard-setup)
  - [Docker Setup](#docker-setup)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Admin User Setup](#admin-user-setup)
- [Additional Features](#additional-features)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Standard Setup Requirements
- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL (v14 or higher)

### Docker Setup Requirements
- Docker Desktop
- Docker Compose

## Installation Options

### Standard Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd car-rental-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/car_rental_system
   SESSION_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

### Docker Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd car-rental-system
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Create a PostgreSQL database container
   - Set up the application container
   - Configure networking between them
   - Mount volumes for persistent data

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | None (Required) |
| `SESSION_SECRET` | Secret for session encryption | None (Required) |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Application port | 5000 |

## Database Setup

### Creating the Database (Standard Setup Only)

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE car_rental_system;"
psql -U postgres -c "CREATE USER carrentalsystem WITH ENCRYPTED PASSWORD 'carrentalsystem';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE car_rental_system TO carrentalsystem;"
```

### Running Migrations

```bash
# Push schema changes to the database
npm run db:push
```

## Running the Application

### Standard Setup

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at: http://localhost:5000

## Admin User Setup

For first-time setup, you need to create an admin user:

1. Navigate to http://localhost:5000/auth
2. Register a new account
3. Connect to the PostgreSQL database and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   ```

## Additional Features

### Database Studio Access

If you want to access the database directly through a GUI:

```bash
npm run db:studio
```

This will open Drizzle Studio, providing a visual interface for database management.

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check your connection string
   - Ensure the database exists

2. **Port Conflicts**
   - If port 5000 is in use, modify the port in `.env`
   - For Docker setup, modify the port mapping in `docker-compose.yml`

3. **Node Module Issues**
   - Try deleting `node_modules` and reinstalling
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Docker Issues**
   - Ensure Docker Desktop is running
   - Check container logs: `docker-compose logs -f`
   - Restart containers: `docker-compose restart`

### Still Having Problems?

- Check application logs
- Verify environment variables
- Restart your development environment