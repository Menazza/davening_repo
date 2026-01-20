# Migration Guide: Handler App to Multi-Program Tracker

## Overview

The app has been transformed from a single "Handler" program app to a multi-program tracking system called "Tracker". Users can now log attendance for multiple programs on the same day.

## New Features

1. **Multi-Program Support**: Users can track attendance for multiple programs
2. **Keter Eliyahu Morning Kollel**: New program with time-based tracking (arrival/departure times)
3. **Program Selection**: Users can select which program they're submitting attendance for
4. **Rebranded UI**: App is now called "Tracker" instead of "Handler"

## Database Migration

### Step 1: Run the Migration Script

Before using the new features, you need to run the database migration:

```bash
npx tsx scripts/migrate-programs.ts
```

This will:
- Create a `programs` table
- Add `program_id` column to the `attendance` table
- Create `kollel_attendance` table for the new Kollel program
- Insert default programs: "Handler" and "Keter Eliyahu Morning Kollel"
- Migrate existing attendance records to the Handler program

### Step 2: Verify Migration

After running the migration, verify that:
1. The `programs` table exists with 2 programs
2. Existing attendance records have a `program_id` set
3. The `kollel_attendance` table exists

## New Programs

### Handler Program
- Original program with early/late tracking
- Maintains all existing functionality
- Earnings calculations remain the same

### Keter Eliyahu Morning Kollel
- New program running from 8:30 AM to 10:30 AM
- Tracks arrival time (earliest: 8:30 AM)
- Tracks departure time (latest: 10:30 AM)
- Users can log times like 8:35 AM arrival, 10:24 AM departure

## API Changes

### New Endpoints

- `GET /api/programs` - Get all active programs
- `POST /api/kollel-attendance` - Submit kollel attendance
- `GET /api/kollel-attendance?date=YYYY-MM-DD&program_id=UUID` - Get kollel attendance
- `DELETE /api/kollel-attendance?date=YYYY-MM-DD&program_id=UUID` - Delete kollel attendance

### Updated Endpoints

- `POST /api/attendance` - Now accepts optional `program_id` parameter
- `GET /api/attendance` - Now accepts optional `program_id` query parameter

## UI Changes

### Submit Attendance Page
- Now shows a program selector dropdown
- Different forms for different program types:
  - Handler: Checkbox-based form (came early, learned early, came late)
  - Keter Eliyahu Morning Kollel: Time picker form (arrival/departure times)

### Dashboard
- Updated messaging to reflect multi-program support
- Links to the new program-based attendance submission page

### Navigation & Branding
- App name changed from "Rabbi Hendler's Minyan" to "Tracker"
- All UI text updated to reflect multi-program nature

## Usage

1. **Submit Handler Attendance**:
   - Go to Submit Attendance
   - Select "Handler" program
   - Fill out the form (came early, learned early, came late)

2. **Submit Kollel Attendance**:
   - Go to Submit Attendance
   - Select "Keter Eliyahu Morning Kollel" program
   - Enter arrival time (8:30 AM or later)
   - Enter departure time (10:30 AM or earlier)

3. **Submit Multiple Programs**:
   - Submit attendance for Handler in the morning
   - Submit attendance for Kollel in the afternoon
   - Both records are stored separately for the same date

## Files Changed

### New Files
- `scripts/migrate-programs.ts` - Database migration script
- `lib/programs.ts` - Program management functions
- `lib/kollel.ts` - Kollel attendance functions
- `components/KollelAttendanceForm.tsx` - Kollel attendance form component
- `app/submit-attendance/ProgramAttendancePage.tsx` - New program-based attendance page
- `app/api/programs/route.ts` - Programs API endpoint
- `app/api/kollel-attendance/route.ts` - Kollel attendance API endpoint

### Modified Files
- `lib/attendance.ts` - Added program_id support
- `app/api/attendance/route.ts` - Added program_id parameter
- `components/AttendanceForm.tsx` - Added program_id support
- `app/dashboard/DashboardClient.tsx` - Updated UI and messaging
- `app/page.tsx` - Rebranded to "Tracker"
- `app/layout.tsx` - Updated metadata
- `components/Navigation.tsx` - Updated branding
- `app/submit-attendance/page.tsx` - Uses new ProgramAttendancePage

## Notes

- Existing attendance records are automatically assigned to the "Handler" program
- The `/handler/sign-in` routes remain unchanged (these are Stack Auth routes)
- Earnings calculations for Handler program remain unchanged
- Kollel program does not currently have earnings calculations (can be added later if needed)
