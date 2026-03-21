@echo off
REM setup.bat — Install, test, and build the Car Catalogue project (Windows)
setlocal

echo ========================================
echo   Car Catalogue — Project Setup
echo ========================================

REM 1. Check Node is available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

REM 2. Install dependencies (prefer pnpm, fall back to npm)
echo.
echo ^>^> Installing dependencies...
where pnpm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    pnpm install
) else (
    npm install
)
if %ERRORLEVEL% neq 0 ( echo ERROR: Dependency installation failed. & exit /b 1 )

REM 3. Run tests
echo.
echo ^>^> Running tests...
where pnpm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    pnpm test
) else (
    npm test
)
if %ERRORLEVEL% neq 0 ( echo ERROR: Tests failed. & exit /b 1 )

REM 4. Build
echo.
echo ^>^> Building for production...
where pnpm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    pnpm run build
) else (
    npm run build
)
if %ERRORLEVEL% neq 0 ( echo ERROR: Build failed. & exit /b 1 )

echo.
echo ========================================
echo   Setup complete!
echo   To start the dev server: npm run dev
echo   To start production:     npm run start
echo ========================================
endlocal
