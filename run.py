#!/usr/bin/env python
import os
import sys
import signal
import time
import argparse
from django.core.management import execute_from_command_line

def initialize_db():
    print("🔄 Initializing database...")
    try:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "car_rental_system.settings")
        execute_from_command_line(['manage.py', 'migrate'])
        execute_from_command_line(['manage.py', 'create_admin'])
        execute_from_command_line(['manage.py', 'initialize_data'])
        print("✅ Database initialized successfully!")
        return True
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        return False

def run_server(port=8000, bind='0.0.0.0'):
    print(f"🚀 Starting Django server on {bind}:{port}...")
    try:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "car_rental_system.settings")
        # Use this instead of execute_from_command_line to ensure signals are handled properly
        execute_from_command_line(['manage.py', 'runserver', f'{bind}:{port}'])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")

def run_command(command, *args):
    print(f"🔄 Running command: {command}")
    try:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "car_rental_system.settings")
        cmd_args = ['manage.py', command]
        if args:
            cmd_args.extend(args)
        execute_from_command_line(cmd_args)
        print(f"✅ Command '{command}' completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Error running command '{command}': {str(e)}")
        return False

def test_models():
    print("🔄 Testing Django models...")
    try:
        # Setup Django environment
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "car_rental_system.settings")
        # Import the test function from test_django_models.py
        sys.path.append(os.getcwd())
        from test_django_models import test_models
        # Run the test
        test_models()
        return True
    except Exception as e:
        print(f"❌ Error testing models: {str(e)}")
        return False

def signal_handler(sig, frame):
    print("\n👋 Gracefully shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Django Car Rental System Runner')
    parser.add_argument('--init', action='store_true', help='Initialize the database')
    parser.add_argument('--server', action='store_true', help='Run the Django server')
    parser.add_argument('--port', type=int, default=8000, help='Port for the Django server')
    parser.add_argument('--bind', type=str, default='0.0.0.0', help='Bind address for the Django server')
    parser.add_argument('--command', type=str, help='Run a specific Django management command')
    parser.add_argument('--test-models', action='store_true', help='Test Django models')
    parser.add_argument('--args', nargs='*', help='Arguments for the command')
    
    args = parser.parse_args()
    
    # Default behavior: initialize DB and run server
    if not any([args.init, args.server, args.command, args.test_models]):
        if initialize_db():
            run_server(args.port, args.bind)
        else:
            sys.exit(1)
    
    # Handle specific actions
    if args.init:
        if not initialize_db():
            sys.exit(1)
    
    if args.command:
        if not run_command(args.command, *(args.args or [])):
            sys.exit(1)
    
    if args.test_models:
        if not test_models():
            sys.exit(1)
    
    if args.server:
        run_server(args.port, args.bind)