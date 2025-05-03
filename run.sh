#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}     CAR RENTAL SYSTEM - STARTUP SCRIPT     ${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker detected! Would you like to use Docker? (y/n)${NC}"
    read -r use_docker
    
    if [[ "$use_docker" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Starting application with Docker...${NC}"
        
        # Check if containers are already running
        if docker-compose ps | grep -q "Up"; then
            echo -e "${YELLOW}Containers are already running. Recreating them...${NC}"
            docker-compose down
        fi
        
        # Start with Docker Compose
        docker-compose up -d
        
        echo -e "${GREEN}✅ Docker containers started!${NC}"
        echo -e "${YELLOW}The application is now running at: ${BLUE}http://localhost:5000${NC}"
        echo -e "${YELLOW}To view logs: ${BLUE}docker-compose logs -f${NC}"
        echo -e "${YELLOW}To stop: ${BLUE}docker-compose down${NC}"
        exit 0
    fi
fi

# Standard startup
echo -e "${GREEN}Starting application in standard mode...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Creating a sample one...${NC}"
    cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/car_rental_system
SESSION_SECRET=change_this_to_a_random_string
NODE_ENV=development
PORT=5000
EOF
    echo -e "${YELLOW}Please update the .env file with your database credentials.${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed! Please install Node.js v18 or higher.${NC}"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed! Please install npm.${NC}"
    exit 1
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies!${NC}"
        exit 1
    fi
fi

# Start the application
echo -e "${GREEN}Starting the application...${NC}"
npm run dev

# This part will only execute if npm run dev fails
echo -e "${RED}❌ Application failed to start!${NC}"
exit 1