@echo off
REM OKPI First Admin Setup Script for Windows
REM This script helps create the first admin user for OKPI deployment

setlocal enabledelayedexpansion

echo.
echo ======================================
echo OKPI First Admin User Setup
echo ======================================
echo.

REM Configuration
if not defined API_URL set "API_URL=http://localhost:8080"
if not defined ADMIN_EMAIL set "ADMIN_EMAIL=admin@okpi.local"
if not defined ADMIN_FIRST_NAME set "ADMIN_FIRST_NAME=System"
if not defined ADMIN_LAST_NAME set "ADMIN_LAST_NAME=Administrator"

echo Checking API availability at %API_URL%...

REM Check if API is available
curl -s "%API_URL%/api/v1/auth/users" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: API is not available at %API_URL%
    echo Please ensure OKPI services are running:
    echo   docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo [OK] API is available
echo.

REM Prompt for admin password
if not defined ADMIN_PASSWORD (
    set "ADMIN_PASSWORD="
    echo Enter a strong password for the admin user:
    set /p ADMIN_PASSWORD=Password: 
)

if "!ADMIN_PASSWORD!"=="" (
    echo.
    echo ERROR: Password cannot be empty
    echo.
    pause
    exit /b 1
)

echo.
echo Creating admin user...
echo   Email: %ADMIN_EMAIL%
echo   Name: %ADMIN_FIRST_NAME% %ADMIN_LAST_NAME%
echo.

REM Create temporary JSON file for registration
(
    echo.{
    echo.  "email": "%ADMIN_EMAIL%",
    echo.  "password": "%ADMIN_PASSWORD%",
    echo.  "firstName": "%ADMIN_FIRST_NAME%",
    echo.  "lastName": "%ADMIN_LAST_NAME%"
    echo.}
) > temp_register.json

REM Register the user
for /f "tokens=*" %%A in ('curl -s -X POST "%API_URL%/api/v1/auth/register" ^
  -H "Content-Type: application/json" ^
  -d @temp_register.json') do set "REGISTER_RESPONSE=%%A"

REM Extract user ID (simplified approach - look for "id" field)
echo.
echo %REGISTER_RESPONSE% | find "id" >nul
if errorlevel 1 (
    echo ERROR: Failed to create user
    echo Response: %REGISTER_RESPONSE%
    del temp_register.json
    pause
    exit /b 1
)

echo [OK] User created successfully
echo.

REM Login to get token
echo Logging in to get access token...

(
    echo.{
    echo.  "email": "%ADMIN_EMAIL%",
    echo.  "password": "%ADMIN_PASSWORD%"
    echo.}
) > temp_login.json

for /f "tokens=*" %%A in ('curl -s -X POST "%API_URL%/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d @temp_login.json') do set "LOGIN_RESPONSE=%%A"

REM Extract access token
echo %LOGIN_RESPONSE% | find "accessToken" >nul
if errorlevel 1 (
    echo ERROR: Failed to login
    echo Response: %LOGIN_RESPONSE%
    del temp_register.json temp_login.json
    pause
    exit /b 1
)

echo [OK] Login successful
echo.

echo ======================================
echo [OK] Admin setup complete!
echo ======================================
echo.
echo Login credentials:
echo   Email: %ADMIN_EMAIL%
echo   Password: (the password you entered^)
echo.
echo Next steps:
echo 1. Open the application at: http://localhost:3000
echo 2. Login with the above credentials
echo 3. Create more users through the admin interface
echo.

REM Cleanup
del temp_register.json temp_login.json

pause
