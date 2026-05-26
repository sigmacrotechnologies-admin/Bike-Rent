# VelocityRent — Local MongoDB Setup Script
# Run: .\setup-local.ps1

Write-Host "`n=== VelocityRent Local Setup ===" -ForegroundColor Cyan

# 1. Check MongoDB
Write-Host "`n[1/4] Checking MongoDB on localhost:27017..." -ForegroundColor Yellow
$mongo = Test-NetConnection localhost -Port 27017 -WarningAction SilentlyContinue
if (-not $mongo.TcpTestSucceeded) {
    Write-Host "ERROR: MongoDB is NOT running!" -ForegroundColor Red
    Write-Host "  Install: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "  Then run: net start MongoDB" -ForegroundColor White
    exit 1
}
Write-Host "  MongoDB is running." -ForegroundColor Green

# 2. Check .env
Write-Host "`n[2/4] Checking environment config..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "  .env exists." -ForegroundColor Green
}

# 3. Seed database
Write-Host "`n[3/4] Seeding MongoDB database 'velocity_rent'..." -ForegroundColor Yellow
Set-Location backend
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Seed failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "  Database seeded successfully." -ForegroundColor Green

# 4. Instructions to start
Write-Host "`n[4/4] Start the app (open 2 terminals):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1 — Backend API:" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 — Website:" -ForegroundColor White
Write-Host "    cd apps\web" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Website:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API:      http://localhost:5000/api/v1" -ForegroundColor Cyan
Write-Host "  MongoDB:  mongodb://localhost:27017/velocity_rent" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Login: admin@velocityrent.com / Admin@123456" -ForegroundColor Green
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
