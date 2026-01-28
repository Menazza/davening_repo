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

async function addAdminType() {
  try {
    console.log('Adding admin_type column to user_profiles...\n');

    // Add admin_type column (can be 'hendler', 'kollel', or null for regular users)
    await sql`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS admin_type TEXT
      CHECK (admin_type IN ('hendler', 'kollel'))
    `;

    console.log('✅ Added admin_type column\n');

    // Update existing admins
    console.log('Setting admin types for existing admins...\n');

    // Set admin@hendler.com as Hendler admin
    await sql`
      UPDATE user_profiles
      SET admin_type = 'hendler'
      WHERE email = 'admin@hendler.com' AND is_admin = TRUE
    `;
    console.log('✅ Set admin@hendler.com as Hendler admin');

    // Set admin@keter.com as Kollel admin
    await sql`
      UPDATE user_profiles
      SET admin_type = 'kollel'
      WHERE email = 'admin@keter.com' AND is_admin = TRUE
    `;
    console.log('✅ Set admin@keter.com as Kollel admin');

    // Show all admins
    const admins = await sql`
      SELECT email, is_admin, admin_type
      FROM user_profiles
      WHERE is_admin = TRUE
      ORDER BY email
    `;

    console.log('\nCurrent admin users:');
    admins.forEach((admin: any) => {
      console.log(`  - ${admin.email}: ${admin.admin_type || 'no type set'} admin`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addAdminType();
