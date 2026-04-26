param(
  [Parameter(Mandatory = $true)]
  [string]$Region,

  [Parameter(Mandatory = $false)]
  [string]$RepositoryName = "jobfinder-backend",

  [Parameter(Mandatory = $false)]
  [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

$AccountId = aws sts get-caller-identity --query Account --output text
if (-not $AccountId) {
  throw "Could not resolve AWS account ID. Check AWS CLI authentication."
}

aws ecr describe-repositories --repository-names $RepositoryName --region $Region *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating ECR repository '$RepositoryName' in $Region..."
  aws ecr create-repository --repository-name $RepositoryName --region $Region | Out-Null
}

$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$ImageUri = "$Registry/$RepositoryName`:$ImageTag"

Write-Host "Logging into ECR registry: $Registry"
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $Registry

Write-Host "Building backend image..."
docker build -t "$RepositoryName`:$ImageTag" .

Write-Host "Tagging image as $ImageUri"
docker tag "$RepositoryName`:$ImageTag" $ImageUri

Write-Host "Pushing image..."
docker push $ImageUri

Write-Host ""
Write-Host "Done. Image URI:"
Write-Host $ImageUri
