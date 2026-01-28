# Kollel Payment System Documentation

## Overview
The Kollel Payment System has been implemented for the 8:30-10:30 Morning Kollel program with a fixed monthly salary of R8000, calculated based on attendance minutes.

## Payment Calculation Logic

### Monthly Salary
- **Fixed Amount**: R8000 per month
- **Eligible Days**: Monday to Friday only
- **Daily Duration**: 2 hours (120 minutes per day)

### Rate Calculation
The payment rate varies each month based on the number of available working days:

```
Monthly Rate Per Minute = R8000 ÷ Total Available Minutes in Month
```

Example:
- Month with 22 working days (Mon-Fri): 22 × 120 = 2,640 minutes
- Rate per minute: R8000 ÷ 2,640 = R3.0303 per minute
- If user attends 1,500 minutes: 1,500 × R3.0303 = R4,545.45

### User Earnings
```
User Earnings = Minutes Attended × Rate Per Minute
```

## Database Structure

### Tables Created

#### 1. `kollel_earnings`
Tracks monthly earnings for each user:
- `user_id`: Reference to user
- `program_id`: Reference to kollel program
- `month`: First day of the month (YYYY-MM-01)
- `total_minutes_attended`: Total minutes user was present
- `total_available_minutes`: Total available minutes in that month
- `rate_per_minute`: R8000 divided by total available minutes
- `amount_earned`: Calculated earnings for the month

#### 2. `kollel_payments`
Records all payments made to users:
- `user_id`: User receiving payment
- `program_id`: Kollel program
- `amount`: Payment amount
- `payment_date`: Date of payment
- `notes`: Optional payment notes
- `admin_id`: Admin who recorded the payment

## Key Features

### Automatic Earnings Calculation
- Earnings are automatically recalculated when:
  - User submits attendance
  - User deletes attendance
  - Admin manually triggers recalculation

### Admin Portal
Location: `/kollel-admin`

Features:
- View all kollel participants
- See total earnings, payments, and balance owed
- Record payments for users
- View detailed breakdown by month
- See minutes attended vs available minutes
- View payment history

### API Endpoints

#### GET `/api/kollel-earnings`
Get earnings for user(s)
- Query params:
  - `user_id`: Specific user (admin only)
  - `all_users=true`: Get all users (admin only)
  - `year` & `month`: Recalculate specific month

#### POST `/api/kollel-earnings`
Manually recalculate earnings for a specific month
- Body: `{ user_id, year, month }`

#### GET `/api/kollel-payments`
Get payment history
- Query params:
  - `user_id`: Specific user (admin only)

#### POST `/api/kollel-payments`
Record a new payment (admin only)
- Body: `{ user_id, amount, payment_date, notes }`

## Admin User

### Created Admin Account
- **Email**: admin@keter.com
- **Privileges**: Full admin access
- **Access**: Can view and manage all kollel earnings and payments

### Setting Up Authentication
To enable login for admin@keter.com:
1. Go to Stack Auth dashboard
2. Create a user with email: admin@keter.com
3. Set a password
4. The system will automatically link to the database record

## Navigation

### Admin Navigation
Admin users now see two menu items:
- **Hendler Admin**: Manages Hendler program (original attendance system)
- **Kollel Admin**: Manages Kollel program (time-based attendance with calculated payments)

## Usage Flow

### For Users
1. Submit attendance with arrival and departure times
2. System automatically calculates minutes attended
3. At end of month, earnings are calculated based on attendance

### For Admins
1. Navigate to `/kollel-admin`
2. View dashboard with all participants
3. See total earned, paid, and owed amounts
4. Click "View Details" to see monthly breakdown
5. Click "Record Payment" to log a payment
6. System automatically updates balances

## Migration Scripts

### Created Scripts
1. `scripts/migrate-kollel-payments.ts` - Creates database tables
2. `scripts/create-kollel-admin.ts` - Creates admin user

### Running Migrations
```bash
# Create kollel payment tables
npx tsx scripts/migrate-kollel-payments.ts

# Create admin user (already run)
npx tsx scripts/create-kollel-admin.ts
```

## Files Created/Modified

### New Files
- `lib/kollel-payments.ts` - Payment calculation logic
- `app/api/kollel-earnings/route.ts` - Earnings API endpoint
- `app/api/kollel-payments/route.ts` - Payments API endpoint
- `app/kollel-admin/page.tsx` - Admin portal page
- `scripts/migrate-kollel-payments.ts` - Database migration
- `scripts/create-kollel-admin.ts` - Admin user creation

### Modified Files
- `app/api/kollel-attendance/route.ts` - Added automatic earnings recalculation
- `components/Navigation.tsx` - Added Kollel Admin link

## Example Scenarios

### Scenario 1: January 2026
- Working days (Mon-Fri): 23 days
- Available minutes: 23 × 120 = 2,760 minutes
- Rate per minute: R8000 ÷ 2,760 = R2.8986 per minute
- User attends 2,400 minutes
- Earnings: 2,400 × R2.8986 = R6,956.64

### Scenario 2: February 2026
- Working days (Mon-Fri): 20 days
- Available minutes: 20 × 120 = 2,400 minutes
- Rate per minute: R8000 ÷ 2,400 = R3.3333 per minute
- User attends 2,000 minutes
- Earnings: 2,000 × R3.3333 = R6,666.67

## Notes

- Earnings are calculated monthly and stored in the database
- Payments can be made at any time and are tracked separately
- Balance owed = Total Earned - Total Paid
- System supports partial payments
- All monetary values are stored with 2 decimal precision
- Rate per minute is stored with 4 decimal precision for accuracy

## Future Enhancements (Optional)

1. Export earnings/payments to CSV
2. Bulk payment processing
3. Email notifications for payments
4. Monthly earnings reports
5. Attendance reminders
6. Integration with banking systems for direct deposits
