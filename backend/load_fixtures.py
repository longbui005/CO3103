"""
Script để load tất cả lookup data fixtures.
Chạy: python load_fixtures.py

Fixtures bao gồm:
- users_lookups.json: Role, Status, Gender
- jobfinder lookups: VerifiedCompany, WorkFormat, JobType, Currency, 
                     AdministrativeUnit, Province, District, Ward
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.core.management import call_command

def load_all_fixtures():
    """Load tất cả fixtures theo thứ tự đúng"""
    print("=" * 50)
    print("Loading lookup data fixtures...")
    print("=" * 50)
    
    fixtures = [
        ('users/fixtures/users_lookups.json', 'Users lookups (Role, Status, Gender)'),
        ('jobfinder/fixtures/01_lookups_basic.json', 'Basic lookups (Company, WorkFormat, JobType, Currency, Province)'),
        ('jobfinder/fixtures/02_lookups_district.json', 'District lookups'),
        ('jobfinder/fixtures/03_lookups_ward_part1.json', 'Ward lookups (Part 1/3)'),
        ('jobfinder/fixtures/03_lookups_ward_part2.json', 'Ward lookups (Part 2/3)'),
        ('jobfinder/fixtures/03_lookups_ward_part3.json', 'Ward lookups (Part 3/3)'),
    ]
    
    for fixture_path, description in fixtures:
        if os.path.exists(fixture_path):
            print(f"\n-> Loading: {description}")
            try:
                call_command('loaddata', fixture_path, verbosity=1)
                print(f"  [OK] Success!")
            except Exception as e:
                print(f"  [ERROR] {e}")
        else:
            print(f"\n[SKIP] File not found: {fixture_path}")
    
    print("\n" + "=" * 50)
    print("Done!")
    print("=" * 50)

if __name__ == '__main__':
    load_all_fixtures()
