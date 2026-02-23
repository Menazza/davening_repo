import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

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
    console.log('Starting davening application & terms migration...');

    await sql`
      CREATE TABLE IF NOT EXISTS davening_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
        firstname TEXT NOT NULL,
        surname TEXT NOT NULL,
        date_of_birth DATE NOT NULL,
        contact_number TEXT NOT NULL,
        home_address TEXT NOT NULL,
        is_student BOOLEAN NOT NULL DEFAULT FALSE,
        student_what TEXT,
        student_where TEXT,
        next_of_kin_name TEXT NOT NULL,
        next_of_kin_relationship TEXT NOT NULL,
        next_of_kin_contact TEXT NOT NULL,
        availability_days TEXT[] DEFAULT '{}',
        cv_url TEXT,
        portrait_url TEXT,
        health_condition BOOLEAN NOT NULL DEFAULT FALSE,
        health_condition_description TEXT,
        mental_health_condition BOOLEAN NOT NULL DEFAULT FALSE,
        mental_health_receiving_help BOOLEAN,
        mental_health_description TEXT,
        mental_health_need_help BOOLEAN,
        bank_name TEXT NOT NULL,
        account_holder_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        branch_code TEXT NOT NULL,
        account_type TEXT NOT NULL,
        popia_consent_at TIMESTAMPTZ,
        application_submitted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS terms_acceptances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_davening_applications_user ON davening_applications(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user ON terms_acceptances(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_month ON terms_acceptances(user_id, accepted_at);`;

    console.log('✅ Davening application & terms migration completed.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
