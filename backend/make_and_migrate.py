"""
Script để chạy makemigrations và migrate cho tất cả apps.
Chạy: python make_and_migrate.py
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

import django
django.setup()

from django.core.management import call_command

print("=" * 50)
print("Making migrations for all apps...")
print("=" * 50)

# Makemigrations cho tất cả apps
call_command('makemigrations', 'users', 'jobfinder', verbosity=1)

print("\n" + "=" * 50)
print("Running migrations...")
print("=" * 50)

call_command('migrate', verbosity=1)

print("\n" + "=" * 50)
print("Done!")
print("=" * 50)
