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
    console.log('Starting programs migration...');

    // Create programs table
    await sql`
      CREATE TABLE IF NOT EXISTS programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Add program_id to attendance table (nullable for backward compatibility)
    await sql`
      ALTER TABLE attendance 
      ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;
    `;

    // Update unique constraint to include program_id
    // First, drop the old constraint/index if it exists
    await sql`
      DO $$
      BEGIN
        -- Drop unique constraint if it exists
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'attendance_user_id_date_key'
        ) THEN
          ALTER TABLE attendance DROP CONSTRAINT attendance_user_id_date_key;
        END IF;
      END $$;
    `;
    
    // Drop unique index if it exists (PostgreSQL might create this automatically)
    await sql`DROP INDEX IF EXISTS attendance_user_id_date_key;`;
    
    // Drop the new index if it already exists (for idempotency)
    await sql`DROP INDEX IF EXISTS attendance_user_program_date_unique;`;

    // Create new unique index that allows multiple programs per user/date
    // This allows a user to have attendance for multiple programs on the same date
    // We use a unique index with COALESCE to handle NULL program_id (for backward compatibility)
    // Note: PostgreSQL doesn't allow COALESCE in UNIQUE constraints, so we use a unique index
    await sql`
      CREATE UNIQUE INDEX attendance_user_program_date_unique 
      ON attendance(user_id, COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::uuid), date);
    `;

    // Create kollel_attendance table for Keter Eliyahu Morning Kollel
    await sql`
      CREATE TABLE IF NOT EXISTS kollel_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        arrival_time TIME NOT NULL,
        departure_time TIME NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, program_id, date)
      );
    `;

    // Insert default programs
    console.log('Creating default programs...');
    const handlerProgram = await sql`
      INSERT INTO programs (name, description)
      VALUES ('Handler', 'Morning Learning & Davening Program')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id, name;
    `;

    const kollelProgram = await sql`
      INSERT INTO programs (name, description)
      VALUES ('Keter Eliyahu Morning Kollel', 'Morning Kollel program from 8:30 AM to 10:30 AM')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id, name;
    `;

    if (handlerProgram[0]) {
      console.log(`✅ Program created/updated: ${handlerProgram[0].name} (ID: ${handlerProgram[0].id})`);
    }
    if (kollelProgram[0]) {
      console.log(`✅ Program created/updated: ${kollelProgram[0].name} (ID: ${kollelProgram[0].id})`);
    }

    // Migrate existing attendance records to Handler program
    // Update at most one row per (user_id, date) to avoid violating unique (user_id, program_id, date)
    const handlerId = handlerProgram[0]?.id;
    if (handlerId) {
      const idsToUpdate = await sql`
        SELECT DISTINCT ON (user_id, date) id
        FROM attendance
        WHERE program_id IS NULL
        AND (user_id, date) NOT IN (
          SELECT user_id, date FROM attendance WHERE program_id = ${handlerId}
        )
        ORDER BY user_id, date, id;
      `;
      let updatedCount = 0;
      for (const row of idsToUpdate as { id: string }[]) {
        await sql`
          UPDATE attendance SET program_id = ${handlerId} WHERE id = ${row.id}
        `;
        updatedCount += 1;
      }
      if (updatedCount > 0) {
        console.log(`✅ Migrated ${updatedCount} existing attendance records to Handler program`);
      } else {
        console.log('ℹ️  No existing attendance records to migrate (or already migrated)');
      }
    } else {
      console.log('⚠️  Warning: Handler program not found, skipping migration of existing records');
    }

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_program ON attendance(program_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_attendance_user_date ON kollel_attendance(user_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kollel_attendance_program ON kollel_attendance(program_id);`;

    console.log('\n✅ Programs migration completed successfully!');
    console.log('\nSummary:');
    console.log('  - programs table: ✓');
    console.log('  - kollel_attendance table: ✓');
    console.log('  - attendance.program_id column: ✓');
    console.log('  - Default programs created: ✓');
    console.log('  - Indexes created: ✓');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
