#!/bin/bash

# Clean script for WhatsCore.AI
set -euo pipefail

echo "🧹 Cleaning up PM2 processes and temporary directories..."

# Stop and remove PM2 process if running
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop whatscore-ai >/dev/null 2>&1 || true
    pm2 delete whatscore-ai >/dev/null 2>&1 || true
fi

# Remove session and other stateful directories
rm -rf .wwebjs_auth sessions logs media

echo "✅ Cleanup complete."