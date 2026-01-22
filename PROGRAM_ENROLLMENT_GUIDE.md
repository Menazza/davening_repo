# Program Enrollment System - Implementation Guide

## Overview

The app now requires users to enroll in programs before submitting attendance. This allows users to participate in multiple programs and track their attendance separately for each.

## Key Changes

### 1. Program Enrollment System
- Users must select which programs they're part of in their profile
- New users are redirected to profile page to enroll before accessing other features
- Only enrolled programs appear in attendance submission dropdowns

### 2. Calendar Click Behavior
- **Click a day** → Shows program selector (if multiple programs) or navigates directly (if single program)
- **Right-click a day** → Opens edit/delete modal for existing attendance
- If no programs enrolled → Redirects to profile page

### 3. Statistics by Program
- Statistics page now shows separate stats for each program
- Handler program shows: Total Days, Learning Days, Early Days, Late Days
- Kollel program shows: Total Days, Total Time, Average Session Length
- Overall summary still shows combined stats

## Database Changes

### New Table: `user_programs`
- Junction table linking users to programs
- Fields: `id`, `user_id`, `program_id`, `enrolled_at`
- Unique constraint on (user_id, program_id)

### Migration
Run the migration to create the table and auto-enroll existing users:

```bash
npx tsx scripts/migrate-user-programs.ts
```

This will:
- Create `user_programs` table
- Auto-enroll all existing users in the Handler program (for backward compatibility)
- Create necessary indexes

## User Flow

### New User Flow
1. User signs up
2. Redirected to `/profile?enroll=true` (if no programs enrolled)
3. User selects programs they're part of
4. User clicks "Save Program Enrollments"
5. Now can access dashboard and submit attendance

### Existing User Flow
1. Existing users are auto-enrolled in Handler program
2. Can add more programs in profile
3. Can remove programs (but must have at least one)

### Submitting Attendance
1. Click day on calendar OR go to Submit Attendance page
2. If multiple programs → Program selector appears
3. If single program → Direct navigation to form
4. Select program (if not pre-selected)
5. Fill out form (Handler: checkboxes, Kollel: time pickers)
6. Submit

## API Endpoints

### New Endpoints
- `GET /api/user-programs` - Get user's enrolled programs
- `PUT /api/user-programs` - Update user's program enrollments
  - Body: `{ programIds: string[] }`

### Updated Endpoints
- `GET /api/programs?enrolled_only=true` - Get only enrolled programs
- `GET /api/attendance/stats` - Now returns `statsByProgram` array

## Files Changed

### New Files
- `scripts/migrate-user-programs.ts` - User programs migration
- `lib/user-programs.ts` - User program management functions
- `app/api/user-programs/route.ts` - User programs API

### Modified Files
- `app/profile/ProfileClient.tsx` - Added program enrollment section
- `app/submit-attendance/ProgramAttendancePage.tsx` - Only shows enrolled programs
- `app/dashboard/page.tsx` - Redirects to profile if no programs
- `components/AttendanceCalendar.tsx` - Shows program selector on click
- `app/api/programs/route.ts` - Added `enrolled_only` parameter
- `app/api/attendance/stats/route.ts` - Returns per-program stats
- `app/statistics/page.tsx` - Shows statistics separated by program

## Testing Checklist

- [ ] New user signs up → Redirected to profile
- [ ] User enrolls in programs → Can access dashboard
- [ ] User clicks calendar day → Program selector appears (if multiple programs)
- [ ] User submits attendance → Only sees enrolled programs
- [ ] Statistics page → Shows separate stats per program
- [ ] Profile page → Can add/remove program enrollments

## Notes

- Users must have at least one program enrolled to use the app
- Existing users are automatically enrolled in Handler program
- Program enrollment is separate from attendance submission
- Statistics are calculated per program and shown separately
