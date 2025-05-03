from django.core.management.base import BaseCommand
import json
from django.core.serializers.json import DjangoJSONEncoder
from authentication.models import User, LoginHistory
from cars.models import Car
from locations.models import Location
from rentals.models import Rental

class Command(BaseCommand):
    help = 'Export data from the database to JSON files'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data export...'))
        
        # Export users
        self.export_users()
        
        # Export locations
        self.export_locations()
        
        # Export cars
        self.export_cars()
        
        # Export rentals
        self.export_rentals()
        
        # Export login history
        self.export_login_history()
        
        self.stdout.write(self.style.SUCCESS('Data export completed successfully!'))
    
    def export_users(self):
        users = User.objects.all()
        user_data = []
        
        for user in users:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined
            })
        
        with open('exported_users.json', 'w') as f:
            json.dump(user_data, f, cls=DjangoJSONEncoder, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'Exported {len(user_data)} users to exported_users.json'))
    
    def export_locations(self):
        locations = Location.objects.all()
        location_data = []
        
        for location in locations:
            location_data.append({
                'id': location.id,
                'name': location.name,
                'address': location.address
            })
        
        with open('exported_locations.json', 'w') as f:
            json.dump(location_data, f, cls=DjangoJSONEncoder, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'Exported {len(location_data)} locations to exported_locations.json'))
    
    def export_cars(self):
        cars = Car.objects.all()
        car_data = []
        
        for car in cars:
            car_data.append({
                'id': car.id,
                'make': car.make,
                'model': car.model,
                'year': car.year,
                'location_id': car.location.id,
                'status': car.status,
                'car_id': car.car_id
            })
        
        with open('exported_cars.json', 'w') as f:
            json.dump(car_data, f, cls=DjangoJSONEncoder, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'Exported {len(car_data)} cars to exported_cars.json'))
    
    def export_rentals(self):
        rentals = Rental.objects.all()
        rental_data = []
        
        for rental in rentals:
            rental_data.append({
                'id': rental.id,
                'user_id': rental.user.id,
                'car_id': rental.car.id,
                'start_date': rental.start_date,
                'end_date': rental.end_date,
                'status': rental.status
            })
        
        with open('exported_rentals.json', 'w') as f:
            json.dump(rental_data, f, cls=DjangoJSONEncoder, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'Exported {len(rental_data)} rentals to exported_rentals.json'))
    
    def export_login_history(self):
        history = LoginHistory.objects.all()
        history_data = []
        
        for entry in history:
            history_data.append({
                'id': entry.id,
                'user_id': entry.user.id,
                'timestamp': entry.timestamp
            })
        
        with open('exported_login_history.json', 'w') as f:
            json.dump(history_data, f, cls=DjangoJSONEncoder, indent=2)
        
        self.stdout.write(self.style.SUCCESS(f'Exported {len(history_data)} login history entries to exported_login_history.json'))