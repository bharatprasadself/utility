@echo off
setlocal

echo Running DatabaseConfigTest...
echo.

call mvn test -Dtest=com.utilityzone.utility.config.DatabaseConfigTest

echo.
echo Test completed with exit code: %ERRORLEVEL%

endlocal
pause