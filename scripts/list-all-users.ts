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

async function listAllUsers() {
  try {
    console.log('All users in database:\n');

    const users = await sql`
      SELECT * FROM user_profiles
      ORDER BY created_at DESC
    `;

    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Full Name: ${user.full_name || 'Not set'}`);
      console.log(`   Hebrew Name: ${user.hebrew_name || 'Not set'}`);
      console.log(`   Admin: ${user.is_admin ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    console.log(`Total users: ${users.length}`);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
}

listAllUsers();
