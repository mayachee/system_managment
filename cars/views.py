from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Car
from .serializers import CarSerializer
from authentication.views import IsAdminOrReadOnly

class CarViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows cars to be viewed or edited.
    """
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['make', 'model', 'year', 'car_id', 'status']
    ordering_fields = ['make', 'model', 'year', 'status']
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Return a list of all available cars.
        """
        cars = Car.objects.filter(status='available')
        serializer = self.get_serializer(cars, many=True)
        return Response(serializer.data)