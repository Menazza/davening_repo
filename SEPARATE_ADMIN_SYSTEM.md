# Separate Admin System Documentation

## Overview
The system now has **completely separate admin roles** for Hendler and Kollel programs. Each admin can only access their designated portal.

## Admin Types

### 1. Hendler Admin
- **Email**: admin@hendler.com
- **Access**: `/admin` portal only
- **Can manage**: 
  - Hendler program attendance
  - Hendler earnings (bonus-based system)
  - Hendler payments
  - Announcements
  - Shul times

### 2. Kollel Admin
- **Email**: admin@keter.com
- **Access**: `/kollel-admin` portal only
- **Can manage**:
  - Kollel program attendance (time-based)
  - Kollel earnings (minute-based calculation)
  - Kollel payments

## Key Features

### Separate Logins
- Admins must log in with their specific admin email
- Each admin sees ONLY their portal in the navigation
- Attempting to access the wrong portal redirects to the correct one

### Separate Databases & APIs
- Hendler uses: `earnings`, `payments`, `attendance` tables
- Kollel uses: `kollel_earnings`, `kollel_payments`, `kollel_attendance` tables
- APIs verify admin type before granting access

### Navigation
- **Hendler Admin** sees: "Admin Portal" → links to `/admin`
- **Kollel Admin** sees: "Admin Portal" → links to `/kollel-admin`
- No visibility into the other system

## Database Structure

### Admin Type Field
Added `admin_type` column to `user_profiles`:
```sql
admin_type TEXT CHECK (admin_type IN ('hendler', 'kollel'))
```

- `'hendler'` - Hendler admin
- `'kollel'` - Kollel admin
- `NULL` - Regular user (not admin)

## Security & Access Control

### API Endpoints Protected

#### Hendler Admin Endpoints (require `admin_type = 'hendler'`)
- `POST /api/payments` - Record Hendler payments
- `GET /api/admin/users` - Get all Hendler users
- `GET /api/admin/users/[userId]` - Get Hendler user details

#### Kollel Admin Endpoints (require `admin_type = 'kollel'`)
- `POST /api/kollel-payments` - Record Kollel payments
- `GET /api/kollel-earnings?all_users=true` - Get all Kollel users
- `GET /api/kollel-payments` - Get Kollel payment history

### Authentication Functions

#### New Functions in `lib/server-auth.ts`:
```typescript
// For Hendler admin endpoints
await getAuthenticatedHendlerAdmin();

// For Kollel admin endpoints
await getAuthenticatedKollelAdmin();
```

These functions will throw an error if:
- User is not authenticated
- User is not an admin
- User has the wrong admin type

## User Experience

### Login as Hendler Admin (admin@hendler.com)
1. Log in with admin@hendler.com
2. Redirected to `/admin`
3. See "Admin Portal" in navigation
4. Can manage Hendler program only
5. Attempting to visit `/kollel-admin` → redirected back to `/admin`

### Login as Kollel Admin (admin@keter.com)
1. Log in with admin@keter.com
2. Redirected to `/kollel-admin`
3. See "Admin Portal" in navigation
4. Can manage Kollel program only
5. Attempting to visit `/admin` → redirected back to `/kollel-admin`

### Login as Regular User
1. Log in with student email
2. See Dashboard, Statistics, Profile, Earnings
3. Cannot access any admin portals

## Migration Applied

### Script: `scripts/add-admin-type.ts`
✅ Added `admin_type` column to database
✅ Set admin@hendler.com as Hendler admin
✅ Set admin@keter.com as Kollel admin

## Current Admin Users

```
1. admin@hendler.com
   - Admin Type: hendler
   - Access: /admin portal
   
2. admin@keter.com
   - Admin Type: kollel
   - Access: /kollel-admin portal
```

## Testing

### Test Hendler Admin Access
1. Log in as admin@hendler.com
2. Should see "/admin" portal
3. Should see Hendler users and earnings
4. Should be able to record Hendler payments
5. Cannot access `/kollel-admin`

### Test Kollel Admin Access
1. Log in as admin@keter.com
2. Should see "/kollel-admin" portal
3. Should see Kollel users and earnings
4. Should be able to record Kollel payments
5. Cannot access `/admin`

### Test Regular User
1. Log in as regular user
2. Should see student dashboard
3. Cannot access `/admin` or `/kollel-admin`

## Benefits

✅ **Complete Separation**: Each admin only sees their program
✅ **Security**: API endpoints verify admin type
✅ **Clear Navigation**: No confusion about which portal to use
✅ **Independent Systems**: Hendler and Kollel operate completely independently
✅ **Scalability**: Easy to add more admin types in the future

## Adding New Admins

### To Create a New Hendler Admin:
```sql
UPDATE user_profiles
SET is_admin = TRUE, admin_type = 'hendler'
WHERE email = 'newemail@example.com';
```

### To Create a New Kollel Admin:
```sql
UPDATE user_profiles
SET is_admin = TRUE, admin_type = 'kollel'
WHERE email = 'newemail@example.com';
```

## Files Modified

### Core Files
- `lib/auth.ts` - Added admin_type to User interface
- `lib/server-auth.ts` - Added specific admin auth functions
- `components/Navigation.tsx` - Shows only relevant portal

### Admin Pages
- `app/admin/page.tsx` - Checks for Hendler admin
- `app/kollel-admin/page.tsx` - Checks for Kollel admin

### API Routes
- `app/api/payments/route.ts` - Hendler admin only
- `app/api/admin/users/route.ts` - Hendler admin only
- `app/api/admin/users/[userId]/route.ts` - Hendler admin only
- `app/api/kollel-payments/route.ts` - Kollel admin only
- `app/api/kollel-earnings/route.ts` - Kollel admin only

### Migration Scripts
- `scripts/add-admin-type.ts` - Creates admin_type column
- `scripts/fix-admin-user.ts` - Fixes admin user issues
- `scripts/list-all-users.ts` - Lists all users for debugging
