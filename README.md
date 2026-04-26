# JobFinder - Job Search Platform

A full-stack job search platform built with Django (Backend) and React + Vite (Frontend).

---

## Overview

JobFinder is a full-stack job search and hiring platform composed of a Django REST backend and a React + Vite frontend. The repository contains everything needed for local development and for preparing a demo, including database fixtures, helper scripts, and a set of reusable UI components.

This README (English sections) documents the system architecture, project layout, important APIs for the demo, deployment notes, troubleshooting tips, and contribution guidance.

## Architecture

- Backend: Django 5.x with Django REST Framework. The backend exposes a JSON REST API and handles authentication, job and application persistence, fixtures loading, and optional Cloudinary-based media uploads.
- Frontend: React + TypeScript, built with Vite. The frontend is a client-side SPA that calls the backend APIs and manages application state through React contexts (AuthContext, JobsContext).
- Database: SQLite is used by default for local development. The project includes optional PostgreSQL configuration for production deployments.

## Repository Layout (high level)

- `backend/` — Django project and apps (`main`, `users`, `jobfinder`). Contains management scripts, migrations, fixtures, and environment example.
- `frontend/` — React + Vite application, UI components, contexts, pages, and build configuration.

## Backend: modules & responsibilities

- `users` app: registration, authentication, user profiles, signals to keep profile fields in sync, and fixtures for lookup tables.
- `jobfinder` app: job posting models (Form), Application model, serializers and viewsets for listing, applying, and managing applications.
- API auth: token-based authentication endpoints (Simple JWT) are available for login and refresh.

## Frontend: key components

- `AuthContext` manages authentication state (tokens, current user) and exposes login/register/logout helpers.
- `JobsContext` loads jobs and applications, and provides functions to apply, approve, and reject.
- Reusable UI: `JobCard`, `Navbar`, `Footer`, and multiple UI primitives in `components/ui/`.
- Badge helpers: shared utility for rendering job-type and work-format labels with consistent colors.

## Important API Endpoints

- Public job listings: `GET /api/jobfinder/forms/`
- Job detail: `GET /api/jobfinder/forms/<id>/`
- Apply to job (authenticated): `POST /api/jobfinder/forms/<id>/apply/` (multipart if uploading CV)
- List applications for a form (employer): `GET /api/jobfinder/applications/?form=<id>`
- Approve / Reject application (employer): `POST /api/jobfinder/applications/<id>/approve/`, `POST /api/jobfinder/applications/<id>/reject/`
- Auth (JWT): `POST /api/auth/token/` (obtain), `POST /api/auth/token/refresh/` (refresh)

Note: actual paths may vary if you change the `api` prefix in `main/urls.py`.

## Environment variables and secrets

- Sensitive values must be stored in `backend/.env` (copy `backend/.env.example`). Important variables include:
	- `SECRET_KEY` — Django secret key
	- `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — database connection
	- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — optional media storage
	- `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` — used by setup scripts

## Initial Setup

### I. Initial Backend

#### 1. Initial Environment and Requirements:

```bash
cd backend
python backend/initial_venv.py
```

Or, manually:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

#### 2. Setup .env file
- Copy `.env.example` to `.env` and fill in the required environment variables.
- Make sure to set up Cloudinary credentials for media uploads (Default APIs are set).
- Set up Django superuser credentials.
- Configure database settings: if using PostgreSQL, provide the connection details. Else, default SQLite will be used.

#### 3. Migrate Database and Create Superuser

```bash
python make_and_migrate.py
python create_superuser.py
```

Or, manually:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

#### 4. Load Fixtures

```bash
python load_fixtures.py
```

#### 5. Run Development Server

```bash
python manage.py runserver
```

### II. Initial Frontend

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Run Development Server

```bash
npm run dev
```

## AWS Deployment

For production deployment on AWS (App Runner + RDS + S3), follow:

- `DEPLOY_AWS.md`

For deployment on a single EC2 instance (Nginx + Gunicorn), follow:

- `DEPLOY_EC2.md`
