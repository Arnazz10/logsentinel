#!/bin/bash

# =============================================================================
# LogSentinel — Demo Startup Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${BLUE}🚀 Preparing LogSentinel Demo...${RESET}"

# 1. Clean up old processes
echo -e "${YELLOW}🧹 Cleaning up old processes...${RESET}"
pkill -f "vite" || true
pkill -f "jenkins.war" || true

# 2. Start Jenkins
echo -e "${BLUE}🏗️ Starting Jenkins (Port 8085)...${RESET}"
export JENKINS_HOME="$(pwd)/infra/jenkins/home"
nohup java -jar /usr/share/java/jenkins.war --httpPort=8085 -Djenkins.install.runSetupWizard=false > jenkins.log 2>&1 &
echo -e "${GREEN}✔ Jenkins starting in background.${RESET}"

# 3. Start Frontend
echo -e "${BLUE}💻 Starting Frontend Dashboard (Port 5173)...${RESET}"
cd services/dashboard-frontend
nohup npm run dev > frontend.log 2>&1 &
cd ../..
echo -e "${GREEN}✔ Frontend starting in background.${RESET}"

# 4. Summary
echo -e "\n${GREEN}============================================================${RESET}"
echo -e "${GREEN}🌟 DEMO READY! 🌟${RESET}"
echo -e "${GREEN}============================================================${RESET}"
echo -e "Dashboard: ${BLUE}http://localhost:5173${RESET}"
echo -e "Jenkins:   ${BLUE}http://localhost:8085${RESET} (logsentinel / logsentinel)"
echo -e "ML Models: ${BLUE}Ready in ml/models/${RESET}"
echo -e "${GREEN}============================================================${RESET}"
echo -e "Tailing logs... (Ctrl+C to stop tailing, demo will keep running)"
tail -f jenkins.log
