from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from cars.models import Car
from rentals.models import Rental
from authentication.models import LoginHistory, User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """
    Get all dashboard data in a single request
    """
    # Stats
    total_cars = Car.objects.count()
    available_cars = Car.objects.filter(status='available').count()
    rented_cars = Car.objects.filter(status='rented').count()
    maintenance_cars = Car.objects.filter(status='maintenance').count()
    
    total_rentals = Rental.objects.count()
    active_rentals = Rental.objects.filter(status='active').count()
    completed_rentals = Rental.objects.filter(status='completed').count()
    
    total_users = User.objects.count()

    stats_data = {
        'cars': total_cars,
        'availableCars': available_cars,
        'rentedCars': rented_cars,
        'maintenanceCars': maintenance_cars,
        'rentals': total_rentals,
        'activeRentals': active_rentals,
        'completedRentals': completed_rentals,
        'users': total_users
    }

    # Activity
    login_activities = LoginHistory.objects.all().order_by('-timestamp')[:10]
    login_data = [
        {
            'type': 'login',
            'userId': login.user.id,
            'username': login.user.username,
            'timestamp': login.timestamp
        }
        for login in login_activities
    ]
    
    recent_rentals = Rental.objects.all().order_by('-start_date')[:10]
    rental_data = [
        {
            'type': 'rental',
            'userId': rental.user.id,
            'username': rental.user.username,
            'carId': rental.car.car_id,
            'carName': f"{rental.car.make} {rental.car.model}",
            'status': rental.status,
            'timestamp': rental.start_date
        }
        for rental in recent_rentals
    ]
    
    all_activities = login_data + rental_data
    all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
    activity_data = all_activities[:10]

    # Popular Cars
    car_rental_count = {}
    rentals = Rental.objects.all()
    
    for rental in rentals:
        car_id = rental.car.id
        if car_id in car_rental_count:
            car_rental_count[car_id] += 1
        else:
            car_rental_count[car_id] = 1
    
    sorted_cars = sorted(car_rental_count.items(), key=lambda x: x[1], reverse=True)
    
    popular_cars_data = []
    for car_id, rental_count in sorted_cars[:5]:
        car = Car.objects.get(id=car_id)
        popular_cars_data.append({
            'id': car.id,
            'make': car.make,
            'model': car.model,
            'year': car.year,
            'status': car.status,
            'rentalCount': rental_count
        })

    return Response({
        'stats': stats_data,
        'activity': activity_data,
        'popularCars': popular_cars_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def connection_test(request):
    """
    Simple test endpoint that doesn't require authentication
    """
    return Response({
        'status': 'success',
        'message': 'Django API is running properly',
        'timestamp': timezone.now()
    })