"""
Script tạo superuser tự động từ biến môi trường.
Chạy: python create_superuser.py

Cần set các biến môi trường:
- DJANGO_SUPERUSER_USERNAME
- DJANGO_SUPERUSER_EMAIL
- DJANGO_SUPERUSER_PASSWORD
"""
import os
import sys
from pathlib import Path

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

    if not password:
        print("[ERROR] DJANGO_SUPERUSER_PASSWORD environment variable is required!")
        sys.exit(1)

    if User.objects.filter(username=username).exists():
        print(f"[INFO] Superuser '{username}' already exists. Skipping...")
        return

    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"[OK] Superuser '{username}' created successfully!")

if __name__ == '__main__':
    create_superuser()
