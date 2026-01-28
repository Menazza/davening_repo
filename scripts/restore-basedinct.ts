import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

(async () => {
  await sql`
    UPDATE user_profiles 
    SET full_name = 'Menachem Altman' 
    WHERE email = 'basedinct@gmail.com'
  `;
  console.log('✅ Restored full name to Menachem Altman');
})();
