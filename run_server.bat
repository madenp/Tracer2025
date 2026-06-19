@echo off
title Python Local Server - Dashboard Alumni 2025
echo ======================================================
echo   Memulai Python HTTP Server untuk Dashboard Alumni
echo ======================================================
echo.

:: Periksa apakah python terinstal
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto start_server
)

:: Periksa apakah py (Python Launcher) terinstal
where py >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto start_server
)

echo [ERROR] Python tidak ditemukan di sistem Anda!
echo Silakan install Python terlebih dahulu dan pastikan opsi "Add Python to PATH" dicentang saat instalasi.
echo Unduh Python di: https://www.python.org/downloads/
echo.
pause
exit /b

:start_server
echo Menggunakan perintah: %PYTHON_CMD%
echo Membuka browser ke http://localhost:8000 ...
start http://localhost:8000
echo.
echo Server berjalan di http://localhost:8000
echo Tekan Ctrl+C di jendela ini untuk menghentikan server.
echo.
%PYTHON_CMD% -m http.server 8000
pause
