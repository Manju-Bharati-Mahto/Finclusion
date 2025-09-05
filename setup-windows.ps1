# F1 Finance Application Setup Script for Windows (PowerShell)
Write-Host "F1 Finance Application Setup Script for Windows" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location -Path "backend"
npm install
Pop-Location

Write-Host "Creating necessary directories..." -ForegroundColor Yellow
if (-not (Test-Path -Path "backend\uploads")) {
    New-Item -Path "backend\uploads" -ItemType Directory
}

Write-Host "Setting up environment..." -ForegroundColor Yellow
Write-Host "Checking for .env files..." -ForegroundColor Yellow

if (-not (Test-Path -Path ".env")) {
    Write-Host "Creating frontend .env file..." -ForegroundColor Yellow
    Set-Content -Path ".env" -Value "REACT_APP_API_URL=http://localhost:5000/api"
}

if (-not (Test-Path -Path "backend\.env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    $backendEnvContent = @"
MONGO_URI=mongodb://localhost:27017/f1finance
JWT_SECRET=f1finance_jwt_secret_key_dev
JWT_EXPIRES_IN=30d
PORT=5000
NODE_ENV=development
"@
    Set-Content -Path "backend\.env" -Value $backendEnvContent
}

Write-Host ""
Write-Host "Setup complete! You can now run the application with:" -ForegroundColor Green
Write-Host "npm run dev:all" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start both the frontend and backend servers." -ForegroundColor Green
