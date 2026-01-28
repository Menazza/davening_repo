import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

(async () => {
  const user = await sql`
    SELECT id, email, full_name 
    FROM user_profiles 
    WHERE email = 'basedinct@gmail.com'
  `;
  
  console.log('basedinct@gmail.com user data:');
  console.log(JSON.stringify(user[0], null, 2));
})();
