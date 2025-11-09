#!/bin/bash

# EchoChat Backend Startup Script

echo "🚀 Starting EchoChat Python Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -q -r requirements.txt

# Start FastAPI server
echo "✅ Starting FastAPI server on port 8000..."
python app.py
