from django.core.management.base import BaseCommand
from django.db import transaction
from authentication.models import User
from locations.models import Location
from cars.models import Car
from rentals.models import Rental
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Initialize sample data for the car rental system'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Check if data already exists
        if Location.objects.exists() and Car.objects.exists():
            self.stdout.write(self.style.WARNING('Sample data already exists'))
            return
        
        # Ensure admin user exists
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))
        
        # Create regular user
        user, created = User.objects.get_or_create(
            username='user',
            defaults={
                'email': 'user@example.com',
                'role': 'user'
            }
        )
        
        if created:
            user.set_password('user123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created regular user'))
        
        # Create locations
        locations = [
            Location.objects.create(name='Downtown', address='123 Main St, Downtown'),
            Location.objects.create(name='Airport', address='456 Airport Rd'),
            Location.objects.create(name='Suburban', address='789 Oak Ave, Suburbia')
        ]
        self.stdout.write(self.style.SUCCESS(f'Created {len(locations)} locations'))
        
        # Create cars
        cars = []
        car_data = [
            {'make': 'Toyota', 'model': 'Camry', 'year': 2022, 'location': locations[0], 'car_id': 'CAR-001'},
            {'make': 'Honda', 'model': 'Civic', 'year': 2021, 'location': locations[0], 'car_id': 'CAR-002'},
            {'make': 'Ford', 'model': 'Mustang', 'year': 2023, 'location': locations[1], 'car_id': 'CAR-003'},
            {'make': 'Chevrolet', 'model': 'Malibu', 'year': 2022, 'location': locations[1], 'car_id': 'CAR-004'},
            {'make': 'Nissan', 'model': 'Altima', 'year': 2021, 'location': locations[2], 'car_id': 'CAR-005'},
            {'make': 'BMW', 'model': '3 Series', 'year': 2023, 'location': locations[2], 'car_id': 'CAR-006'},
        ]
        
        for data in car_data:
            car = Car.objects.create(**data)
            cars.append(car)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(cars)} cars'))
        
        # Create some rentals
        now = timezone.now()
        
        # Active rental
        Rental.objects.create(
            user=user,
            car=cars[0],
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=3),
            status='active'
        )
        
        # Completed rental
        Rental.objects.create(
            user=user,
            car=cars[1],
            start_date=now - timedelta(days=10),
            end_date=now - timedelta(days=5),
            status='completed'
        )
        
        self.stdout.write(self.style.SUCCESS('Created sample rentals'))
        self.stdout.write(self.style.SUCCESS('Sample data initialization complete'))