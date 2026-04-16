#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  FreelanceOS — One-Command Startup
#  Usage: ./start.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}   ⚡ FreelanceOS — Starting Up${RESET}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Check dependencies ────────────────────────────────────────────────────
echo -e "${CYAN}Checking dependencies…${RESET}"

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}❌ Python 3 not found. Install from https://python.org${RESET}"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${RESET}"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo -e "${RED}❌ npm not found. Install Node.js from https://nodejs.org${RESET}"
  exit 1
fi

PY_VER=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
NODE_VER=$(node --version | cut -c2-)
echo -e "  ${GREEN}✓${RESET} Python $PY_VER"
echo -e "  ${GREEN}✓${RESET} Node.js $NODE_VER"
echo ""

# ── Backend setup ─────────────────────────────────────────────────────────
echo -e "${CYAN}Setting up backend…${RESET}"
cd "$ROOT/backend"

if [ ! -d "venv" ]; then
  echo "  Creating virtual environment…"
  python3 -m venv venv
fi

# Activate venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "  Installing Python packages…"
pip install -r requirements.txt -q

echo -e "  ${GREEN}✓${RESET} Backend ready"
echo ""

# ── Frontend setup ────────────────────────────────────────────────────────
echo -e "${CYAN}Setting up frontend…${RESET}"
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages (first run — takes ~1 min)…"
  npm install --silent
else
  echo "  Dependencies already installed"
fi

echo -e "  ${GREEN}✓${RESET} Frontend ready"
echo ""

# ── Start both servers ────────────────────────────────────────────────────
echo -e "${CYAN}Starting servers…${RESET}"
echo ""

# Start backend in background
cd "$ROOT/backend"
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python main.py &
BACKEND_PID=$!
echo -e "  ${GREEN}✓${RESET} Backend started (PID $BACKEND_PID)"

# Wait for backend to be ready
sleep 2

# Start frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓${RESET} Frontend started (PID $FRONTEND_PID)"

echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}   🚀 FreelanceOS is running!${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}App:${RESET}      ${BLUE}http://localhost:5173${RESET}"
echo -e "  ${BOLD}API:${RESET}      ${BLUE}http://localhost:8000${RESET}"
echo -e "  ${BOLD}API Docs:${RESET} ${BLUE}http://localhost:8000/docs${RESET}"
echo ""
echo -e "  ${BOLD}Demo Login:${RESET}"
echo -e "  Email:    demo@freelanceos.com"
echo -e "  Password: demo123"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop both servers${RESET}"
echo ""

# Wait and handle cleanup
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down…${RESET}"
  kill $BACKEND_PID  2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}Goodbye!${RESET}"
  exit 0
}
trap cleanup SIGINT SIGTERM

wait
