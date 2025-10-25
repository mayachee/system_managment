from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from authentication.models import User
from cars.models import Car
from rentals.models import Rental
from locations.models import Location
from django.utils import timezone
import datetime

class DashboardAPITests(APITestCase):

    def setUp(self):
        self.admin_user = User.objects.create_user(username='admin', email='admin@example.com', password='password', role='admin')
        self.client.force_authenticate(user=self.admin_user)

        # Create a location
        self.location = Location.objects.create(name='Test Location', address='123 Test St')

        # Create cars
        self.car1 = Car.objects.create(make='Toyota', model='Camry', year=2022, location=self.location, status='available', car_id='CAR001')
        self.car2 = Car.objects.create(make='Honda', model='Accord', year=2023, location=self.location, status='rented', car_id='CAR002')

        # Create rentals
        self.rental1 = Rental.objects.create(
            user=self.admin_user,
            car=self.car2,
            start_date=timezone.now() - datetime.timedelta(days=5),
            end_date=timezone.now() + datetime.timedelta(days=5),
            status='active'
        )
        self.rental2 = Rental.objects.create(
            user=self.admin_user,
            car=self.car1,
            start_date=timezone.now() - datetime.timedelta(days=15),
            end_date=timezone.now() - datetime.timedelta(days=10),
            status='completed'
        )

        # Add another rental for the Toyota to make it more popular
        self.rental3 = Rental.objects.create(
            user=self.admin_user,
            car=self.car1,
            start_date=timezone.now() - datetime.timedelta(days=20),
            end_date=timezone.now() - datetime.timedelta(days=18),
            status='completed'
        )

    def test_get_dashboard_data(self):
        url = reverse('dashboard-data')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check stats
        stats = response.data['stats']
        self.assertEqual(stats['cars'], 2)
        self.assertEqual(stats['availableCars'], 1)
        self.assertEqual(stats['rentedCars'], 1)
        self.assertEqual(stats['maintenanceCars'], 0)
        self.assertEqual(stats['rentals'], 3)
        self.assertEqual(stats['activeRentals'], 1)
        self.assertEqual(stats['completedRentals'], 2)
        self.assertEqual(stats['users'], 1)

        # Check activity
        activity = response.data['activity']
        self.assertEqual(len(activity), 3)

        # Check popular cars - Toyota should be first now
        popular_cars = response.data['popularCars']
        self.assertEqual(len(popular_cars), 2)
        self.assertEqual(popular_cars[0]['make'], 'Toyota')
        self.assertEqual(popular_cars[0]['rentalCount'], 2)
        self.assertEqual(popular_cars[1]['make'], 'Honda')
        self.assertEqual(popular_cars[1]['rentalCount'], 1)
