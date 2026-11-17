@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 工作台：http://127.0.0.1:18781
echo 请保持此窗口运行。停止请按 Ctrl+C。
call npm.cmd start
pause
