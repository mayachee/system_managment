from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Initialize database by running migrations and creating initial data'

    def handle(self, *args, **options):
        # Run migrations
        self.stdout.write('Running migrations...')
        call_command('migrate')
        
        # Create admin user
        self.stdout.write('Creating admin user...')
        call_command('create_admin')
        
        # Initialize sample data
        self.stdout.write('Initializing sample data...')
        call_command('initialize_data')
        
        self.stdout.write(self.style.SUCCESS('Database initialization complete'))