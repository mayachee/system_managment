from rest_framework import serializers
from .models import Rental
from authentication.serializers import UserSerializer
from cars.serializers import CarSerializer

class RentalSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    car_details = CarSerializer(source='car', read_only=True)
    
    class Meta:
        model = Rental
        fields = ['id', 'user', 'user_details', 'car', 'car_details', 
                 'start_date', 'end_date', 'status']
        read_only_fields = ['id']
    
    def validate(self, data):
        """
        Check that the rental dates make sense and the car is available
        """
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("End date must be after start date")
            
            # For new rentals, check car availability
            if self.instance is None:
                rental = Rental(
                    car=data['car'],
                    start_date=data['start_date'],
                    end_date=data['end_date']
                )
                if not rental.is_car_available():
                    raise serializers.ValidationError("This car is not available for the selected dates")
            # For updates, exclude the current rental from the check
            else:
                rental = Rental(
                    car=data.get('car', self.instance.car),
                    start_date=data.get('start_date', self.instance.start_date),
                    end_date=data.get('end_date', self.instance.end_date)
                )
                if not rental.is_car_available(exclude_rental_id=self.instance.id):
                    raise serializers.ValidationError("This car is not available for the selected dates")
        
        return data