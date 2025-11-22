# Quick Setup - Fill In Your .env File

## Step-by-Step Instructions

### 1. Open Your .env File
Make sure it has these lines:

```env
# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=

# Database owner connection string
DATABASE_URL=
```

### 2. Fill In Each Value

#### A. NEXT_PUBLIC_STACK_PROJECT_ID
1. Go to: https://neon.tech/console
2. Click on your project
3. Navigate to **Auth** section (or **Settings** → **Auth**)
4. Find **Project ID** (usually looks like: `proj_xxxxxxxxxxxx`)
5. Copy it and paste after the `=` sign

#### B. NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
1. In the same **Auth** section
2. Find **Publishable Client Key** (starts with something like `pk_live_` or `pk_test_`)
3. Copy it and paste after the `=` sign

#### C. STACK_SECRET_SERVER_KEY
1. In the same **Auth** section
2. Find **Secret Server Key** (starts with something like `sk_live_` or `sk_test_`)
3. ⚠️ **IMPORTANT**: Keep this secret! Never commit it to Git
4. Copy it and paste after the `=` sign

#### D. DATABASE_URL
1. In your Neon project, go to **Settings** → **Connection Details**
2. Look for **Connection String** section
3. Make sure you select **Owner** role (not read-only)
4. Click **Copy** to get the full connection string
5. It should look like: `postgresql://username:password@host.neon.tech/dbname?sslmode=require`
6. Paste it after the `=` sign (keep the quotes if they're there, or add them if needed)

### 3. Example of Completed .env File

```env
# Neon Auth environment variables for Next.js
NEXT_PUBLIC_STACK_PROJECT_ID=proj_abc123xyz
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pk_live_abc123xyz
STACK_SECRET_SERVER_KEY=sk_live_abc123xyz

# Database owner connection string
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Save the File
Save your `.env` file after filling in all values.

### 5. Next Steps
After filling in your `.env` file:

1. **Run the Neon Auth setup wizard** (if you haven't already):
   ```bash
   npx @stackframe/init-stack@latest --no-browser
   ```

2. **Run database migration**:
   ```bash
   npm run db:migrate
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Test it**: Go to http://localhost:3000/handler/sign-up

## Troubleshooting

### Can't find the Auth section?
- Make sure Neon Auth is enabled in your project
- Check if you need to enable it in Settings first
- Some projects may have it under different names (Auth, Authentication, etc.)

### Can't find the Database connection string?
- Go to: Settings → Connection Details
- Make sure you're selecting the **Owner** role connection string
- It should start with `postgresql://`

### Environment variables not working?
- Make sure you saved the `.env` file
- Restart your development server after changing `.env`
- Check that there are no extra spaces around the `=` sign
- Verify the values are correct by comparing with Neon Console

