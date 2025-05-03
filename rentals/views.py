from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Rental
from .serializers import RentalSerializer
from authentication.views import IsAdminOrReadOnly

class RentalViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rentals to be viewed or edited.
    """
    queryset = Rental.objects.all()
    serializer_class = RentalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'car__car_id', 'status']
    ordering_fields = ['start_date', 'end_date', 'status']
    
    def get_queryset(self):
        """
        This view should return a list of all rentals for the currently authenticated user
        unless the user is an admin, in which case it returns all rentals.
        """
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'admin':
                return Rental.objects.all()
            return Rental.objects.filter(user=user)
        return Rental.objects.none()
    
    def perform_create(self, serializer):
        """
        Set the user to the current user when creating a rental if not specified
        """
        if 'user' not in serializer.validated_data:
            serializer.save(user=self.request.user)
        else:
            # Only admins can create rentals for other users
            if self.request.user.role != 'admin' and serializer.validated_data['user'] != self.request.user:
                raise PermissionDenied("You can only create rentals for yourself")
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Return a list of all active rentals.
        """
        queryset = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_rentals(self, request):
        """
        Return a list of all rentals for the current user.
        """
        queryset = Rental.objects.filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)