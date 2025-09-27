#!/bin/bash

clear
echo "===== Donation System Blockchain Setup ====="
echo

function display_menu {
  echo "Choose an option:"
  echo "1. Install dependencies"
  echo "2. Start Ganache and deploy contract"
  echo "3. Start web interface"
  echo "4. Quit"
  echo
  read -p "Enter your choice (1-4): " choice
  
  case $choice in
    1) install_dependencies ;;
    2) start_ganache ;;
    3) start_web ;;
    4) exit_script ;;
    *) echo "Invalid option. Please try again."; echo; display_menu ;;
  esac
}

function install_dependencies {
  echo
  echo "Installing dependencies..."
  echo
  npm install
  echo
  echo "Dependencies installed successfully."
  echo
  display_menu
}

function start_ganache {
  echo
  echo "Starting Ganache..."
  ganache --port 7545 --deterministic &
  GANACHE_PID=$!
  echo
  echo "Waiting for Ganache to start..."
  sleep 3
  echo
  echo "Deploying contract to Ganache..."
  npx hardhat run scripts/deploy-to-ganache.js --network ganache
  echo
  echo "Contract deployed and ready to use."
  echo
  echo "Note: Ganache is running in the background. When you're finished,"
  echo "      you'll need to manually stop it with: kill $GANACHE_PID"
  echo
  display_menu
}

function start_web {
  echo
  echo "Starting web interface..."
  echo
  echo "The web interface is now running at http://localhost:3000"
  echo
  echo "Press Ctrl+C when you want to stop the web interface."
  echo
  node server.js
  echo
  display_menu
}

function exit_script {
  echo
  echo "Thank you for using the Donation System Blockchain."
  echo
  exit 0
}

# Start with the menu
display_menu