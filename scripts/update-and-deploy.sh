#!/bin/bash

# Market Sentiment Tracker - Update and Deploy Script
# This script fetches fresh data and prepares it for deployment

set -e  # Exit on any error

echo "🚀 Starting Market Sentiment Tracker update process..."

# Change to scripts directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing script dependencies..."
    npm install
fi

# Fetch fresh market data
echo "📊 Fetching fresh market data..."
npm run fetch

# Go back to project root
cd ..

# Copy data to deployment directory
echo "📋 Copying data to deployment directory..."
cp public/data/market-data.json out/data/market-data.json

# Check if we have real data (not just error messages)
if grep -q '"price":' public/data/market-data.json; then
    echo "✅ Successfully fetched real market data!"
    echo "   SPY: \$$(python3 -c "import json; data=json.load(open('public/data/market-data.json')); print(f'{data[\"stocks\"][\"SPY\"][\"price\"]:.2f}' if 'SPY' in data.get('stocks', {}) and 'price' in data['stocks']['SPY'] else 'N/A')")"
    echo "   QQQ: \$$(python3 -c "import json; data=json.load(open('public/data/market-data.json')); print(f'{data[\"stocks\"][\"QQQ\"][\"price\"]:.2f}' if 'QQQ' in data.get('stocks', {}) and 'price' in data['stocks']['QQQ'] else 'N/A')")"
    echo "   VIX: $(python3 -c "import json; data=json.load(open('public/data/market-data.json')); print(f'{data[\"vix\"][\"value\"]:.2f}' if 'vix' in data and 'value' in data['vix'] else 'N/A')")"
else
    echo "⚠️  Warning: No real price data found - check API connections"
fi

echo "🎉 Update process completed!"
echo ""
echo "📝 Next steps:"
echo "1. The data has been updated in both public/ and out/ directories"
echo "2. For GitHub Pages: Commit and push the changes"
echo "3. For local testing: Serve the 'out' directory"
echo ""
echo "💡 To update data regularly, run this script every 5-15 minutes"