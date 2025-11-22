# Deployment Guide - Hendler Daven Attendance System

This guide will help you deploy your application to GitHub and a cloud hosting platform.

## Table of Contents
1. [Pushing to GitHub](#pushing-to-github)
2. [Recommended Hosting: Vercel](#recommended-hosting-vercel)
3. [Alternative Hosting Options](#alternative-hosting-options)
4. [Environment Variables Setup](#environment-variables-setup)

## Pushing to GitHub

### Step 1: Prepare Your Project

1. **Make sure `.gitignore` is properly configured** - Your `.gitignore` should exclude:
   - `.env*` files (environment variables)
   - `node_modules/`
   - `.next/` (build files)
   - Other sensitive or generated files

2. **Create a README** - Make sure you have a good README.md (you already have one!)

3. **Commit your current changes**:
   ```bash
   git status  # Check what files will be committed
   git add .
   git commit -m "Initial commit: Hendler Daven Attendance System"
   ```

### Step 2: Create a New GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `hendler-daven-attendance` (or your preferred name)
   - **Description**: "Attendance tracking system for Rabbi Hendler's minyan"
   - **Visibility**: Choose **Private** (recommended for this type of project) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
4. Click **"Create repository"**

### Step 3: Push Your Code

GitHub will show you commands. Use these:

```bash
# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hendler-daven-attendance.git

# Rename branch to main if needed
git branch -M main

# Push your code
git push -u origin main
```

**If you get authentication errors**, you may need to:
- Use a [Personal Access Token](https://github.com/settings/tokens) instead of password
- Or set up [SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## Recommended Hosting: Vercel

**Vercel is the best choice** for Next.js applications because:
- ✅ Made by the creators of Next.js
- ✅ Zero-config deployment
- ✅ Automatic deployments from GitHub
- ✅ Free tier (hobby) is generous
- ✅ Perfect Next.js 14 App Router support
- ✅ Built-in environment variable management
- ✅ Works seamlessly with NeonDB

### Step 1: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your **GitHub account** (recommended for automatic deployments)

### Step 2: Import Your GitHub Repository

1. After signing in, click **"Add New..."** → **"Project"**
2. Find your repository (`hendler-daven-attendance`)
3. Click **"Import"**

### Step 3: Configure Environment Variables

Before deploying, add your environment variables:

1. In the **"Configure Project"** screen, go to **"Environment Variables"**
2. Add these variables (get them from your Neon Console and `.env.local`):

```
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
STACK_SECRET_SERVER_KEY=your_secret_key_here
DATABASE_URL=your_neon_database_connection_string_here
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys)
- `STACK_SECRET_SERVER_KEY` and `DATABASE_URL` are server-only secrets
- Make sure to use your **production database connection string** if different from dev

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies
   - Build your Next.js app
   - Deploy to a production URL
3. Wait 2-3 minutes for the build to complete

### Step 5: Verify Deployment

1. Once deployed, you'll get a URL like: `https://hendler-daven-attendance.vercel.app`
2. Visit the URL and test your application
3. **Important**: Make sure your NeonDB connection string allows connections from Vercel IPs (NeonDB usually does this by default)

### Step 6: Configure Custom Domain (Optional)

1. In your Vercel project settings → **"Domains"**
2. Add your custom domain
3. Follow DNS configuration instructions

## Alternative Hosting Options

### Railway

**Good for**: Full-stack apps, simple deployment

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables
4. Deploy (starts at $5/month after free trial)

### Netlify

**Good for**: Static sites and Next.js (with some limitations)

1. Go to [netlify.com](https://netlify.com)
2. Import from GitHub
3. Add environment variables
4. Deploy (free tier available)

### Render

**Good for**: Simple full-stack deployments

1. Go to [render.com](https://render.com)
2. Connect GitHub
3. Select your repository
4. Add environment variables
5. Deploy (free tier available, with limitations)

**Recommendation**: Stick with **Vercel** for the best Next.js experience!

## Environment Variables Setup

Make sure you have these environment variables set in your hosting platform:

### Required Variables

```env
# Neon Auth / Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key

# Neon Database
DATABASE_URL=postgresql://user:password@host/database
```

### Getting Production Database URL

1. Go to your [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **"Connection Details"**
4. Copy the connection string
5. Use this in your hosting platform's environment variables

**Note**: Some hosting platforms may need the connection string formatted differently. Check your hosting platform's documentation.

## Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] Database connection is working (test with a simple query)
- [ ] Authentication is working (try signing up/logging in)
- [ ] All pages load correctly
- [ ] API routes are working
- [ ] Custom domain is configured (if using one)
- [ ] SSL certificate is active (usually automatic)

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Make sure all environment variables are set
- Check that `package.json` scripts are correct

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check NeonDB project settings (make sure it's active)
- Some hosting platforms may need connection pooling (Vercel handles this automatically)

### Authentication Not Working
- Verify all `NEXT_PUBLIC_STACK_*` and `STACK_SECRET_SERVER_KEY` variables are set
- Check that your Stack Auth project is configured correctly
- Make sure your production URL is added to allowed origins in Stack Auth settings

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch = automatic production deployment
- Every pull request = preview deployment (great for testing!)

## Support

If you encounter issues:
1. Check the hosting platform's logs
2. Review Next.js deployment documentation
3. Check NeonDB connection documentation

