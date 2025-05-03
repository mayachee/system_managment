# Car Rental Management System

A comprehensive car rental management system that integrates advanced maintenance tracking, vehicle availability management, and user-centric features.

## Features

- 🚗 Complete car inventory management
- 📅 Rental reservation and tracking system
- 🔧 Maintenance scheduling and history
- 📍 Multiple location management
- 👤 User management with role-based access control
- 📊 Dashboard with analytics
- 🏆 Loyalty program for customers
- ⭐ Customer reviews
- 🛡️ Vehicle insurance management

## System Requirements

- Node.js (v18 or higher)
- npm (v8 or higher)
- PostgreSQL (v14 or higher)
- Docker (optional, for containerized deployment)

## Installation Options

### Standard Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Initialize the database: `npm run db:push`
5. Run the application: `npm run dev`

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

### Docker Setup

```bash
# Start the application and database
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Quick Start

Use our convenience scripts to get started quickly:

- Linux/macOS: `./run.sh`
- Windows: `run.bat`

These scripts will:
- Check for required dependencies
- Set up environment variables if needed
- Install Node.js packages
- Start the application

## Project Structure

```
/
├── client/              # Frontend React application
│   ├── src/             # Source code
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── ...
├── server/              # Backend Express application
│   ├── api/             # API endpoints
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   ├── index.ts         # Entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage interface
│   └── ...
├── shared/              # Shared between client and server
│   └── schema.ts        # Database schema and types
├── scripts/             # Utility scripts
│   ├── seed.ts          # Database seeding
│   ├── backup-db.ts     # Database backup
│   ├── restore-db.ts    # Database restore
│   └── reset-db.ts      # Database reset
├── docker-compose.yml   # Docker configuration
├── Dockerfile.dev       # Development Dockerfile
├── Dockerfile.prod      # Production Dockerfile
└── ...
```

## Database Management

### Seeding the Database

Populate your database with sample data:

```bash
npm run db:seed
```

This creates:
- Admin user (admin/admin123)
- Regular user (user/user123)
- Sample cars, locations, rentals, and maintenance records

### Backing Up Data

Create a backup of your database:

```bash
npm run db:backup
```

Backups are saved to the `/backups` directory with timestamps.

### Restoring Data

Restore data from a backup:

```bash
npm run db:restore
```

Follow the prompts to select which backup to restore.

## Health Monitoring

The application includes health monitoring endpoints:

- `/api/health` - Basic health information (public)
- `/api/health/detailed` - Detailed system information (admin only)
- `/api/health/database` - Database connection status (admin only)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT