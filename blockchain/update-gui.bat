@echo off
echo Updating GUI files to use simplified versions...

echo Backing up original files...
copy /Y "d:\Project\Donation-System\blockchain\gui\index.html" "d:\Project\Donation-System\blockchain\gui\index.html.bak"
copy /Y "d:\Project\Donation-System\blockchain\gui\app.js" "d:\Project\Donation-System\blockchain\gui\app.js.bak"

echo Copying simplified versions...
copy /Y "d:\Project\Donation-System\blockchain\gui\index-simplified.html" "d:\Project\Donation-System\blockchain\gui\index.html"
copy /Y "d:\Project\Donation-System\blockchain\gui\app-simplified.js" "d:\Project\Donation-System\blockchain\gui\app.js"

echo.
echo GUI files updated successfully!
echo.
echo Please follow these steps:
echo 1. Make sure Ganache is running: ganache --port 7545 --deterministic
echo 2. Start the web server: node server.js
echo 3. Open http://localhost:3000 in your browser
echo 4. Click "Connect to Ganache" 
echo 5. Click "Set Contract Address" and enter your contract address
echo.
echo Your contract address: 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab
echo.
pause