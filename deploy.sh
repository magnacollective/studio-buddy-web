#!/bin/bash

# Studio Buddy Web - GitHub Deployment Script
# This script initializes a git repository and prepares for GitHub deployment

echo "🎵 Studio Buddy Web - GitHub Deployment Setup"
echo "============================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📂 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Studio Buddy Web - Professional Audio Mastering App

Features:
- Matchering-style reference-based mastering
- Intelligent mastering without reference tracks
- BPM and key detection
- Windows 95 themed UI
- Real-time audio visualization
- Web Audio API powered processing"

echo ""
echo "✅ Git repository is ready for GitHub!"
echo ""
echo "📋 Next steps to deploy on Vercel:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   Go to: https://github.com/new"
echo "   Name it: studio-buddy-web (or your preferred name)"
echo "   Keep it public or private as you prefer"
echo "   Don't initialize with README (we already have one)"
echo ""
echo "2. Connect your local repository to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/studio-buddy-web.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   Option A - Via Vercel Dashboard:"
echo "   - Go to https://vercel.com/new"
echo "   - Import your GitHub repository"
echo "   - Vercel will auto-detect the static site"
echo "   - Click 'Deploy'"
echo ""
echo "   Option B - Via Vercel CLI:"
echo "   - Install: npm i -g vercel"
echo "   - Run: vercel"
echo "   - Follow the prompts"
echo ""
echo "4. Your app will be live at:"
echo "   https://studio-buddy-web.vercel.app (or your custom domain)"
echo ""
echo "🎉 Ready to rock! Your audio mastering app is prepared for deployment!"