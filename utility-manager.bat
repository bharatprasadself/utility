@echo off
setlocal

:MENU
cls
echo ===================================
echo Utility App Manager
echo ===================================
echo.
echo Deployment Options:
echo 1. Local Deployment
echo 2. Docker Deployment
echo 3. Exit
echo.
set /p CHOICE=Enter your choice (1-3): 

if "%CHOICE%"=="1" goto LOCAL_MENU
if "%CHOICE%"=="2" goto DOCKER_MENU
if "%CHOICE%"=="3" goto EXIT
goto MENU

:LOCAL_MENU
cls
echo ===================================
echo Local Deployment Options
echo ===================================
echo.
echo Database Operations:
echo 1. Switch to H2 file-based database
echo 2. Switch to PostgreSQL database
echo 3. Reset H2 database (delete files)
echo 4. Set H2 database password
echo.
echo Security Configuration:
echo 5. Configure JWT Settings
echo 6. View Current Configuration
echo.
echo Application:
echo 7. Start application with current config
echo 8. Back to main menu
echo.
set /p CHOICE=Enter your choice (1-8): 

if "%CHOICE%"=="1" goto SWITCH_H2
if "%CHOICE%"=="2" goto SWITCH_POSTGRES
if "%CHOICE%"=="3" goto RESET_H2
if "%CHOICE%"=="4" goto SET_PASSWORD
if "%CHOICE%"=="5" goto CONFIG_JWT
if "%CHOICE%"=="6" goto VIEW_CONFIG
if "%CHOICE%"=="7" goto START_APP
if "%CHOICE%"=="8" goto MENU
goto LOCAL_MENU

:DOCKER_MENU
cls
echo ===================================
echo Docker Deployment Options
echo ===================================
echo.
echo 1. Build Docker Image
echo 2. Initialize Database (First-time setup)
echo 3. Start Application (Regular use)
echo 4. Stop Application
echo 5. View Application Logs
echo 6. Back to main menu
echo.
set /p CHOICE=Enter your choice (1-6): 

if "%CHOICE%"=="1" goto DOCKER_BUILD
if "%CHOICE%"=="2" goto DOCKER_INIT
if "%CHOICE%"=="3" goto DOCKER_START
if "%CHOICE%"=="4" goto DOCKER_STOP
if "%CHOICE%"=="5" goto DOCKER_LOGS
if "%CHOICE%"=="6" goto MENU
goto DOCKER_MENU

:DOCKER_BUILD
echo.
echo Building Docker image...
docker build -t utility-app .
echo.
echo Docker image built successfully.
pause
goto DOCKER_MENU

:DOCKER_INIT
echo.
echo Initializing database (first-time setup)...
docker run -it --rm ^
  --name utility-init ^
  -v %cd%\data:/app/data ^
  -e SPRING_PROFILES_ACTIVE=init ^
  utility-app
echo.
echo Database initialization completed.
pause
goto DOCKER_MENU

:DOCKER_START
echo.
echo Starting application in Docker container...
docker run -d ^
  --name utility-app ^
  -p 8080:8080 ^
  -v %cd%\data:/app/data ^
  utility-app
echo.
echo Application started on http://localhost:8080
pause
goto DOCKER_MENU

:DOCKER_STOP
echo.
echo Stopping and removing Docker container...
docker stop utility-app
docker rm utility-app
echo.
echo Docker container stopped and removed.
pause
goto DOCKER_MENU

:DOCKER_LOGS
echo.
echo Viewing application logs...
docker logs utility-app
echo.
pause
goto DOCKER_MENU

:SWITCH_H2
echo.
echo Switching to H2 file-based database...
echo # Auto-generated configuration file > src\main\resources\application.properties
echo # Created by db-manager.bat on %date% %time% >> src\main\resources\application.properties
echo spring.profiles.active=prod-h2 >> src\main\resources\application.properties
echo utility.database.type=h2 >> src\main\resources\application.properties
echo Database configuration updated to H2
echo Spring profile set to: prod-h2
pause
goto LOCAL_MENU

