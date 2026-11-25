@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale em https://nodejs.org e rode este arquivo de novo.
  pause
  exit /b 1
)
if not exist node_modules\express (
  echo Instalando o servidor...
  call npm install --omit=dev
)
echo.
echo Sistema De Matriculas
echo O navegador abre sozinho. Deixe esta janela aberta.
echo Para encerrar, feche a janela ou pressione Ctrl+C.
echo Se o Windows perguntar, permita o Node em redes privadas.
echo.
node server.js
pause
