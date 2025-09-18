@echo off
echo Starting Banking Simulation Server...
echo.
echo Make sure you have Python installed and run this from the project directory.
echo.
echo Installing required packages...
pip install flask flask-cors
echo.
echo Starting Flask server...
echo The application will be available at: http://localhost:5050
echo.
echo Press Ctrl+C to stop the server.
echo.
python app.py
pause
