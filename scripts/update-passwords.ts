import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function updatePasswords() {
  try {
    console.log('Adding password column (if missing) and updating passwords...');

    // 1) Add password column if it doesn't exist
    await sql`
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS password TEXT;
    `;

    // 2) Update specific users' passwords
    await sql`
      UPDATE user_profiles
      SET password = 'P@ssword1'
      WHERE email = 'admin@keter.com';
    `;

    await sql`
      UPDATE user_profiles
      SET password = 'P@ssword1'
      WHERE email = 'admin@hendler.com';
    `;

    await sql`
      UPDATE user_profiles
      SET password = 'M@nkey135'
      WHERE email = 'basedinct@gmail.com';
    `;

    console.log('✅ Password column ensured and passwords updated successfully.');
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  }
}

updatePasswords();

