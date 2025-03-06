@echo off
setlocal enabledelayedexpansion

:: 设置版本号（从 manifest.json 中读取）
for /f "tokens=*" %%a in ('type manifest.json ^| findstr "version"') do (
    set version_line=%%a
    set version=!version_line:*:=!
    set version=!version:"=!
    set version=!version:,=!
    set version=!version: =!
)

:: 创建输出目录
if not exist "dist" mkdir dist

:: 清理旧文件
del /q "dist\*"

:: 复制必要文件到临时目录
if exist "temp" rd /s /q "temp"
mkdir temp
xcopy /s /e /y "icons" "temp\icons\"
xcopy /s /e /y "_locales" "temp\_locales\"
copy /y "manifest.json" "temp\"
copy /y "popup.html" "temp\"
copy /y "popup.css" "temp\"
copy /y "popup.js" "temp\"
copy /y "content.js" "temp\"
copy /y "background.js" "temp\"
copy /y "config.js" "temp\"
copy /y "i18n.js" "temp\"

:: 创建 Chrome 版本
echo Creating Chrome extension...
cd temp
tar -czf "..\dist\quick-ask-ai-chrome-%version%.zip" *
cd ..

:: 创建 Firefox 版本（使用相同的文件）
echo Creating Firefox extension...
cd temp
tar -czf "..\dist\quick-ask-ai-firefox-%version%.zip" *
cd ..

:: 清理临时文件
rd /s /q temp

echo.
echo Build completed!
echo Chrome extension: dist\quick-ask-ai-chrome-%version%.zip
echo Firefox extension: dist\quick-ask-ai-firefox-%version%.zip

endlocal 