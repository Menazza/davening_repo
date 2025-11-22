// Quick script to check if .env file has DATABASE_URL
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Checking environment variables...\n');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ DATABASE_URL is not set!\n');
  console.log('Make sure your .env file has:');
  console.log('DATABASE_URL=your_connection_string_here\n');
  process.exit(1);
} else {
  // Mask the password for security
  const masked = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log('✅ DATABASE_URL is set!');
  console.log('   ' + masked + '\n');
  console.log('You can now run: npm run db:migrate\n');
}

