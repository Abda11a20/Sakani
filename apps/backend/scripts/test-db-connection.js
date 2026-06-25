// apps/backend/scripts/test-db-connection.js
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log('Connected successfully!');
  const res = await client.query('SELECT id, email, phone, role, "emailVerifiedAt" FROM "users" LIMIT 5');
  console.log('Users in DB:');
  console.log(res.rows);
  await client.end();
}

main().catch(err => {
  console.error('Error running test script:', err);
});
