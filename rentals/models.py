from django.db import models
from authentication.models import User
from cars.models import Car

class Rental(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rentals')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='rentals')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    def __str__(self):
        return f"{self.user.username} - {self.car.car_id} ({self.start_date.date()} to {self.end_date.date()})"
    
    class Meta:
        ordering = ['-start_date']
        
    def is_car_available(self, exclude_rental_id=None):
        """Check if the car is available for the given date range"""
        from django.db.models import Q
        
        overlapping_rentals = Rental.objects.filter(
            Q(car=self.car),
            Q(status='active'),
            Q(start_date__lt=self.end_date) & Q(end_date__gt=self.start_date)
        )
        
        # Exclude the current rental if provided
        if exclude_rental_id:
            overlapping_rentals = overlapping_rentals.exclude(id=exclude_rental_id)
            
        return not overlapping_rentals.exists()
