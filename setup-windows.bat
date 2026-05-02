@echo off
chcp 65001 >nul
echo ========================================
echo Chat Application - Automated Setup
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Download from: https://nodejs.org/
    echo 2. Install the LTS version
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js is installed
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo      Version: %NODE_VERSION%
echo.

:: Check if npm is installed
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm is installed
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo      Version: %NPM_VERSION%
echo.

:: Install Backend Dependencies
echo [3/5] Installing Backend Dependencies...
cd backend
if not exist "node_modules" (
    echo      Running npm install in backend...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend dependencies installation failed!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed successfully
) else (
    echo [SKIP] Backend dependencies already installed
)
cd ..
echo.

:: Install Frontend Dependencies
echo [4/5] Installing Frontend Dependencies...
cd frontend
if not exist "node_modules" (
    echo      Running npm install in frontend...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend dependencies installation failed!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed successfully
) else (
    echo [SKIP] Frontend dependencies already installed
)
cd ..
echo.

:: Create .env file if it doesn't exist
echo [5/5] Checking .env file...
if not exist "backend\.env" (
    echo      Creating .env file template...
    (
        echo # Server Configuration
        echo PORT=5001
        echo NODE_ENV=development
        echo CLIENT_URL=http://localhost:5173
        echo.
        echo # Database Configuration
        echo # Option 1: Local MongoDB
        echo MONGODB_URI=mongodb://localhost:27017/chat-app
        echo.
        echo # Option 2: MongoDB Atlas ^(Cloud^)
        echo # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
        echo.
        echo # Security Keys ^(IMPORTANT: Change these with random strings, min 32 characters^)
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-min-32-chars
        echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-min-32-chars
        echo ENCRYPTION_KEY=your-encryption-key-change-this-min-32-chars
        echo.
        echo # Email Configuration ^(Gmail^)
        echo EMAIL_SERVICE=gmail
        echo EMAIL_USER=your-email@gmail.com
        echo EMAIL_APP_PASSWORD=your-gmail-app-password
        echo EMAIL_FROM="Chat App ^<your-email@gmail.com^>"
    ) > backend\.env
    echo [OK] .env file created in backend folder
    echo [WARNING] Please update backend\.env with your actual values!
) else (
    echo [OK] .env file already exists
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Configure backend\.env file with your settings:
echo    - MongoDB connection string
echo    - Gmail credentials for email OTP
echo    - Security keys ^(change default values^)
echo.
echo 2. Make sure MongoDB is running:
echo    - Local: Check Windows Services ^(services.msc^)
echo    - Cloud: Use MongoDB Atlas connection string in .env
echo.
echo 3. Open TWO terminal windows:
echo.
echo    Terminal 1 - Backend:
echo    cd backend
echo    npm run dev
echo.
echo    Terminal 2 - Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open http://localhost:5173 in your browser
echo.
echo For detailed instructions, see SETUP_GUIDE_WINDOWS.md
echo.
pause
