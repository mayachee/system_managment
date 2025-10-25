from django.urls import path, include
from rest_framework.routers import DefaultRouter
from authentication.views import UserViewSet, LoginHistoryViewSet, LoginView, LogoutView, CurrentUserView
from cars.views import CarViewSet
from locations.views import LocationViewSet
from rentals.views import RentalViewSet
from api.views import dashboard_data, connection_test

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cars', CarViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'rentals', RentalViewSet)
router.register(r'login-history', LoginHistoryViewSet)

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    
    # Dashboard endpoints
    path('dashboard/', dashboard_data, name='dashboard-data'),
    
    # Test endpoint (no auth required)
    path('test-connection/', connection_test, name='test-connection'),
]