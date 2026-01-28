import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createKollelAdmin() {
  try {
    console.log('Creating kollel admin user...');

    const adminEmail = 'admin@keter.com';
    const adminId = randomUUID();

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT * FROM user_profiles
      WHERE email = ${adminEmail}
    `;

    if (existingAdmin.length > 0) {
      console.log(`ℹ️  Admin user ${adminEmail} already exists with ID: ${existingAdmin[0].id}`);
      
      // Update to ensure they have admin privileges
      await sql`
        UPDATE user_profiles
        SET is_admin = TRUE,
            full_name = 'Kollel Admin',
            updated_at = NOW()
        WHERE email = ${adminEmail}
      `;
      console.log(`✅ Updated ${adminEmail} to have admin privileges`);
      return;
    }

    // Create new admin user
    const result = await sql`
      INSERT INTO user_profiles (id, email, full_name, is_admin)
      VALUES (${adminId}, ${adminEmail}, 'Kollel Admin', TRUE)
      RETURNING *
    `;

    console.log(`✅ Successfully created kollel admin user:`);
    console.log(`   Email: ${result[0].email}`);
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Admin: ${result[0].is_admin}`);
    console.log('\nNote: This user is created in the database only.');
    console.log('To use Stack Auth for authentication, you need to:');
    console.log('1. Create the user in Stack Auth dashboard with this email');
    console.log('2. The system will link them automatically on first login');
  } catch (error) {
    console.error('❌ Error creating kollel admin:', error);
    process.exit(1);
  }
}

createKollelAdmin();
