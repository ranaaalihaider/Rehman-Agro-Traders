@echo off
title Rehman Agro Traders - Startup
echo ============================================================
echo      Starting Rehman Agro Traders Stock Management System
echo ============================================================
echo.
echo Launching Backend Server (Express + MongoDB)...
start cmd /k "title Rehman Agro Backend && cd backend && npm run start"

echo Launching Frontend Client (React + Vite)...
start cmd /k "title Rehman Agro Frontend && cd frontend && npm run dev"

echo.
echo ============================================================
echo   Startup initiated successfully!
echo   - Backend API running on: http://localhost:5000
echo   - Frontend Client running on: http://localhost:5173
echo ============================================================
echo.
pause
