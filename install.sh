#!/bin/bash

# Alprojeck Bot Installation Script
# Version: 2.0.0

echo "╔══════════════════════════════════════════╗"
echo "║   Morela WhatsApp Bot - Installer    ║"
echo "║            Version 2.0.0                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}[1/5]${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo -e "${YELLOW}Please install Node.js >= 18.0.0${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version too old: v$(node -v)${NC}"
    echo -e "${YELLOW}Required: >= 18.0.0${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check npm
echo -e "${BLUE}[2/5]${NC} Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"

# Clean install
echo -e "${BLUE}[3/5]${NC} Cleaning previous installation..."
rm -rf node_modules package-lock.json
echo -e "${GREEN}✅ Cleaned${NC}"

# Install dependencies
echo -e "${BLUE}[4/5]${NC} Installing dependencies..."
echo -e "${YELLOW}This may take a few minutes...${NC}"

npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Installation failed${NC}"
    echo -e "${YELLOW}Try running manually:${NC}"
    echo "npm install --legacy-peer-deps --build-from-source"
    exit 1
fi

# Create required folders
echo -e "${BLUE}[5/5]${NC} Setting up folders..."
mkdir -p session
mkdir -p media/temp media/brat media/bratvid media/cewekbrat media/ttp
echo -e "${GREEN}✅ Folders created${NC}"

# Success message
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Installation Complete! 🎉           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Edit config.js (set your owner number)"
echo "2. Run: ${GREEN}npm start${NC}"
echo "3. Enter your phone number"
echo "4. Enter pairing code in WhatsApp"
echo ""
echo -e "${YELLOW}Need help? Check:${NC}"
echo "  - README.md"
echo "  - TROUBLESHOOTING.md"
echo ""
echo -e "${BLUE}Happy botting! 🤖${NC}"
