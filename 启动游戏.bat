@echo off
chcp 65001 >nul
title 《地平线狂飙：无尽公路》(Horizon Overdrive) 启动器
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% equ 0 (
    python server.py
) else (
    echo [提示] 未检测到 Python 环境，正在直接通过默认浏览器打开 index.html ...
    start "" "%~dp0index.html"
)
