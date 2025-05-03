from django.contrib import admin
from .models import Car

class CarAdmin(admin.ModelAdmin):
    list_display = ('car_id', 'make', 'model', 'year', 'location', 'status')
    list_filter = ('status', 'make', 'year', 'location')
    search_fields = ('car_id', 'make', 'model')
    ordering = ('car_id',)

admin.site.register(Car, CarAdmin)