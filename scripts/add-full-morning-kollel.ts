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

async function addFullMorningKollel() {
  try {
    console.log('Adding Keter Eliyahu Full Morning Kollel program...');

    // Insert the new program
    const fullKollelProgram = await sql`
      INSERT INTO programs (name, description)
      VALUES ('Keter Eliyahu Full Morning Kollel', 'Full Morning Kollel program from 8:45 AM to 12:00 PM')
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, is_active = TRUE
      RETURNING id, name;
    `;

    if (fullKollelProgram[0]) {
      console.log(`✅ Program created/updated: ${fullKollelProgram[0].name} (ID: ${fullKollelProgram[0].id})`);
    } else {
      console.log('⚠️  Program may already exist or there was an issue');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log('  - Keter Eliyahu Full Morning Kollel program: ✓');
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addFullMorningKollel();
