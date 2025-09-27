# SwiftCart Full Stack Setup and Run Script
# This script sets up and runs both frontend and backend

Write-Host "🚀 Setting up SwiftCart Full Stack Application" -ForegroundColor Green
Write-Host "=" * 60

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running (optional check)
Write-Host ""
Write-Host "🔍 Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoCheck.TcpTestSucceeded) {
        Write-Host "✅ MongoDB is running on localhost:27017" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB is not running locally" -ForegroundColor Yellow
        Write-Host "   You can either:" -ForegroundColor Yellow
        Write-Host "   1. Start MongoDB locally" -ForegroundColor Yellow
        Write-Host "   2. Use MongoDB Atlas (cloud)" -ForegroundColor Yellow
        Write-Host "   3. Run MongoDB with Docker: docker run -d -p 27017:27017 mongo:latest" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check MongoDB status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Cyan

# Install frontend dependencies
if (Test-Path "package.json") {
    try {
        npm install
        Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Cyan

# Install backend dependencies
if (Test-Path "backend/package.json") {
    Set-Location backend
    try {
        npm install
        Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
        Set-Location ..
    } catch {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "❌ Backend package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚙️  Setting up Environment Variables..." -ForegroundColor Cyan

# Create backend .env file if it doesn't exist
if (!(Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.example") {
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Host "✅ Created backend/.env from example" -ForegroundColor Green
        Write-Host "⚠️  Please update backend/.env with your actual values:" -ForegroundColor Yellow
        Write-Host "   - JWT_SECRET (required)" -ForegroundColor Yellow
        Write-Host "   - MONGO_URI (required)" -ForegroundColor Yellow
        Write-Host "   - STRIPE_SECRET_KEY (required)" -ForegroundColor Yellow
        Write-Host "   - STRIPE_WEBHOOK_SECRET (required)" -ForegroundColor Yellow
        Write-Host ""
        
        # Ask user if they want to continue with default values
        $continue = Read-Host "Do you want to continue with example values for testing? (y/n)"
        if ($continue.ToLower() -ne "y") {
            Write-Host "Please update backend/.env and run the script again" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "❌ Backend .env.example not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Backend .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Starting Applications..." -ForegroundColor Magenta
Write-Host "=" * 40

# Function to start backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Blue
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Gray

# Function to start frontend  
Write-Host "🎨 Starting Frontend Development Server..." -ForegroundColor Blue
Write-Host "Frontend will run on: http://localhost:5173" -ForegroundColor Gray

Write-Host ""
Write-Host "✨ Both applications are starting up..." -ForegroundColor Green
Write-Host "📖 API Documentation: http://localhost:5000/api" -ForegroundColor Gray
Write-Host "🏥 Health Check: http://localhost:5000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers concurrently
Start-Job -Name "Backend" -ScriptBlock {
    Set-Location $args[0]
    Set-Location backend
    npm run dev
} -ArgumentList (Get-Location)

Start-Job -Name "Frontend" -ScriptBlock {
    Set-Location $args[0]
    npm run dev
} -ArgumentList (Get-Location)

# Monitor jobs and display output
try {
    Write-Host "🚀 Applications are now running!" -ForegroundColor Green
    Write-Host "Monitoring both servers... (Press Ctrl+C to stop)" -ForegroundColor Yellow
    
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Check if jobs are still running
        $backendJob = Get-Job -Name "Backend" -ErrorAction SilentlyContinue
        $frontendJob = Get-Job -Name "Frontend" -ErrorAction SilentlyContinue
        
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Backend server failed" -ForegroundColor Red
            Receive-Job -Name "Backend"
        }
        
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Frontend server failed" -ForegroundColor Red
            Receive-Job -Name "Frontend"
        }
        
        # Show any output from jobs
        Receive-Job -Name "Backend" -Keep | ForEach-Object { Write-Host "[Backend] $_" -ForegroundColor Blue }
        Receive-Job -Name "Frontend" -Keep | ForEach-Object { Write-Host "[Frontend] $_" -ForegroundColor Cyan }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Red
} finally {
    # Clean up jobs
    Stop-Job -Name "Backend" -ErrorAction SilentlyContinue
    Stop-Job -Name "Frontend" -ErrorAction SilentlyContinue
    Remove-Job -Name "Backend" -Force -ErrorAction SilentlyContinue
    Remove-Job -Name "Frontend" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}