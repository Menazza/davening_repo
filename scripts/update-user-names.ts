import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

const sql = neon(databaseUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function updateUserNames() {
  try {
    console.log('Finding users without full names...\n');

    // Find users without full names
    const usersWithoutNames = await sql`
      SELECT id, email, full_name
      FROM user_profiles
      WHERE full_name IS NULL OR full_name = '' OR email = full_name
      ORDER BY created_at DESC
    `;

    if (usersWithoutNames.length === 0) {
      console.log('✅ All users have full names set!');
      rl.close();
      return;
    }

    console.log(`Found ${usersWithoutNames.length} user(s) without proper full names:\n`);
    
    usersWithoutNames.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Current name: ${user.full_name || 'Not set'}\n`);
    });

    const update = await askQuestion('Would you like to update these users? (yes/no): ');
    
    if (update.toLowerCase() !== 'yes' && update.toLowerCase() !== 'y') {
      console.log('Update cancelled.');
      rl.close();
      return;
    }

    console.log('\nUpdating users...\n');

    for (const user of usersWithoutNames) {
      console.log(`\nUser: ${user.email}`);
      const fullName = await askQuestion('Enter full name (or press Enter to skip): ');
      
      if (fullName && fullName.trim()) {
        await sql`
          UPDATE user_profiles
          SET full_name = ${fullName.trim()},
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
        console.log(`✅ Updated ${user.email} → ${fullName.trim()}`);
      } else {
        console.log(`⏭️  Skipped ${user.email}`);
      }
    }

    console.log('\n✅ Update complete!');
    rl.close();
  } catch (error) {
    console.error('❌ Error updating user names:', error);
    rl.close();
    process.exit(1);
  }
}

updateUserNames();
