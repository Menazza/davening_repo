# Vercel Deployment Troubleshooting

## Common Issues and Solutions

### `_getSession` Error in Logs

If you see errors like:
```
at sP._getSession (/vercel/path0/.next/server/chunks/795.js:73:7587)
```

**This is usually a non-critical warning** from Stack Auth's internal session handling. The app should still work, but here's how to fix it:

#### Solution 1: Verify Environment Variables

Make sure ALL environment variables are set in Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Verify these are set:
   - `NEXT_PUBLIC_STACK_PROJECT_ID`
   - `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
   - `STACK_SECRET_SERVER_KEY`
   - `DATABASE_URL`

3. **Important**: Make sure there are NO extra spaces or quotes around the values

#### Solution 2: Add Production URL to Stack Auth

1. Go to your [Neon Console](https://console.neon.tech)
2. Navigate to your project → **Auth** section
3. Add your Vercel production URL to allowed origins:
   - `https://your-app.vercel.app`
   - `https://your-custom-domain.com` (if using one)

#### Solution 3: Check Cookie Settings

Stack Auth uses cookies for sessions. Make sure:
- Your Vercel domain is properly configured
- Cookies are allowed (should be automatic)
- No ad blockers are interfering (for testing)

#### Solution 4: Clear and Redeploy

1. In Vercel dashboard → **Deployments**
2. Click the three dots on your latest deployment
3. Select **Redeploy**
4. This will rebuild with fresh environment variables

### Authentication Not Working

If users can't sign in:

1. **Check Environment Variables**: All Stack Auth variables must be set
2. **Check Database Connection**: Verify `DATABASE_URL` is correct
3. **Check Browser Console**: Look for JavaScript errors
4. **Check Vercel Logs**: Go to **Deployments** → Click your deployment → **Functions** tab

### Database Connection Issues

If you see database errors:

1. **Verify Connection String**: Use the **Owner** connection string from Neon
2. **Check Neon Project Status**: Make sure your Neon project is active
3. **Test Connection**: Try connecting from Neon Console SQL Editor

### Build Succeeds but App Doesn't Work

1. **Check Runtime Logs**: Vercel → Your deployment → **Functions** tab
2. **Check Environment Variables**: Make sure they're set for **Production** environment
3. **Check Domain Configuration**: Verify your domain is correctly set up

### Session/Cookie Issues

If sessions aren't persisting:

1. **Check Cookie Domain**: Should match your Vercel domain
2. **Check HTTPS**: Vercel uses HTTPS by default (required for secure cookies)
3. **Clear Browser Cookies**: Try in incognito mode

## Quick Checklist

- [ ] All environment variables set in Vercel
- [ ] Production URL added to Stack Auth allowed origins
- [ ] Database connection string is correct
- [ ] Build completes successfully
- [ ] No critical errors in Vercel logs
- [ ] Can sign up/sign in successfully
- [ ] Sessions persist after page refresh

## Getting Help

If issues persist:

1. **Check Vercel Logs**: Most detailed error information
2. **Check Browser Console**: Client-side errors
3. **Check Network Tab**: Failed API requests
4. **Review Environment Variables**: Double-check all values

## Common Non-Critical Warnings

These warnings are normal and won't break your app:
- `_getSession` warnings (Stack Auth internal)
- Edge Runtime warnings (Next.js optimization)
- Peer dependency warnings (npm compatibility)

If your app works despite these warnings, you can ignore them.

