#!/bin/sh
set -e

echo "==> Mediswift Pro Backend Starting..."

# Optional: Wait for PostgreSQL if DB_HOST is configured
if [ -n "$DB_HOST" ]; then
  echo "==> Waiting for PostgreSQL at $DB_HOST:${DB_PORT:-5432}..."
  while ! nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
    sleep 1
  done
  echo "==> PostgreSQL is up and accepting connections!"
fi

# Run database migrations
echo "==> Applying database migrations..."
python manage.py migrate --noinput

# Collect static files into STATIC_ROOT for Nginx / WhiteNoise
echo "==> Collecting static assets..."
python manage.py collectstatic --noinput --clear

echo "==> Database migrations and static collection complete."
echo "==> Launching Gunicorn WSGI application..."

exec "$@"
