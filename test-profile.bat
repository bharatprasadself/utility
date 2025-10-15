@echo off
setlocal

echo Running TestProfileTest...
echo.

call mvn test -Dtest=com.utilityzone.utility.config.TestProfileTest

echo.
echo Test completed with exit code: %ERRORLEVEL%

endlocal
pause