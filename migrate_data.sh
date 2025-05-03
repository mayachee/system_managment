#!/bin/bash

# This script handles the migration process from Express.js to Django
# It exports data from Express.js, then imports it into Django

echo "=== Car Rental System Migration Tool ==="
echo "This tool will migrate data from Express.js to Django"
echo "-----------------------------------------------"

# Step 1: Export data from Express.js
echo "Step 1: Exporting data from Express.js..."
npx tsx server/export-data.ts

# Check if export was successful
if [ ! -f "express_users.json" ] || [ ! -f "express_locations.json" ] || [ ! -f "express_cars.json" ] || [ ! -f "express_rentals.json" ]; then
    echo "Error: Data export failed. Some JSON files are missing."
    exit 1
fi

echo "Express.js data export completed successfully."
echo "-----------------------------------------------"

# Step 2: Initialize Django database
echo "Step 2: Initializing Django database..."
python run.py --init

echo "-----------------------------------------------"

# Step 3: Import data into Django
echo "Step 3: Importing data into Django..."
python run.py --command import_express_data --args --all

echo "-----------------------------------------------"

# Step 4: Test Django models
echo "Step 4: Testing Django models..."
python run.py --test-models

echo "-----------------------------------------------"

# Step 5: Export Django data for verification (optional)
echo "Step 5: Exporting Django data for verification..."
python run.py --command export_data

echo "-----------------------------------------------"
echo "Migration process completed!"
echo "Next steps:"
echo "1. Compare the original Express data files (express_*.json) with"
echo "   the exported Django data files (exported_*.json) to verify data integrity."
echo "2. Update Express.js proxy middleware to forward more routes to Django."
echo "3. Gradually move more functionality from Express to Django."
echo "==============================================="