from django.core.management.base import BaseCommand
import json
from django.db import transaction
from authentication.models import User, LoginHistory
from cars.models import Car
from locations.models import Location
from rentals.models import Rental
from django.utils import timezone
from datetime import datetime
import os

class Command(BaseCommand):
    help = 'Import data from Express.js JSON dumps into Django database'

    def add_arguments(self, parser):
        parser.add_argument('--users-file', type=str, help='Path to users JSON file')
        parser.add_argument('--locations-file', type=str, help='Path to locations JSON file')
        parser.add_argument('--cars-file', type=str, help='Path to cars JSON file')
        parser.add_argument('--rentals-file', type=str, help='Path to rentals JSON file')
        parser.add_argument('--login-history-file', type=str, help='Path to login history JSON file')
        parser.add_argument('--all', action='store_true', help='Import all data')

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data import...'))
        
        users_file = kwargs.get('users_file')
        locations_file = kwargs.get('locations_file')
        cars_file = kwargs.get('cars_file')
        rentals_file = kwargs.get('rentals_file')
        login_history_file = kwargs.get('login_history_file')
        import_all = kwargs.get('all')
        
        # Ensure the file exists before trying to import
        if users_file and os.path.exists(users_file):
            self.import_users(users_file)
        elif import_all and os.path.exists('express_users.json'):
            self.import_users('express_users.json')
        
        if locations_file and os.path.exists(locations_file):
            self.import_locations(locations_file)
        elif import_all and os.path.exists('express_locations.json'):
            self.import_locations('express_locations.json')
        
        if cars_file and os.path.exists(cars_file):
            self.import_cars(cars_file)
        elif import_all and os.path.exists('express_cars.json'):
            self.import_cars('express_cars.json')
        
        if rentals_file and os.path.exists(rentals_file):
            self.import_rentals(rentals_file)
        elif import_all and os.path.exists('express_rentals.json'):
            self.import_rentals('express_rentals.json')
        
        if login_history_file and os.path.exists(login_history_file):
            self.import_login_history(login_history_file)
        elif import_all and os.path.exists('express_login_history.json'):
            self.import_login_history('express_login_history.json')
        
        self.stdout.write(self.style.SUCCESS('Data import completed!'))
    
    @transaction.atomic
    def import_users(self, file_path):
        with open(file_path, 'r') as f:
            users_data = json.load(f)
        
        imported_count = 0
        for user_data in users_data:
            try:
                # Check if user already exists
                if User.objects.filter(username=user_data['username']).exists():
                    user = User.objects.get(username=user_data['username'])
                    self.stdout.write(self.style.WARNING(f"User {user_data['username']} already exists, updating..."))
                    
                    # Update user data
                    user.email = user_data.get('email', '')
                    user.role = user_data.get('role', 'user')
                    user.save()
                else:
                    # Create new user
                    user = User.objects.create_user(
                        username=user_data['username'],
                        email=user_data.get('email', ''),
                        password=user_data.get('password', 'password'),  # Set a default password
                        role=user_data.get('role', 'user'),
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created user: {user_data['username']}"))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing user {user_data.get('username')}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Imported {imported_count} users"))
    
    @transaction.atomic
    def import_locations(self, file_path):
        with open(file_path, 'r') as f:
            locations_data = json.load(f)
        
        imported_count = 0
        for location_data in locations_data:
            try:
                # Check if location already exists
                if Location.objects.filter(name=location_data['name']).exists():
                    location = Location.objects.get(name=location_data['name'])
                    self.stdout.write(self.style.WARNING(f"Location {location_data['name']} already exists, updating..."))
                    
                    # Update location data
                    location.address = location_data.get('address', '')
                    location.save()
                else:
                    # Create new location
                    location = Location.objects.create(
                        name=location_data['name'],
                        address=location_data.get('address', '')
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created location: {location_data['name']}"))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing location {location_data.get('name')}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Imported {imported_count} locations"))
    
    @transaction.atomic
    def import_cars(self, file_path):
        with open(file_path, 'r') as f:
            cars_data = json.load(f)
        
        imported_count = 0
        for car_data in cars_data:
            try:
                # Get location
                location_id = car_data.get('locationId')
                if not location_id:
                    self.stdout.write(self.style.ERROR(f"Car {car_data.get('carId')} has no location ID, skipping..."))
                    continue
                
                try:
                    location = Location.objects.get(id=location_id)
                except Location.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Location ID {location_id} not found, skipping car {car_data.get('carId')}..."))
                    continue
                
                # Check if car already exists
                if Car.objects.filter(car_id=car_data['carId']).exists():
                    car = Car.objects.get(car_id=car_data['carId'])
                    self.stdout.write(self.style.WARNING(f"Car {car_data['carId']} already exists, updating..."))
                    
                    # Update car data
                    car.make = car_data.get('make', '')
                    car.model = car_data.get('model', '')
                    car.year = car_data.get('year', 2023)
                    car.location = location
                    car.status = car_data.get('status', 'available')
                    car.save()
                else:
                    # Create new car
                    car = Car.objects.create(
                        make=car_data.get('make', ''),
                        model=car_data.get('model', ''),
                        year=car_data.get('year', 2023),
                        location=location,
                        status=car_data.get('status', 'available'),
                        car_id=car_data['carId']
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created car: {car_data['make']} {car_data['model']}"))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing car {car_data.get('carId')}: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Imported {imported_count} cars"))
    
    @transaction.atomic
    def import_rentals(self, file_path):
        with open(file_path, 'r') as f:
            rentals_data = json.load(f)
        
        imported_count = 0
        for rental_data in rentals_data:
            try:
                # Get user and car
                user_id = rental_data.get('userId')
                car_id = rental_data.get('carId')
                
                if not user_id or not car_id:
                    self.stdout.write(self.style.ERROR(f"Rental is missing user ID or car ID, skipping..."))
                    continue
                
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"User ID {user_id} not found, skipping rental..."))
                    continue
                
                try:
                    car = Car.objects.get(id=car_id)
                except Car.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"Car ID {car_id} not found, skipping rental..."))
                    continue
                
                # Parse dates
                start_date = self.parse_date(rental_data.get('startDate', timezone.now().isoformat()))
                end_date = self.parse_date(rental_data.get('endDate', timezone.now().isoformat()))
                
                # Check if rental already exists
                existing_rental = Rental.objects.filter(
                    user=user,
                    car=car,
                    start_date=start_date,
                    end_date=end_date
                ).first()
                
                if existing_rental:
                    self.stdout.write(self.style.WARNING(f"Similar rental already exists, updating..."))
                    existing_rental.status = rental_data.get('status', 'active')
                    existing_rental.save()
                else:
                    # Create new rental
                    rental = Rental.objects.create(
                        user=user,
                        car=car,
                        start_date=start_date,
                        end_date=end_date,
                        status=rental_data.get('status', 'active')
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created rental: {user.username} - {car.make} {car.model}"))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing rental: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Imported {imported_count} rentals"))
    
    @transaction.atomic
    def import_login_history(self, file_path):
        with open(file_path, 'r') as f:
            history_data = json.load(f)
        
        imported_count = 0
        for entry_data in history_data:
            try:
                # Get user
                user_id = entry_data.get('userId')
                
                if not user_id:
                    self.stdout.write(self.style.ERROR(f"Login history entry is missing user ID, skipping..."))
                    continue
                
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f"User ID {user_id} not found, skipping login history entry..."))
                    continue
                
                # Parse timestamp
                timestamp = self.parse_date(entry_data.get('timestamp', timezone.now().isoformat()))
                
                # Create new login history entry
                LoginHistory.objects.create(
                    user=user,
                    timestamp=timestamp
                )
                self.stdout.write(self.style.SUCCESS(f"Created login history entry for user: {user.username}"))
                imported_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error importing login history entry: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f"Imported {imported_count} login history entries"))
    
    def parse_date(self, date_str):
        """Parse a date string to a datetime object"""
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            # If we can't parse it, return current time
            self.stdout.write(self.style.WARNING(f"Could not parse date: {date_str}, using current time instead"))
            return timezone.now()