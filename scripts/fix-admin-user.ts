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

async function fixAdminUser() {
  try {
    console.log('Fixing admin user...\n');

    // Find all users with admin@keter.com email
    const adminUsers = await sql`
      SELECT * FROM user_profiles
      WHERE email = 'admin@keter.com'
      ORDER BY created_at DESC
    `;

    console.log(`Found ${adminUsers.length} user(s) with admin@keter.com email:\n`);
    
    adminUsers.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.full_name || 'Not set'}`);
      console.log(`   Admin: ${user.is_admin}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin@keter.com user found. Please log in first to create the Stack Auth user.');
      return;
    }

    // If there are multiple users, we need to consolidate
    if (adminUsers.length > 1) {
      console.log('⚠️  Multiple admin@keter.com users found. This happens when:');
      console.log('   1. Original user was created with random UUID');
      console.log('   2. New user was auto-created when you logged in with Stack Auth\n');

      // The most recent one is likely the Stack Auth user
      const stackAuthUser = adminUsers[0]; // Most recent
      const oldUser = adminUsers[adminUsers.length - 1]; // Oldest

      console.log('📝 Will update the most recent user (Stack Auth user) to have admin privileges...\n');

      // Update the Stack Auth user to be admin
      await sql`
        UPDATE user_profiles
        SET is_admin = TRUE,
            full_name = COALESCE(full_name, 'Kollel Admin'),
            updated_at = NOW()
        WHERE id = ${stackAuthUser.id}
      `;

      console.log(`✅ Updated user ${stackAuthUser.id} to have admin privileges`);

      // Delete old orphaned users
      for (let i = 1; i < adminUsers.length; i++) {
        await sql`
          DELETE FROM user_profiles
          WHERE id = ${adminUsers[i].id}
        `;
        console.log(`🗑️  Deleted orphaned user ${adminUsers[i].id}`);
      }

      console.log('\n✅ Admin user fixed successfully!');
      console.log('   You should now see admin privileges when logged in as admin@keter.com');
    } else {
      // Only one user found, just make sure they're admin
      const user = adminUsers[0];
      
      if (!user.is_admin) {
        await sql`
          UPDATE user_profiles
          SET is_admin = TRUE,
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
        console.log('✅ Set admin privileges for admin@keter.com');
      } else {
        console.log('✅ User already has admin privileges');
      }
    }

  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
    process.exit(1);
  }
}

fixAdminUser();
