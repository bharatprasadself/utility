@echo off
cd /d "%~dp0"
echo Running DatabaseConfigTest...
mvn test -Dtest=DatabaseConfigTest
echo.
echo Test finished with exit code: %ERRORLEVEL%
pause