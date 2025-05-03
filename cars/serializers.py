from rest_framework import serializers
from .models import Car
from locations.serializers import LocationSerializer

class CarSerializer(serializers.ModelSerializer):
    location_details = LocationSerializer(source='location', read_only=True)
    
    class Meta:
        model = Car
        fields = ['id', 'make', 'model', 'year', 'location', 'location_details', 'status', 'car_id']
        read_only_fields = ['id']