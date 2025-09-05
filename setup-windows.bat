@echo off
echo F1 Finance Application Setup Script for Windows
echo =============================================

echo Installing frontend dependencies...
call npm install

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo Creating necessary directories...
if not exist "backend\uploads" mkdir backend\uploads

echo Setting up environment...
echo Checking for .env files...

if not exist ".env" (
  echo Creating frontend .env file...
  echo REACT_APP_API_URL=http://localhost:5000/api > .env
)

if not exist "backend\.env" (
  echo Creating backend .env file...
  (
    echo MONGO_URI=mongodb://localhost:27017/f1finance
    echo JWT_SECRET=f1finance_jwt_secret_key_dev
    echo JWT_EXPIRES_IN=30d
    echo PORT=5000
    echo NODE_ENV=development
  ) > backend\.env
)

echo.
echo Setup complete! You can now run the application with:
echo npm run dev:all
echo.
echo This will start both the frontend and backend servers.
