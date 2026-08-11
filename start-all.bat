@echo off
echo Starting KEYSTONE FSM Application Suite...

:: Start Spring Boot Backend in a separate window
echo Launching Spring Boot API Backend...
start "Keystone Backend API" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"

:: Start React Frontend
echo Launching React Frontend Dev Server...
start "Keystone React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo KEYSTONE is running!
echo.
echo Frontend URL: http://localhost:5173
echo Backend API URL: http://localhost:8080
echo Swagger UI URL: http://localhost:8080/swagger-ui/index.html
echo ========================================================
echo.
pause