:SWITCH_POSTGRES
echo.
echo Switching to PostgreSQL database...
echo # Auto-generated configuration file > src\main\resources\application.properties
echo # Created by db-manager.bat on %date% %time% >> src\main\resources\application.properties
echo spring.profiles.active=prod >> src\main\resources\application.properties
echo utility.database.type=postgresql >> src\main\resources\application.properties
echo Database configuration updated to PostgreSQL
echo Spring profile set to: prod
pause
goto LOCAL_MENU

:RESET_H2
echo.
echo This will delete the current H2 database files.
echo WARNING: All data in the database will be lost!
echo.
set /p CONFIRM=Are you sure you want to continue? (y/n): 

if /i not "%CONFIRM%"=="y" (
    echo Operation cancelled.
    pause
    goto LOCAL_MENU
)

echo.
echo Removing existing database files...
if exist data\utilitydb.mv.db (
    del /f /q data\utilitydb.mv.db
    echo - Removed data\utilitydb.mv.db
)

if exist data\utilitydb.trace.db (
    del /f /q data\utilitydb.trace.db
    echo - Removed data\utilitydb.trace.db
)

echo.
echo Database files removed.
echo A new database will be created when the application starts.
pause
goto LOCAL_MENU

:SET_PASSWORD
echo.
echo Setting H2 database password...
echo NOTE: The database must not be in use when changing the password.
echo.
set /p NEW_PASSWORD=Enter new password (leave empty for no password): 
echo.
echo Updating application-prod-h2.properties with the new password...
powershell -Command "(Get-Content src\main\resources\application-prod-h2.properties) -replace 'h2.datasource.password=.*', 'h2.datasource.password=%NEW_PASSWORD%' | Set-Content src\main\resources\application-prod-h2.properties"
echo Password updated.
pause
goto LOCAL_MENU

:START_APP
echo.
echo Building and starting application...
set DB_RESET=n
set /p DB_RESET=Reset database before starting? (y/n) [default=n]: 

if /i "%DB_RESET%"=="y" (
    if exist data\utilitydb.mv.db (
        del /f /q data\utilitydb.mv.db
        echo - Removed data\utilitydb.mv.db
    )
    if exist data\utilitydb.trace.db (
        del /f /q data\utilitydb.trace.db
        echo - Removed data\utilitydb.trace.db
    )
    echo Database files removed.
)

echo Building application...
call mvn clean package -DskipTests

echo Starting application...
java -jar target\utility-1.2.0-SNAPSHOT.jar
goto LOCAL_MENU

:CONFIG_JWT
echo.
echo JWT Configuration
echo ================
echo.
echo Current JWT configuration:
echo.
findstr /C:"app.jwt" src\main\resources\application-prod-h2.properties
echo.
echo Enter new JWT configuration values or press ENTER to keep existing values.
echo.

set /p SECRET=JWT Secret (leave empty to keep current): 
set /p EXPIRATION=JWT Expiration in ms (leave empty to keep current, default 86400000): 

if not "%SECRET%"=="" (
    powershell -Command "(Get-Content src\main\resources\application-prod-h2.properties) -replace 'app.jwt.secret=.*', 'app.jwt.secret=%SECRET%' | Set-Content src\main\resources\application-prod-h2.properties"
    echo JWT Secret updated.
)

if not "%EXPIRATION%"=="" (
    powershell -Command "(Get-Content src\main\resources\application-prod-h2.properties) -replace 'app.jwt.expiration=.*', 'app.jwt.expiration=%EXPIRATION%' | Set-Content src\main\resources\application-prod-h2.properties"
    echo JWT Expiration updated.
)

echo.
echo Updated JWT configuration:
echo.
findstr /C:"app.jwt" src\main\resources\application-prod-h2.properties
pause
goto LOCAL_MENU

:VIEW_CONFIG
echo.
echo Current Configuration
echo ===================
echo.
echo [Database Settings - H2 Profile]
findstr /V /C:"#" src\main\resources\application-prod-h2.properties
echo.
echo [Database Settings - PostgreSQL Profile]
findstr /V /C:"#" src\main\resources\application-prod.properties
echo.
echo [Active Configuration]
findstr /V /C:"#" src\main\resources\application.properties
pause
goto LOCAL_MENU

:EXIT
echo.
echo Exiting Utility App Manager.
exit /b

endlocal