@echo off
echo === Car Rental System Launcher ===
echo Starting setup process...

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker is not installed.
    echo Please install Docker from https://docs.docker.com/get-docker/
    exit /b 1
)

REM Check if Docker Compose is available
REM Try the standalone docker-compose first
where docker-compose >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMPOSE_CMD=docker-compose
) else (
    REM Try the plugin docker compose
    docker compose version >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        set COMPOSE_CMD=docker compose
    ) else (
        echo Error: Docker Compose is not installed.
        echo Please install Docker Compose from https://docs.docker.com/compose/install/
        exit /b 1
    )
)

echo Prerequisites checked

REM Stop any existing containers
echo Stopping any existing containers...
%COMPOSE_CMD% down

REM Build and start the application
echo Building and starting the application...
%COMPOSE_CMD% up -d --build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo ✓ Car Rental System is now running!
    echo ✓ The application is available at: http://localhost:3000
    echo.
    echo To view logs: %COMPOSE_CMD% logs -f
    echo To stop the system: %COMPOSE_CMD% down
    echo =====================================
) else (
    echo Error: Failed to start the application.
    echo Please check the logs with: %COMPOSE_CMD% logs
    exit /b 1
)