from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Creates an admin user'

    def handle(self, *args, **options):
        if User.objects.filter(username='admin').exists():
            self.stdout.write(self.style.WARNING('Admin user already exists'))
            return
        
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin'  # This is just for development, in production use a secure password
        )
        
        self.stdout.write(self.style.SUCCESS(f'Admin user created: {admin.username}'))