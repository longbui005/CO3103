# Deploy JobFinder on EC2 (Ubuntu 22.04)

This guide deploys your repo `https://github.com/longbui005/CO3103` on one EC2 instance:
- Django backend runs with Gunicorn (`systemd`)
- React frontend is built and served by Nginx
- Nginx proxies `/api`, `/admin`, and `/static` to Gunicorn

## 1. Create EC2

- AMI: Ubuntu 22.04 LTS
- Instance type: `t3.small` or higher
- Security Group inbound:
  - `22` from your IP
  - `80` from `0.0.0.0/0`
  - `443` from `0.0.0.0/0`

SSH:

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 2. Install Packages

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip nodejs npm
```

## 3. Clone Project

```bash
sudo mkdir -p /opt/jobfinder
sudo chown ubuntu:ubuntu /opt/jobfinder
cd /opt/jobfinder
git clone https://github.com/longbui005/CO3103.git .
```

## 4. Backend Setup

```bash
cd /opt/jobfinder/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Create production env file:

```bash
sudo mkdir -p /etc/jobfinder
sudo cp /opt/jobfinder/deploy/ec2/backend.env.example /etc/jobfinder/backend.env
sudo nano /etc/jobfinder/backend.env
```

Set required values in `/etc/jobfinder/backend.env`:
- `DEBUG=False`
- `SECRET_KEY=<strong-random-secret>`
- `ALLOWED_HOSTS=<EC2_PUBLIC_IP>,<your-domain>`
- `DATABASE_URL=postgresql://...` (RDS recommended)
- `CORS_ALLOW_ALL_ORIGINS=False`
- `CORS_ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>,https://<your-domain>`
- `CSRF_TRUSTED_ORIGINS=http://<EC2_PUBLIC_IP>,https://<your-domain>`

Run migrations/static/fixtures:

```bash
cd /opt/jobfinder/backend
source .venv/bin/activate
set -a; source /etc/jobfinder/backend.env; set +a
python manage.py migrate --noinput
python manage.py collectstatic --noinput
python load_fixtures.py
```

## 5. Frontend Setup

```bash
cd /opt/jobfinder/frontend
cp .env.production.example .env.production
nano .env.production
```

Set:

```env
VITE_API_BASE_URL=http://<EC2_PUBLIC_IP>
```

If domain + HTTPS are ready, use:

```env
VITE_API_BASE_URL=https://<your-domain>
```

Build:

```bash
npm ci
npm run build
```

## 6. Start Gunicorn Service

```bash
sudo cp /opt/jobfinder/deploy/ec2/jobfinder-backend.service /etc/systemd/system/jobfinder-backend.service
sudo systemctl daemon-reload
sudo systemctl enable jobfinder-backend
sudo systemctl start jobfinder-backend
sudo systemctl status jobfinder-backend
```

## 7. Configure Nginx

```bash
sudo cp /opt/jobfinder/deploy/ec2/nginx-jobfinder.conf /etc/nginx/sites-available/jobfinder
sudo ln -sf /etc/nginx/sites-available/jobfinder /etc/nginx/sites-enabled/jobfinder
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Open:
- `http://<EC2_PUBLIC_IP>/`

## 8. Enable HTTPS (Recommended)

After DNS points your domain to EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <your-domain> -d www.<your-domain>
```

Then update:
- `/etc/jobfinder/backend.env`: keep only HTTPS origins for `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- `frontend/.env.production`: `VITE_API_BASE_URL=https://<your-domain>`

Rebuild and restart:

```bash
cd /opt/jobfinder/frontend
npm run build
sudo systemctl reload nginx
sudo systemctl restart jobfinder-backend
```

## 9. Future Deploys

```bash
cd /opt/jobfinder
git pull

cd /opt/jobfinder/backend
source .venv/bin/activate
pip install -r requirements.txt
set -a; source /etc/jobfinder/backend.env; set +a
python manage.py migrate --noinput
python manage.py collectstatic --noinput
sudo systemctl restart jobfinder-backend

cd /opt/jobfinder/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

## 10. Logs

Backend:

```bash
sudo journalctl -u jobfinder-backend -f
```

Nginx:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
