# Neon Auth Setup Guide

This guide will help you set up Neon Auth for the Hendler Daven Attendance System.

## Prerequisites

1. A NeonDB project (create one at [neon.tech](https://neon.tech))
2. Node.js and npm installed

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Run Neon Auth Setup Wizard

Run the Neon Auth setup wizard to automatically configure authentication routes:

```bash
npx @stackframe/init-stack@latest --no-browser
```

This command will:
- Create authentication routes at `/handler/*`
- Set up layout wrappers
- Configure authentication handlers
- Create necessary files for Stack Auth integration

## Step 3: Get Your Neon Auth Keys

1. Go to your [Neon Console](https://neon.tech/console)
2. Navigate to the Auth section
3. Copy your Neon Auth credentials:
   - Project ID
   - Publishable Client Key
   - Secret Server Key

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory with your Neon Auth credentials:

```env
# Neon Auth environment variables
NEXT_PUBLIC_STACK_PROJECT_ID=YOUR_NEON_AUTH_PROJECT_ID
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=YOUR_NEON_AUTH_PUBLISHABLE_KEY
STACK_SECRET_SERVER_KEY=YOUR_NEON_AUTH_SECRET_KEY

# Your Neon Database connection string
DATABASE_URL=your_neon_database_url_here
```

## Step 5: Run Database Migration

After Neon Auth is set up, run the database migration:

```bash
npm run db:migrate
```

This will create all necessary tables including the `user_profiles` table that extends Neon Auth users.

## Step 6: Link User Profiles to Auth Users (Optional)

After Neon Auth creates the `auth.users` table, you can optionally add a foreign key constraint:

```sql
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Step 7: Test Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit [http://localhost:3000/handler/sign-up](http://localhost:3000/handler/sign-up)

3. Create a test user account

4. Check your Neon database - you should see:
   - The user in `auth.users` table (created by Neon Auth)
   - A corresponding profile in `user_profiles` table (created automatically when user signs in)

## Step 8: Create Admin User

To make a user an admin, update the database:

```sql
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE email = 'admin@example.com';
```

Or use the Neon Console to set `is_admin = TRUE` for the desired user.

## Authentication Routes

Neon Auth automatically creates these routes:
- `/handler/sign-in` - Sign in page
- `/handler/sign-up` - Sign up page
- `/handler/sign-out` - Sign out handler
- `/handler/callback` - OAuth callback handler

## User Profile Creation

User profiles are automatically created in the `user_profiles` table when a user first signs in. The system:

1. Checks if a profile exists for the authenticated user
2. If not, creates a new profile linked to the Neon Auth user ID
3. Syncs email and display name from Neon Auth

## Troubleshooting

### "User not found" errors
- Make sure Neon Auth setup completed successfully
- Check that environment variables are set correctly
- Verify the database migration ran successfully

### Foreign key constraint errors
- If you get errors about `auth.users` not existing, make sure Neon Auth setup completed
- The foreign key is optional - the system works without it

### Authentication not working
- Verify all environment variables are set in `.env.local`
- Check that the Stack Auth package is installed: `npm list @stackframe/js`
- Ensure the setup wizard completed successfully

## Additional Resources

- [Neon Auth Next.js Documentation](https://neon.com/docs/neon-auth/quick-start/nextjs)
- [Neon Auth Demo App](https://github.com/neondatabase-labs/neon-auth-demo-app)
- [Stack Auth Documentation](https://docs.stack-auth.com)

