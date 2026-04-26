# Deploy JobFinder on AWS

This guide deploys:
- Backend: Django API on AWS App Runner (container from ECR)
- Database: Amazon RDS PostgreSQL
- Frontend: React build on Amazon S3 (optional CloudFront on top)

## 1. Prerequisites

- AWS account and IAM user with permissions for ECR, App Runner, RDS, S3, CloudFront
- AWS CLI configured: `aws configure`
- Docker Desktop running
- Node.js + npm installed

## 2. Prepare Production Environment Files

1. Backend env template:
- Copy `backend/.env.production.example` and fill real values.

2. Frontend env template:
- Copy `frontend/.env.production.example` to `frontend/.env.production`.
- Set:
  - `VITE_API_BASE_URL=https://<your-backend-domain>`

## 3. Create RDS PostgreSQL

Create one PostgreSQL instance in AWS RDS (console is easiest for first deploy):
- Engine: PostgreSQL
- Public access: choose based on your networking plan
- Security Group: allow inbound 5432 from App Runner VPC connector/security group
- If RDS is private, App Runner must use a VPC Connector in the same VPC/subnets
- Save endpoint, username, password, database name

Then set backend `DATABASE_URL`:

```text
postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>
```

## 4. Build and Push Backend Image to ECR

Run in PowerShell:

```powershell
cd backend
.\deploy-ecr.ps1 -Region ap-southeast-1 -RepositoryName jobfinder-backend -ImageTag v1
```

This prints an image URI like:

```text
123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/jobfinder-backend:v1
```

## 5. Create App Runner Service

In AWS Console:
- App Runner -> Create service
- Source: Container registry -> Amazon ECR
- Image URI: use the URI from step 4
- Port: `8000`
- Health check path: `/api/jobfinder/forms/` (or `/admin/`)

Set environment variables from `backend/.env.production.example`, especially:
- `DEBUG=False`
- `SECRET_KEY=...`
- `ALLOWED_HOSTS=<apprunner-domain>,<custom-api-domain-if-any>`
- `DATABASE_URL=...`
- `CORS_ALLOW_ALL_ORIGINS=False`
- `CORS_ALLOWED_ORIGINS=https://<frontend-domain>`
- `CSRF_TRUSTED_ORIGINS=https://<frontend-domain>`
- `RUN_MIGRATIONS=1`
- `LOAD_FIXTURES=1` for first deploy, then switch to `0` after data is seeded

After deploy, test:
- `https://<apprunner-domain>/api/jobfinder/forms/`

## 6. Deploy Frontend to S3

1. Create an S3 bucket for web hosting (globally unique name).

2. Enable Static Website Hosting:
- Index document: `index.html`
- Error document: `index.html` (important for React Router SPA)

3. Make objects readable (for simple hosting):
- Turn off Block Public Access for this bucket
- Add bucket policy (replace bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

4. Deploy from PowerShell:

```powershell
cd frontend
.\deploy-s3.ps1 -BucketName YOUR_BUCKET_NAME -Region ap-southeast-1
```

Use the S3 website endpoint as your frontend URL.

## 7. Optional: Put CloudFront in Front of S3

- Create a CloudFront distribution with the S3 website endpoint as origin.
- Add custom error responses:
  - `403` -> `/index.html` (HTTP 200)
  - `404` -> `/index.html` (HTTP 200)
- If you use CloudFront, redeploy frontend with cache invalidation:

```powershell
cd frontend
.\deploy-s3.ps1 -BucketName YOUR_BUCKET_NAME -Region ap-southeast-1 -CloudFrontDistributionId E123ABC456XYZ
```

Then set:
- `CORS_ALLOWED_ORIGINS=https://<cloudfront-domain-or-custom-domain>`
- `CSRF_TRUSTED_ORIGINS=https://<cloudfront-domain-or-custom-domain>`

## 8. First Deploy Checklist

- Backend endpoint returns JSON at `/api/jobfinder/forms/`
- Frontend loads and can call backend without CORS errors
- Login/register works
- File upload (Cloudinary) works
- App Runner logs show no migration errors
