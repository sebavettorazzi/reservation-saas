@echo off
REM ===========================
REM SCRIPT TODO EN UNO - PRISMA + TS-NODE
REM Para Windows
REM ===========================

echo ===== Limpiando node_modules y lockfile =====
rd /s /q node_modules
del /q package-lock.json

echo ===== Instalando dependencias =====
npm install

echo ===== Generando cliente Prisma =====
npx prisma generate

echo ===== Ejecutando test de availability =====
npx ts-node -r dotenv/config src/test/test-availability.ts

pause