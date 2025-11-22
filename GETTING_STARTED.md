# Getting Started - Hendler Daven Attendance System

This guide will help you get the application running with Neon Auth.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Neon Auth

### 2.1 Run the Neon Auth Setup Wizard

This will automatically configure authentication routes:

```bash
npx @stackframe/init-stack@latest --no-browser
```

The wizard will:
- Create authentication routes at `/handler/*`
- Set up layout wrappers
- Configure authentication handlers

### 2.2 Get Your Neon Auth Keys

1. Go to your [Neon Console](https://neon.tech/console)
2. Navigate to your project
3. Go to the **Auth** section
4. You should see:
   - **Project ID**
   - **Publishable Client Key**
   - **Secret Server Key**

### 2.3 Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   ```env
   # Neon Auth environment variables
   NEXT_PUBLIC_STACK_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
   STACK_SECRET_SERVER_KEY=your_secret_key_here
   
   # Database owner connection string
   DATABASE_URL=your_database_connection_string_here
   ```

   **Important**: Make sure to get the **Database owner connection string** from your Neon project settings, not just any connection string.

## Step 3: Run Database Migration

After setting up your environment variables, run the database migration:

```bash
npm run db:migrate
```

This creates all necessary tables:
- `user_profiles` - User information and bank details
- `attendance` - Daily attendance records
- `earnings` - Calculated earnings per day
- `payments` - Payment records
- `shul_times` - Shul service times
- `announcements` - Announcements from admin

**Note**: The migration creates the `user_profiles` table that links to Neon Auth's `auth.users` table. After Neon Auth is fully set up, you can optionally add a foreign key constraint:

```sql
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Test Authentication

1. Visit [http://localhost:3000/handler/sign-up](http://localhost:3000/handler/sign-up)
2. Create a test user account
3. After signing up, check your Neon database:
   - You should see the user in the `auth.users` table (created by Neon Auth)
   - A corresponding profile should be created in `user_profiles` table (created automatically on first sign-in)

## Step 6: Create Admin User

To make a user an admin, update the database directly:

```sql
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE email = 'admin@example.com';
```

Or use the Neon Console SQL editor to set `is_admin = TRUE` for the desired user.

## Troubleshooting

### "User not found" or authentication errors
- Verify all environment variables are set correctly in `.env.local`
- Make sure you're using the **Database owner connection string** (not read-only)
- Check that the Neon Auth setup wizard completed successfully
- Verify the database migration ran without errors

### Database connection errors
- Make sure your `DATABASE_URL` is the **owner connection string**
- Check that your Neon project is active
- Verify your IP is not blocked (Neon allows connections from anywhere by default)

### Authentication routes not working
- Ensure the setup wizard (`npx @stackframe/init-stack@latest`) ran successfully
- Check that environment variables are prefixed correctly:
  - `NEXT_PUBLIC_*` variables are exposed to the client
  - `STACK_SECRET_SERVER_KEY` is server-side only
- Restart your development server after setting environment variables

### Foreign key constraint errors
- The foreign key to `auth.users` is optional
- You can add it later after confirming Neon Auth created the `auth.users` table
- The system works without the foreign key constraint

## Next Steps

1. **Test the attendance form**: Log in and submit an attendance record
2. **Set up admin**: Create an admin user and access the admin portal
3. **Configure shul times**: Add service times in the admin portal
4. **Create announcements**: Post announcements that appear on the home screen

## Additional Resources

- [Neon Auth Next.js Documentation](https://neon.com/docs/neon-auth/quick-start/nextjs)
- [Neon Database Documentation](https://neon.tech/docs)
- [Stack Auth Documentation](https://docs.stack-auth.com)

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Check that the database migration completed successfully
4. Review the [SETUP_NEON_AUTH.md](./SETUP_NEON_AUTH.md) guide for detailed troubleshooting

