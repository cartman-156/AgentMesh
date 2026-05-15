#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================================"
echo " 🚀 1. Building and starting RCA Agent container..."
echo "============================================================"
cd "$ROOT_DIR"
docker compose up -d --build --force-recreate rca-agent

echo -e "\n⏳ Waiting 5 seconds for the server to fully start..."
sleep 5

echo -e "\n============================================================"
echo " 📋 2. Copying test script into the container..."
echo "============================================================"
docker cp "$SCRIPT_DIR/test_rca_scenarios.py" agentmesh-rca-agent-1:/app/test_rca_scenarios.py
echo "Script copied successfully."

echo -e "\n============================================================"
echo " 🧪 3. Executing Test Scenarios..."
echo "============================================================"
docker exec agentmesh-rca-agent-1 python /app/test_rca_scenarios.py
