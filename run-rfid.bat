@echo off
title MediKiosk Physical RFID Hardware Listener
echo ============================================================
echo   MediKiosk - Physical RFID Hardware Reader
echo ============================================================
echo.
npx pnpm --filter backend rfid:bridge
pause
