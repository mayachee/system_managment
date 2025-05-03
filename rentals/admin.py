from django.contrib import admin
from .models import Rental

class RentalAdmin(admin.ModelAdmin):
    list_display = ('user', 'car', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date', 'end_date', 'user', 'car')
    search_fields = ('user__username', 'car__car_id')
    ordering = ('-start_date',)
    date_hierarchy = 'start_date'

admin.site.register(Rental, RentalAdmin)