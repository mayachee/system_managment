#!/usr/bin/env python
import os
import json
import django
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "car_rental_system.settings")
django.setup()

# Now we can import Django models
from authentication.models import User, LoginHistory
from cars.models import Car
from locations.models import Location
from rentals.models import Rental

def test_models():
    """Test Django models by querying data and printing results"""
    print("=== Django Models Test ===")
    
    # Test User model
    print("\n--- Users ---")
    try:
        users = User.objects.all()
        print(f"Found {users.count()} users:")
        for user in users:
            print(f"  - {user.username} (Role: {user.role})")
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
    
    # Test Location model
    print("\n--- Locations ---")
    try:
        locations = Location.objects.all()
        print(f"Found {locations.count()} locations:")
        for location in locations:
            print(f"  - {location.name}: {location.address}")
    except Exception as e:
        print(f"Error fetching locations: {str(e)}")
    
    # Test Car model
    print("\n--- Cars ---")
    try:
        cars = Car.objects.all()
        print(f"Found {cars.count()} cars:")
        for car in cars:
            print(f"  - {car.make} {car.model} ({car.year}) - ID: {car.car_id}, Status: {car.status}")
    except Exception as e:
        print(f"Error fetching cars: {str(e)}")
    
    # Test Rental model
    print("\n--- Rentals ---")
    try:
        rentals = Rental.objects.all()
        print(f"Found {rentals.count()} rentals:")
        for rental in rentals:
            print(f"  - User: {rental.user.username}, Car: {rental.car.make} {rental.car.model}, Status: {rental.status}")
    except Exception as e:
        print(f"Error fetching rentals: {str(e)}")
    
    # Test dashboard stats function
    print("\n--- Dashboard Stats ---")
    try:
        total_cars = Car.objects.count()
        available_cars = Car.objects.filter(status='available').count()
        rented_cars = Car.objects.filter(status='rented').count()
        maintenance_cars = Car.objects.filter(status='maintenance').count()
        
        total_rentals = Rental.objects.count()
        active_rentals = Rental.objects.filter(status='active').count()
        completed_rentals = Rental.objects.filter(status='completed').count()
        
        total_users = User.objects.count()
        
        stats = {
            'cars': total_cars,
            'availableCars': available_cars,
            'rentedCars': rented_cars,
            'maintenanceCars': maintenance_cars,
            'rentals': total_rentals,
            'activeRentals': active_rentals,
            'completedRentals': completed_rentals,
            'users': total_users
        }
        print(json.dumps(stats, indent=2))
    except Exception as e:
        print(f"Error calculating dashboard stats: {str(e)}")

    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_models()