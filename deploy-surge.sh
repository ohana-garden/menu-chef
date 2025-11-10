#!/bin/bash

# Quick deployment script for Surge.sh
# This deploys Menu Chef to a free surge.sh subdomain

echo "🚀 Menu Chef - Quick Deploy to Surge.sh"
echo "========================================"
echo ""

# Check if surge is installed
if ! command -v surge &> /dev/null
then
    echo "📦 Surge not found. Installing..."
    npm install -g surge
fi

echo ""
echo "📤 Deploying Menu Chef..."
echo ""

# Deploy to surge (will prompt for login on first use)
surge . menu-chef-app.surge.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is live at: https://menu-chef-app.surge.sh"
echo ""
echo "💡 Tip: You can customize the domain by running:"
echo "   surge . your-custom-name.surge.sh"
echo ""
