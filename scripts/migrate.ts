import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('\nPlease make sure you have:');
  console.error('1. Created a .env file in the root directory');
  console.error('2. Added your DATABASE_URL to the .env file');
  console.error('\nExample:');
  console.error('DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  try {
    console.log('Starting database migration...');

    // Users table (extends Neon Auth user)
    // References the auth.users table from Neon Auth
    // If auth.users doesn't exist yet, run the Neon Auth setup first
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        hebrew_name TEXT,
        bank_name TEXT,
        account_number TEXT,
        branch_code TEXT,
        account_type TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Note: After Neon Auth setup completes and creates auth.users table,
    // you can optionally add a foreign key reference:
    // ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
    // FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    // Daily attendance records
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        came_early BOOLEAN NOT NULL DEFAULT FALSE,
        learned_early BOOLEAN NOT NULL DEFAULT FALSE,
        came_late BOOLEAN NOT NULL DEFAULT FALSE,
        minutes_late INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `;

    // Earnings calculations (denormalized for performance)
    await sql`
      CREATE TABLE IF NOT EXISTS earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        amount_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
        on_time_bonus DECIMAL(10, 2) DEFAULT 0,
        early_bonus DECIMAL(10, 2) DEFAULT 0,
        learning_bonus DECIMAL(10, 2) DEFAULT 0,
        is_weekend BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `;

    // Payment records
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        admin_id UUID REFERENCES user_profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Shul times (managed by admin)
    await sql`
      CREATE TABLE IF NOT EXISTS shul_times (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        service_name TEXT NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(day_of_week, service_name)
      );
    `;

    // Announcements (managed by admin)
    await sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES user_profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON earnings(user_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, expires_at);`;

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

