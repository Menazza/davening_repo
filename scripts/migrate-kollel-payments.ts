import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  try {
    console.log('Starting kollel payments migration...');

    // Create kollel_earnings table for tracking monthly earnings
    await sql`
      CREATE TABLE IF NOT EXISTS kollel_earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        month DATE NOT NULL,
        total_minutes_attended INTEGER NOT NULL DEFAULT 0,
        total_available_minutes INTEGER NOT NULL DEFAULT 0,
        rate_per_minute DECIMAL(10, 4) NOT NULL DEFAULT 0,
        amount_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, program_id, month)
      );
    `;

    // Create kollel_payments table for tracking payments
    await sql`
      CREATE TABLE IF NOT EXISTS kollel_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        notes TEXT,
        admin_id UUID REFERENCES user_profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_earnings_user ON kollel_earnings(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_earnings_program ON kollel_earnings(program_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_earnings_month ON kollel_earnings(month);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_payments_user ON kollel_payments(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_payments_program ON kollel_payments(program_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_payments_date ON kollel_payments(payment_date);`;

    console.log('\n✅ Kollel payments migration completed successfully!');
    console.log('\nSummary:');
    console.log('  - kollel_earnings table: ✓');
    console.log('  - kollel_payments table: ✓');
    console.log('  - Indexes created: ✓');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
