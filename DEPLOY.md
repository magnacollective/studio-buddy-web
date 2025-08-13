# 🚀 Deployment Guide - Studio Buddy Web

This guide will walk you through deploying Studio Buddy Web to Vercel via GitHub.

## Prerequisites

- Git installed on your machine
- GitHub account (free at github.com)
- Vercel account (free at vercel.com)

## Step 1: Initialize Git Repository

Navigate to the web directory and run the deployment script:

```bash
cd /Users/cruzflores/Desktop/StudioBuddy/web
./deploy.sh
```

This script will:
- Initialize a git repository
- Add all files
- Create an initial commit

## Step 2: Create GitHub Repository

1. Go to [GitHub New Repository](https://github.com/new)
2. Fill in the details:
   - **Repository name**: `studio-buddy-web`
   - **Description**: "Professional audio mastering web app with Windows 95 UI"
   - **Visibility**: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license

3. Click "Create repository"

## Step 3: Push to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/studio-buddy-web.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel New Project](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `studio-buddy-web` repository
4. Vercel will automatically detect it's a static site
5. Click "Deploy"
6. Wait for deployment (usually takes 1-2 minutes)
7. Your app is now live! 🎉

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Run deployment:
```bash
vercel
```

3. Follow the prompts:
   - Login/signup to Vercel
   - Select "Link to existing project" or create new
   - Confirm settings
   - Deploy!

## Step 5: Access Your App

Once deployed, Vercel will provide you with URLs:
- **Production**: `https://studio-buddy-web.vercel.app`
- **Preview**: For each git branch/PR

## Custom Domain (Optional)

To add a custom domain:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables (If Needed)

If you need to add API keys or environment variables:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add your variables
4. Redeploy for changes to take effect

## Continuous Deployment

With GitHub + Vercel connected:
- Every push to `main` branch → Production deployment
- Every pull request → Preview deployment
- Automatic rollbacks on failed deployments

## Updates and Maintenance

To update your deployed app:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push

# Vercel will automatically deploy the changes
```

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all files are committed
- Verify `vercel.json` configuration

### CORS Issues
- The `vercel.json` includes CORS headers
- For API calls, ensure proper headers are set

### Audio Not Working
- HTTPS is required for Web Audio API
- Vercel provides HTTPS by default
- Check browser console for errors

### Performance Issues
- Enable Vercel Edge Network
- Use Vercel Analytics to identify bottlenecks
- Consider using Vercel's Image Optimization

## Monitoring

1. **Vercel Analytics** (Free tier available):
   - Real User Metrics
   - Web Vitals
   - Geographic distribution

2. **Vercel Speed Insights**:
   - Performance monitoring
   - Core Web Vitals tracking

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Documentation**: https://docs.github.com
- **Web Audio API Reference**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## Quick Commands Reference

```bash
# Check git status
git status

# View deployment URL
vercel ls

# View logs
vercel logs

# Rollback deployment
vercel rollback

# Set custom domain
vercel domains add yourdomain.com
```

---

## 🎉 Congratulations!

Your Studio Buddy Web app is now live and accessible worldwide! Share your professional audio mastering tool with the world.

### Live URL Pattern:
- Production: `https://studio-buddy-web.vercel.app`
- Preview: `https://studio-buddy-web-git-branch-name.vercel.app`

Enjoy your deployed app! 🎵✨