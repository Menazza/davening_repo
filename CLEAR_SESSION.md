# How to Clear Session and Fix Redirect Loop

If you're experiencing a redirect loop after signing up or signing in, follow these steps:

## Solution 1: Clear Browser Cookies (Recommended)

1. **Chrome/Edge:**
   - Press `F12` to open Developer Tools
   - Go to the **Application** tab
   - In the left sidebar, click **Cookies** → `http://localhost:3000`
   - Click **Clear All** or delete individual cookies
   - Refresh the page

2. **Firefox:**
   - Press `F12` to open Developer Tools
   - Go to the **Storage** tab
   - Click **Cookies** → `http://localhost:3000`
   - Right-click and select **Delete All** or delete individual cookies
   - Refresh the page

3. **Or use Incognito/Private Window:**
   - Open a new incognito/private browsing window
   - Go to `http://localhost:3000`
   - Try signing in again

## Solution 2: Clear All Site Data

1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear site data** or **Clear storage**
4. Refresh the page

## Solution 3: Manual Navigation

1. Clear cookies (see Solution 1)
2. Go directly to: `http://localhost:3000/handler/sign-in`
3. Sign in with your credentials
4. After signing in, manually navigate to: `http://localhost:3000/dashboard`

## Solution 4: Check if You're Already Signed In

1. Go to: `http://localhost:3000/test-auth`
2. This page will show if you're already authenticated
3. If you are signed in, try going directly to `/dashboard`

## Why This Happens

The redirect loop usually happens when:
- The browser has cached authentication cookies from a previous session
- Stack Auth thinks you're signed in but there's a session mismatch
- Multiple redirects are conflicting with each other

## After Clearing Cookies

1. Restart the dev server (if needed):
   ```bash
   npm run dev
   ```

2. Try signing in again in a fresh browser session

3. After signing in, you should be automatically redirected to `/dashboard`

## Still Having Issues?

If the problem persists:
1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal running `npm run dev` for errors
3. Verify your `.env` file has all the correct values
4. Make sure the database migration ran successfully

