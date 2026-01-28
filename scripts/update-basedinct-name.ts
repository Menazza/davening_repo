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

async function updateBasedinct() {
  try {
    console.log('Updating basedinct@gmail.com user...\n');

    // Check if user exists
    const user = await sql`
      SELECT * FROM user_profiles
      WHERE email = 'basedinct@gmail.com'
    `;

    if (user.length === 0) {
      console.log('❌ User basedinct@gmail.com not found');
      return;
    }

    console.log('Current user data:');
    console.log(`  Email: ${user[0].email}`);
    console.log(`  Full Name: ${user[0].full_name || 'Not set'}`);
    console.log(`  Hebrew Name: ${user[0].hebrew_name || 'Not set'}\n`);

    // Update the user with a placeholder name
    // The user can update this themselves from their profile page
    await sql`
      UPDATE user_profiles
      SET full_name = 'User',
          updated_at = NOW()
      WHERE email = 'basedinct@gmail.com'
    `;

    console.log('✅ Updated basedinct@gmail.com');
    console.log('   Full Name set to: "User"\n');
    console.log('📝 Note: The user can update their full name from the Profile page');
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  }
}

updateBasedinct();
