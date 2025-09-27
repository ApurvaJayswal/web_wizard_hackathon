# SwiftCart Full Stack Application Runner
# This script sets up and runs the complete SwiftCart e-commerce platform

param(
    [switch]$SkipMongo,
    [switch]$Help
)

if ($Help) {
    Write-Host ""
    Write-Host "🚀 SwiftCart Full Stack Application Runner" -ForegroundColor Green
    Write-Host "=" * 50
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\run-swiftcart.ps1          # Full setup and run"
    Write-Host "  .\run-swiftcart.ps1 -SkipMongo  # Skip MongoDB setup"
    Write-Host "  .\run-swiftcart.ps1 -Help       # Show this help"
    Write-Host ""
    Write-Host "What this script does:"
    Write-Host "1. ✅ Checks system requirements"
    Write-Host "2. 📦 Installs dependencies (if needed)"
    Write-Host "3. 🗄️  Sets up MongoDB (Docker or local)"
    Write-Host "4. ⚙️  Configures environment variables"
    Write-Host "5. 🚀 Starts both frontend and backend servers"
    Write-Host ""
    Write-Host "Servers will run on:"
    Write-Host "- Frontend: http://localhost:5173"
    Write-Host "- Backend:  http://localhost:5000"
    Write-Host "- API Docs: http://localhost:5000/api"
    Write-Host ""
    return
}

