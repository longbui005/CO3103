#!/bin/sh
set -e

echo "Collecting static files..."
python manage.py collectstatic --noinput

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "Running database migrations..."
  python manage.py migrate --noinput
fi

if [ "${LOAD_FIXTURES:-0}" = "1" ]; then
  echo "Loading fixtures..."
  python load_fixtures.py
fi

if [ "${CREATE_SUPERUSER:-0}" = "1" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  echo "Ensuring superuser exists..."
  python create_superuser.py
fi

echo "Starting Gunicorn..."
exec gunicorn main.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout "${GUNICORN_TIMEOUT:-120}"
