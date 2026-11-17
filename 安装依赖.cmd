@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm.cmd ci
if errorlevel 1 goto fail
call npm.cmd ci --prefix cms
if errorlevel 1 goto fail
echo 安装完成，请双击“启动工作台.cmd”。
pause
exit /b 0
:fail
echo 安装未完成，请检查上方错误及网络后重试。
pause
exit /b 1
