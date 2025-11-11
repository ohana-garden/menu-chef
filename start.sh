#!/bin/bash

# Menu Chef Startup Script

echo "🍳 Menu Chef - Starting up..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env and add your ANTHROPIC_API_KEY"
    echo "Then run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🐳 Starting Docker containers..."
docker-compose up --build

echo ""
echo "✅ Menu Chef is running!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Agent Zero: http://localhost:50001"
echo ""
echo "Press Ctrl+C to stop"
