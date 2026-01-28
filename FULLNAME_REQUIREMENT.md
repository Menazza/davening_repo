# Full Name Requirement Implementation

## Current Issue
Users are seeing "Welcome, [email]!" instead of "Welcome, [Full Name]!" because:
1. Stack Auth doesn't require display name during sign-up by default
2. When profile is created, if no displayName exists, only email is stored

## Solutions Implemented

### 1. Stack Auth Client Configuration (Attempted)
Updated `stack/client.tsx` to require displayName during sign-up:
```typescript
profileFields: {
  displayName: {
    required: true,
    minLength: 2,
  },
}
```

**Note**: This configuration may require Stack Auth dashboard settings. If sign-up still doesn't require name:

### 2. Stack Auth Dashboard Configuration (Recommended)
Go to your Stack Auth Dashboard:
1. Navigate to **Project Settings**
2. Go to **Authentication** section  
3. Under **User Profile Fields**, enable and make **Display Name** required
4. Set minimum length to 2 characters

### 3. Profile Page (Already Working)
Users can add/update their full name at `/profile`:
- Open "Personal Information" section
- Edit "Full Name" field
- Click "Save Profile"

### 4. Post-Registration Flow (Alternative)
If Stack Auth doesn't require name during sign-up, add a post-registration redirect:

**Option A**: Redirect new users without names to profile page:
- After sign-up, check if `full_name` is empty
- If empty, redirect to `/profile?enroll=true` with message
- Require name before accessing other features

**Option B**: Add an onboarding modal for new users

## Current User Fix

### Restore basedinct@gmail.com Full Name
✅ Already restored to "Menachem Altman"

Script location: `scripts/restore-basedinct.ts`

### Update Other Users Without Names
Use the interactive script:
```bash
npx tsx scripts/update-user-names.ts
```

This will:
1. Find all users without full names
2. Prompt you to enter names for each user
3. Update the database

## How It Works Now

### Sign-Up Flow:
1. User signs up through Stack Auth
2. System creates user in `auth.users` table (Stack Auth)
3. On first login, system calls `/api/auth/me`
4. `/api/auth/me` creates profile in `user_profiles` table
5. Profile uses `user.displayName` from Stack Auth
6. If displayName is null/empty, only email is stored

### Display Logic:
- Dashboard: `{user.full_name || user.email}!`
- Navigation: `{user.full_name || user.email}`
- Admin portals: Show full_name when available

## Testing

### Test New User Sign-Up:
1. Log out current user
2. Go to `/handler/sign-up`
3. Try to sign up
4. Verify if display name is required
5. If not required, name field may be optional

### Test Name Display:
1. Log in as user with full_name set
2. Should see: "Welcome, [Full Name]!"
3. Log in as user without full_name
4. Should see: "Welcome, [Email]!"

## Future Enhancements

### Option 1: Add Middleware Check
Create middleware to redirect users without names:
```typescript
// In middleware.ts or a new auth check
if (user && !user.full_name && !pathname.includes('/profile')) {
  return NextResponse.redirect('/profile?complete_profile=true');
}
```

### Option 2: Add Required Profile Completion
Show a banner or modal for users without names:
- Display on all pages
- Cannot be dismissed until name is added
- Link directly to profile page

### Option 3: Update Stack Auth Integration
Sync display names from Stack Auth:
- Periodically check Stack Auth for displayName updates
- Auto-update user_profiles when Stack Auth user changes name

## Current Status

✅ Dashboard shows full_name when available
✅ Profile page allows editing full name
✅ basedinct@gmail.com restored to "Menachem Altman"
✅ Stack client configured to prefer displayName
⚠️ Stack Auth may need dashboard configuration
⚠️ No enforcement for required names yet

## Recommended Next Steps

1. **Immediate**: Configure Stack Auth dashboard to require display name
2. **Short-term**: Ask users to complete their profiles
3. **Long-term**: Add middleware to enforce profile completion

## Scripts Available

- `scripts/restore-basedinct.ts` - Restore specific user name
- `scripts/update-user-names.ts` - Interactive name updater for all users
- `scripts/list-all-users.ts` - View all users and their names
- `scripts/update-basedinct-name.ts` - Set basedinct to placeholder
