@echo off
setlocal enabledelayedexpansion

REM Color codes for Windows console
set GREEN=[92m
set BLUE=[94m
set YELLOW=[93m
set RED=[91m
set NC=[0m

REM Banner
echo %BLUE%=================================================%NC%
echo %GREEN%     CAR RENTAL SYSTEM - STARTUP SCRIPT     %NC%
echo %BLUE%=================================================%NC%

REM Check if Docker is available
where docker >nul 2>nul
if %ERRORLEVEL% equ 0 (
    where docker-compose >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo %YELLOW%Docker detected! Would you like to use Docker? (y/n)%NC%
        set /p use_docker=
        
        if /i "!use_docker!"=="y" (
            echo %GREEN%Starting application with Docker...%NC%
            
            REM Check if containers are already running
            docker-compose ps | findstr "Up" >nul
            if %ERRORLEVEL% equ 0 (
                echo %YELLOW%Containers are already running. Recreating them...%NC%
                docker-compose down
            )
            
            REM Start with Docker Compose
            docker-compose up -d
            
            echo %GREEN%✅ Docker containers started!%NC%
            echo %YELLOW%The application is now running at: %BLUE%http://localhost:5000%NC%
            echo %YELLOW%To view logs: %BLUE%docker-compose logs -f%NC%
            echo %YELLOW%To stop: %BLUE%docker-compose down%NC%
            goto :EOF
        )
    )
)

REM Standard startup
echo %GREEN%Starting application in standard mode...%NC%

REM Check if .env file exists
if not exist .env (
    echo %YELLOW%⚠️ .env file not found. Creating a sample one...%NC%
    (
        echo DATABASE_URL=postgresql://username:password@localhost:5432/car_rental_system
        echo SESSION_SECRET=change_this_to_a_random_string
        echo NODE_ENV=development
        echo PORT=5000
    ) > .env
    echo %YELLOW%Please update the .env file with your database credentials.%NC%
    echo %YELLOW%Then run this script again.%NC%
    goto :EOF
)

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%❌ Node.js is not installed! Please install Node.js v18 or higher.%NC%
    goto :EOF
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%❌ npm is not installed! Please install npm.%NC%
    goto :EOF
)

REM Check node_modules
if not exist node_modules (
    echo %YELLOW%Installing dependencies...%NC%
    npm install
    if %ERRORLEVEL% neq 0 (
        echo %RED%❌ Failed to install dependencies!%NC%
        goto :EOF
    )
)

REM Start the application
echo %GREEN%Starting the application...%NC%
npm run dev

REM This part will only execute if npm run dev fails
echo %RED%❌ Application failed to start!%NC%

endlocal