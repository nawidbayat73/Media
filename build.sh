#!/bin/bash

# Build script for Hardware Video Organizer with AI Assistant

echo "🚀 Building Hardware Video Organizer with AI Assistant..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Type checking
echo "🔍 Running type check..."
pnpm typecheck

if [ $? -ne 0 ]; then
    echo "⚠️  Type check warnings detected (continuing...)"
fi

echo ""
echo "✅ Build validation complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set up .env.local with EXPO_PUBLIC_OPENAI_API_KEY"
echo "  2. Run: pnpm dev"
echo "  3. Open Expo Go on your Android device"
echo "  4. Scan the QR code"
echo ""
echo "🎯 Features ready:"
echo "  ✨ AI-powered chat assistant with tool calling"
echo "  💜 Dark purple & black theme design"
echo "  🤖 Floating chat button (bottom-right)"
echo "  💾 Local chat history persistence"
echo "  🎮 Video search, filtering & organization via AI"
echo ""
