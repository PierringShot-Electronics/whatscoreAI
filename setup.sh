#!/bin/bash

# Setup script for WhatsCore.AI
set -euo pipefail

echo "🛠️  Setting up project dependencies and directories..."

# Install Node dependencies
if [ -f package.json ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Create required directories if they don't exist
mkdir -p .wwebjs_auth sessions logs media

echo "✅ Setup complete. You can now run 'npm run start' or './start.sh' to launch the app."