# Car Rental System Makefile
# Provides shortcuts for common operations

.PHONY: help start-dev start-docker stop-docker build-dev build-prod db-push db-seed db-reset db-backup db-restore

help:
	@echo "Car Rental System - Available commands:"
	@echo "make start-dev       - Start the application in development mode"
	@echo "make start-docker    - Start the application using Docker"
	@echo "make stop-docker     - Stop Docker containers"
	@echo "make build-dev       - Build the development Docker image"
	@echo "make build-prod      - Build the production Docker image"
	@echo "make db-push         - Push schema changes to the database"
	@echo "make db-seed         - Seed the database with sample data"
	@echo "make db-reset        - Reset (clear) the database"
	@echo "make db-backup       - Back up the database"
	@echo "make db-restore      - Restore the database from backup"

start-dev:
	@echo "Starting application in development mode..."
	npm run dev

start-docker:
	@echo "Starting application with Docker..."
	docker-compose up -d
	@echo "Application is running at http://localhost:5000"

stop-docker:
	@echo "Stopping Docker containers..."
	docker-compose down

build-dev:
	@echo "Building development Docker image..."
	docker build -t car-rental-system:dev -f Dockerfile.dev .

build-prod:
	@echo "Building production Docker image..."
	docker build -t car-rental-system:prod -f Dockerfile.prod .

db-push:
	@echo "Pushing schema changes to database..."
	npm run db:push

db-seed:
	@echo "Seeding database with sample data..."
	tsx scripts/seed.ts

db-reset:
	@echo "Resetting database..."
	tsx scripts/reset-db.ts

db-backup:
	@echo "Backing up database..."
	tsx scripts/backup-db.ts

db-restore:
	@echo "Restoring database from backup..."
	tsx scripts/restore-db.ts