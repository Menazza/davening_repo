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
    console.log('Starting program_join_requests migration...');

    await sql`
      CREATE TABLE IF NOT EXISTS program_join_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        requested_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
        UNIQUE(user_id, program_id)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_program_join_requests_user ON program_join_requests(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_join_requests_program ON program_join_requests(program_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_join_requests_status ON program_join_requests(status);`;

    console.log('\n✅ program_join_requests migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
