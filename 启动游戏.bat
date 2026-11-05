@echo off
chcp 65001 >nul
title 《地平线狂飙：无尽公路》(Horizon Overdrive) 启动器
cd /d "%~dp0"

REM 优先尝试 Python Launcher (py -3)
py -3 --version >nul 2>nul
if %errorlevel% equ 0 (
    py -3 server.py
    goto end
)

REM 尝试系统 python
python --version >nul 2>nul
if %errorlevel% equ 0 (
    python server.py
    goto end
)

REM 降级为直接打开静态页面
echo [提示] 未检测到可用 Python 环境，正在直接通过默认浏览器打开 index.html ...
start "" "%~dp0index.html"

:end
