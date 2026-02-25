# Hendler Daven Attendance System

A comprehensive web application for tracking morning learning and davening attendance at Rabbi Hendler's minyan.

## Features

### User Features
- **Daily Attendance Form**: Submit attendance for each day with:
  - Date selection
  - Early arrival (5 minutes early) tracking
  - Learning in early time tracking
  - Late arrival tracking with increments
- **User Profile**: Manage personal information including:
  - Hebrew name for aliyas
  - South Africa bank details (bank name, account number, branch code, account type)
- **Earnings Tracking**: View earnings breakdown:
  - Weekday rate: R100 per activity (on-time, early arrival, learning) = R300 max/day
  - Weekend rate: R150 per activity (Saturday + Sunday together) = R450 max for weekend
  - Total earned, paid, and owed amounts
  - Detailed earnings and payment history

### Admin Features
- **User Management**: View all users with their earnings summary
- **Payment Tracking**: Record payments which automatically deduct from owed amounts
- **Announcements**: Create and manage announcements displayed on user home screen
- **Shul Times**: Set and manage shul service times by day of week
- **Payment History**: Track all payments with dates and notes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: NeonDB (PostgreSQL)
- **Authentication**: Internal email/password auth (custom `/api/auth/*` routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a NeonDB project at [neon.tech](https://neon.tech)
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. Get your credentials from the Neon Console:
   - Go to your Neon project → Auth section
   - Copy: Project ID, Publishable Client Key, Secret Server Key
   - Get your **Database owner connection string** from Settings

5. Fill in `.env.local` with at least:
   ```env
   DATABASE_URL=your_database_owner_connection_string_here
   ```

### 3. Run Database Migration

```bash
npm run db:migrate
```

This will create all necessary tables:
- `user_profiles` - User information and bank details
- `attendance` - Daily attendance records
- `earnings` - Calculated earnings per day
- `payments` - Payment records
- `shul_times` - Shul service times
- `announcements` - Announcements from admin

### 4. Create Admin User

To create an admin user, you'll need to manually update the database:

```sql
UPDATE user_profiles SET is_admin = TRUE WHERE email = 'admin@example.com';
```

Or use the Neon console to set `is_admin = TRUE` for the desired user.

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── profile/           # User profile page
│   ├── earnings/          # Earnings history page
│   ├── admin/             # Admin portal
│   └── login/             # Login page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication helpers
│   ├── attendance.ts     # Attendance logic
│   ├── payments.ts       # Payment handling
│   ├── admin.ts          # Admin functions
│   └── db.ts             # Database connection
├── scripts/              # Database migration scripts
└── .env                  # Environment variables (create this)
```

## Database Schema

### user_profiles
- `id` (UUID, Primary Key)
- `email` (TEXT, Unique)
- `full_name` (TEXT)
- `hebrew_name` (TEXT) - For aliyas
- `bank_name` (TEXT) - South Africa bank name
- `account_number` (TEXT)
- `branch_code` (TEXT)
- `account_type` (TEXT)
- `is_admin` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### attendance
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `date` (DATE)
- `came_early` (BOOLEAN)
- `learned_early` (BOOLEAN)
- `came_late` (BOOLEAN)
- `minutes_late` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- Unique constraint on (user_id, date)

### earnings
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `date` (DATE)
- `amount_earned` (DECIMAL)
- `on_time_bonus` (DECIMAL)
- `early_bonus` (DECIMAL)
- `learning_bonus` (DECIMAL)
- `is_weekend` (BOOLEAN)
- Unique constraint on (user_id, date)

### payments
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `amount` (DECIMAL)
- `payment_date` (DATE)
- `notes` (TEXT)
- `admin_id` (UUID, Foreign Key)
- `created_at` (TIMESTAMPTZ)

### shul_times
- `id` (UUID, Primary Key)
- `day_of_week` (INTEGER, 0-6)
- `service_name` (TEXT)
- `time` (TIME)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- Unique constraint on (day_of_week, service_name)

### announcements
- `id` (UUID, Primary Key)
- `title` (TEXT)
- `message` (TEXT)
- `is_active` (BOOLEAN)
- `created_by` (UUID, Foreign Key)
- `created_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ, nullable)

## API Routes

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance` - Submit attendance
- `GET /api/attendance?date=YYYY-MM-DD` - Get attendance for date

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Earnings
- `GET /api/earnings` - Get user earnings summary

### Payments
- `POST /api/payments` - Create payment (admin only)
- `GET /api/payments?type=payments` - Get payment history
- `GET /api/payments?type=earnings` - Get earnings history

### Admin
- `GET /api/admin/users` - Get all users with earnings (admin only)

### Announcements
- `GET /api/announcements` - Get active announcements
- `GET /api/announcements?all=true` - Get all announcements (admin only)
- `POST /api/announcements` - Create announcement (admin only)
- `PUT /api/announcements` - Update announcement (admin only)
- `DELETE /api/announcements?id=...` - Delete announcement (admin only)

### Shul Times
- `GET /api/shul-times` - Get all shul times
- `POST /api/shul-times` - Create/update shul time (admin only)
- `DELETE /api/shul-times?id=...` - Delete shul time (admin only)

## Earnings Calculation Logic

### Weekday (Monday-Friday)
- On-time (not late): R100
- 5 minutes early: R100
- Learning in early time: R100
- **Maximum: R300 per day**

### Weekend (Saturday + Sunday together)
- On-time (not late): R150
- 5 minutes early: R150
- Learning in early time: R150
- **Maximum: R450 for the weekend pair**

The system automatically detects if a date is part of a weekend pair (Saturday or Sunday where Saturday was the previous day).

## Notes

- **Neon Auth Integration**: The system uses Neon Auth for authentication. Follow [SETUP_NEON_AUTH.md](./SETUP_NEON_AUTH.md) for setup instructions.
- **Admin Users**: Admin users must be set manually in the database (`is_admin = TRUE`).
- **Currency**: The system uses South African Rand (R) currency throughout.
- **Timezone**: All dates are stored in UTC timezone.
- **Payments**: Payment records automatically deduct from total owed amounts.
- **User Profiles**: User profiles are automatically created when users first sign in.

## Production Deployment

1. Update environment variables with production values
2. Enable secure cookies in production
3. Set up proper Neon Auth integration
4. Configure CORS if needed
5. Set up SSL/TLS certificates
6. Configure rate limiting for API routes
7. Set up monitoring and error tracking

## Support

For issues or questions, please contact the system administrator.