function Write-ColorText($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Test-CommandExists($Command) {
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Start-MongoDBDocker {
    Write-ColorText "🐳 Starting MongoDB with Docker..." "Cyan"
    try {
        $existingContainer = docker ps -a --filter "name=swiftcart_mongodb" --format "table {{.Names}}\t{{.Status}}" 2>$null
        
        if ($existingContainer -match "swiftcart_mongodb") {
            if ($existingContainer -match "Up") {
                Write-ColorText "✅ MongoDB container is already running" "Green"
                return $true
            } else {
                Write-ColorText "🔄 Starting existing MongoDB container..." "Yellow"
                docker start swiftcart_mongodb | Out-Null
                Start-Sleep -Seconds 3
                return $true
            }
        } else {
            Write-ColorText "🆕 Creating new MongoDB container..." "Yellow"
            docker run -d --name swiftcart_mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=swiftcart mongo:latest | Out-Null
            Start-Sleep -Seconds 5
            return $true
        }
    } catch {
        Write-ColorText "❌ Failed to start MongoDB with Docker: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Header
Clear-Host
Write-ColorText ""
Write-ColorText "🚀 SwiftCart E-Commerce Platform" "Green"
Write-ColorText "═══════════════════════════════════════════════════" "Green"
Write-ColorText "Complete full-stack e-commerce solution with:" "Gray"
Write-ColorText "• React + TypeScript frontend with shadcn/ui" "Gray"
Write-ColorText "• Node.js + Express backend with MongoDB" "Gray"
Write-ColorText "• JWT authentication & Stripe payments" "Gray"
Write-ColorText "• Real-time cart management & order processing" "Gray"
Write-ColorText ""

# System Requirements Check
Write-ColorText "🔍 Checking System Requirements..." "Cyan"
Write-ColorText "─────────────────────────────────────" "Gray"

$requirements = @()

# Check Node.js
if (Test-CommandExists "node") {
    $nodeVersion = (node --version) -replace 'v', ''
    if ([version]$nodeVersion -ge [version]"18.0.0") {
        Write-ColorText "✅ Node.js $nodeVersion (Required: 18+)" "Green"
    } else {
        Write-ColorText "⚠️  Node.js $nodeVersion (Update recommended)" "Yellow"
    }
} else {
    Write-ColorText "❌ Node.js not found" "Red"
    $requirements += "Node.js 18+"
}

# Check npm
if (Test-CommandExists "npm") {
    $npmVersion = npm --version
    Write-ColorText "✅ npm $npmVersion" "Green"
} else {
    Write-ColorText "❌ npm not found" "Red"
    $requirements += "npm"
}

# Check Docker (optional)
$dockerAvailable = $false
if (Test-CommandExists "docker") {
    try {
        docker --version | Out-Null
        $dockerAvailable = $true
        Write-ColorText "✅ Docker available (for MongoDB)" "Green"
    } catch {
        Write-ColorText "⚠️  Docker not running" "Yellow"
    }
} else {
    Write-ColorText "⚠️  Docker not found (MongoDB will need manual setup)" "Yellow"
}

if ($requirements.Count -gt 0) {
    Write-ColorText ""
    Write-ColorText "❌ Missing requirements:" "Red"
    $requirements | ForEach-Object { Write-ColorText "   • $_" "Red" }
    Write-ColorText ""
    Write-ColorText "Please install the missing requirements and run the script again." "Red"
    return
}

Write-ColorText ""

# Check if dependencies are already installed
$frontendDepsInstalled = Test-Path "node_modules"
$backendDepsInstalled = Test-Path "backend/node_modules"

# Install Dependencies
if (-not $frontendDepsInstalled -or -not $backendDepsInstalled) {
    Write-ColorText "📦 Installing Dependencies..." "Cyan"
    Write-ColorText "─────────────────────────────" "Gray"
    
    if (-not $frontendDepsInstalled) {
        Write-ColorText "📱 Installing frontend dependencies..." "Blue"
        try {
            npm install --silent
            Write-ColorText "✅ Frontend dependencies installed" "Green"
        } catch {
            Write-ColorText "❌ Failed to install frontend dependencies" "Red"
            return
        }
    }
    
    if (-not $backendDepsInstalled) {
        Write-ColorText "🔧 Installing backend dependencies..." "Blue"
        try {
            Push-Location backend
            npm install --silent
            Pop-Location
            Write-ColorText "✅ Backend dependencies installed" "Green"
        } catch {
            Write-ColorText "❌ Failed to install backend dependencies" "Red"
            return
        }
    }
} else {
    Write-ColorText "✅ Dependencies already installed" "Green"
}

Write-ColorText ""

# MongoDB Setup
if (-not $SkipMongo) {
    Write-ColorText "🗄️  Database Setup..." "Cyan"
    Write-ColorText "─────────────────────" "Gray"
    
    # Check if MongoDB is already running
    try {
        $mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
        if ($mongoTest.TcpTestSucceeded) {
            Write-ColorText "✅ MongoDB is already running on localhost:27017" "Green"
        } else {
            if ($dockerAvailable) {
                $mongoStarted = Start-MongoDBDocker
                if (-not $mongoStarted) {
                    Write-ColorText "⚠️  MongoDB setup failed. You'll need to start MongoDB manually." "Yellow"
                    Write-ColorText "   Options:" "Yellow"
                    Write-ColorText "   1. docker run -d -p 27017:27017 --name mongodb mongo:latest" "Gray"
                    Write-ColorText "   2. Install MongoDB Community Server" "Gray"
                    Write-ColorText "   3. Use MongoDB Atlas (update .env file)" "Gray"
                }
            } else {
                Write-ColorText "⚠️  MongoDB not running and Docker not available" "Yellow"
                Write-ColorText "   Please start MongoDB manually or update .env for Atlas" "Yellow"
            }
        }
    } catch {
        Write-ColorText "⚠️  Could not check MongoDB status" "Yellow"
    }
} else {
    Write-ColorText "⏭️  Skipping MongoDB setup" "Yellow"
}

Write-ColorText ""

# Environment Setup
Write-ColorText "⚙️  Environment Configuration..." "Cyan"
Write-ColorText "─────────────────────────────────" "Gray"

if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.example") {
        Copy-Item "backend/.env.example" "backend/.env"
        Write-ColorText "✅ Created backend/.env from example" "Green"
        Write-ColorText "   📝 Default development settings applied" "Gray"
    } else {
        Write-ColorText "❌ .env.example not found" "Red"
        return
    }
} else {
    Write-ColorText "✅ Environment file already exists" "Green"
}

Write-ColorText ""

# Final Setup Summary
Write-ColorText "🎯 Starting SwiftCart Platform..." "Magenta"
Write-ColorText "═══════════════════════════════════════" "Magenta"
Write-ColorText ""
Write-ColorText "🌐 Frontend Server: http://localhost:5173" "Blue"
Write-ColorText "🔧 Backend API:     http://localhost:5000" "Blue" 
Write-ColorText "📚 API Documentation: http://localhost:5000/api" "Gray"
Write-ColorText "🏥 Health Check:    http://localhost:5000/health" "Gray"
Write-ColorText ""
Write-ColorText "⚡ Both servers starting up..." "Yellow"
Write-ColorText "   Press Ctrl+C to stop both servers" "Gray"
Write-ColorText ""

# Create run scripts for easier management
$backendScript = @"
Set-Location backend
Write-Host "🔧 Starting SwiftCart Backend API..." -ForegroundColor Blue
npm run dev
"@

$frontendScript = @"
Write-Host "🎨 Starting SwiftCart Frontend..." -ForegroundColor Cyan
npm run dev
"@

# Start both servers
try {
    # Start backend
    $backendJob = Start-Job -ScriptBlock {
        param($script, $location)
        Set-Location $location
        Invoke-Expression $script
    } -ArgumentList $backendScript, (Get-Location)

    # Start frontend  
    $frontendJob = Start-Job -ScriptBlock {
        param($script, $location)
        Set-Location $location
        Invoke-Expression $script
    } -ArgumentList $frontendScript, (Get-Location)

    Write-ColorText "🚀 SwiftCart is now running!" "Green"
    Write-ColorText ""
    Write-ColorText "📊 Server Status Monitor (Ctrl+C to stop)" "Yellow"
    Write-ColorText "═════════════════════════════════════════════" "Gray"

    $startTime = Get-Date
    while ($true) {
        Start-Sleep -Seconds 3
        
        # Check job status
        $backendStatus = (Get-Job -Id $backendJob.Id).State
        $frontendStatus = (Get-Job -Id $frontendJob.Id).State
        
        $runtime = (Get-Date) - $startTime
        $runtimeStr = "{0:hh\:mm\:ss}" -f $runtime
        
        # Clear previous status line and show current status
        Write-Host "`r🕐 Runtime: $runtimeStr | Backend: " -NoNewline -ForegroundColor Gray
        
        switch ($backendStatus) {
            "Running" { Write-Host "🟢 Running" -NoNewline -ForegroundColor Green }
            "Failed" { Write-Host "🔴 Failed" -NoNewline -ForegroundColor Red }
            default { Write-Host "🟡 $backendStatus" -NoNewline -ForegroundColor Yellow }
        }
        
        Write-Host " | Frontend: " -NoNewline -ForegroundColor Gray
        
        switch ($frontendStatus) {
            "Running" { Write-Host "🟢 Running" -NoNewline -ForegroundColor Green }
            "Failed" { Write-Host "🔴 Failed" -NoNewline -ForegroundColor Red }
            default { Write-Host "🟡 $frontendStatus" -NoNewline -ForegroundColor Yellow }
        }
        
        # Check if both failed
        if ($backendStatus -eq "Failed" -and $frontendStatus -eq "Failed") {
            Write-Host ""
            Write-ColorText "❌ Both servers failed to start" "Red"
            break
        }
    }

} catch {
    Write-ColorText ""
    Write-ColorText "🛑 Stopping servers..." "Red"
} finally {
    # Cleanup
    if ($backendJob) {
        Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendJob) {
        Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue  
        Remove-Job -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
    }
    Write-ColorText ""
    Write-ColorText "✅ SwiftCart stopped gracefully" "Green"
    Write-ColorText "   Thank you for using SwiftCart! 🛒✨" "Gray"
}