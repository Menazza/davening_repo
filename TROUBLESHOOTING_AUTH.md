# Troubleshooting Authentication Issues

## Problem: Sign-in just loads and does nothing

If you're experiencing this issue, try these solutions:

### Solution 1: Check Browser Console for Errors

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try signing in again
4. Look for any JavaScript errors (they'll be in red)
5. Share these errors to diagnose the issue

### Solution 2: Clear Browser Cache and Cookies

1. Clear your browser cache and cookies
2. Close and reopen your browser
3. Try signing in again

### Solution 3: Check Environment Variables

Make sure your `.env` file has all the correct values:

```env
NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
STACK_SECRET_SERVER_KEY=your_secret_key
DATABASE_URL=your_database_url
```

**Important**: 
- Make sure there are **no quotes** around the values
- Make sure there are **no spaces** around the `=` sign
- Restart the dev server after changing `.env`

### Solution 4: Check Database Connection

Make sure your `DATABASE_URL` is correct:

1. Go to Neon Console
2. Settings → Connection Details
3. Copy the **Owner** connection string (not read-only)
4. Paste it in your `.env` file

### Solution 5: Check if User Profile is Created

After signing up, check your database:

1. Go to Neon Console → SQL Editor
2. Run this query:
   ```sql
   SELECT * FROM user_profiles;
   ```
3. If the table doesn't exist, run:
   ```bash
   npm run db:migrate
   ```

### Solution 6: Manual Redirect After Sign-in

If the automatic redirect isn't working:

1. After signing in successfully, manually navigate to:
   ```
   http://localhost:3000/dashboard
   ```
2. If that works, the authentication is working but the redirect isn't

### Solution 7: Check Stack Auth Configuration

Make sure the Stack Auth setup completed successfully:

1. Check that `app/handler/[...stack]/page.tsx` exists
2. Check that `stack/client.tsx` exists
3. Check that `lib/stack.ts` exists

### Solution 8: Restart Dev Server

1. Stop the dev server (Ctrl+C)
2. Delete `.next` folder (if it exists)
3. Restart:
   ```bash
   npm run dev
   ```

### Solution 9: Check Network Tab

1. Open Developer Tools → Network tab
2. Try signing in
3. Look for failed requests (they'll be in red)
4. Check the Response tab for any error messages

## Common Error Messages

### "Not authenticated" errors
- Check that environment variables are set correctly
- Verify Stack Auth keys are correct
- Restart the dev server

### "User not found" errors
- Run database migration: `npm run db:migrate`
- Check that user exists in `auth.users` table (created by Neon Auth)
- Check that profile was created in `user_profiles` table

### Database connection errors
- Verify `DATABASE_URL` is correct
- Make sure you're using the **Owner** connection string
- Check that your Neon project is active

## Still Having Issues?

1. Check the browser console for errors
2. Check the terminal/command prompt where `npm run dev` is running for errors
3. Verify all environment variables are set correctly
4. Make sure database migration ran successfully

