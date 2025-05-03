from django.db import models
from locations.models import Location

class Car(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('maintenance', 'Maintenance'),
    ]
    
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='cars')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    car_id = models.CharField(max_length=20, unique=True)
    
    def __str__(self):
        return f"{self.make} {self.model} ({self.year}) - {self.car_id}"
