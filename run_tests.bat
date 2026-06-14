@echo off
title Rehman Agro Traders - Test Suite
echo ============================================================
echo      Running Rehman Agro Traders Stock Logic Tests
echo ============================================================
echo.
cd backend
node tests/stockLogic.test.js
echo.
echo ============================================================
echo   Tests completed.
echo ============================================================
echo.
pause
