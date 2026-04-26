param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [Parameter(Mandatory = $true)]
  [string]$Region,

  [Parameter(Mandatory = $false)]
  [string]$CloudFrontDistributionId = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.production")) {
  throw "Missing frontend/.env.production. Copy .env.production.example and set VITE_API_BASE_URL first."
}

Write-Host "Installing dependencies..."
npm ci

Write-Host "Building production frontend..."
npm run build

Write-Host "Syncing build artifacts to s3://$BucketName ..."
aws s3 sync dist "s3://$BucketName" --delete --region $Region

if ($CloudFrontDistributionId -ne "") {
  Write-Host "Invalidating CloudFront cache for distribution $CloudFrontDistributionId ..."
  aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*" | Out-Null
}

Write-Host "Frontend deployment complete."
