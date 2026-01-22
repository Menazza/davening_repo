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
    console.log('Starting user programs migration...');

    // Create user_programs junction table
    await sql`
      CREATE TABLE IF NOT EXISTS user_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, program_id)
      );
    `;

    // Create index for faster lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_user_programs_user ON user_programs(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_programs_program ON user_programs(program_id);`;

    // Auto-enroll all existing users in the Handler program (for backward compatibility)
    const handlerProgram = await sql`
      SELECT id FROM programs WHERE name = 'Handler' LIMIT 1;
    `;

    if (handlerProgram[0]?.id) {
      const handlerId = handlerProgram[0].id;
      
      // Get all users
      const allUsers = await sql`
        SELECT id FROM user_profiles;
      `;

      // Enroll each user in Handler program if not already enrolled
      for (const user of allUsers) {
        await sql`
          INSERT INTO user_programs (user_id, program_id)
          VALUES (${user.id}, ${handlerId})
          ON CONFLICT (user_id, program_id) DO NOTHING;
        `;
      }

      console.log(`✅ Auto-enrolled ${allUsers.length} existing users in Handler program`);
    }

    console.log('\n✅ User programs migration completed successfully!');
    console.log('\nSummary:');
    console.log('  - user_programs table: ✓');
    console.log('  - Indexes created: ✓');
    console.log('  - Existing users auto-enrolled in Handler: ✓');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
