// apps/backend/scripts/create-super-admin.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  const adapter = new PrismaPg(client);
  const prisma = new PrismaClient({ adapter });

  const email = 'admin@sakani.eg';
  const phone = '01000000000';
  const name = 'Super Admin';
  const plainPassword = 'AdminPassword123!';
  const saltRounds = 12;

  console.log('Starting super admin creation/verification...');

  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { phone }
      ]
    }
  });

  if (existingUser) {
    console.log(`User already exists with ID: ${existingUser.id}. Updating to Super Admin...`);
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: 'super_admin',
        isActive: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        passwordHash
      }
    });
    console.log(`Successfully updated user to Super Admin:`);
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- Phone: ${updatedUser.phone}`);
    console.log(`- Role: ${updatedUser.role}`);
  } else {
    console.log('Creating new Super Admin user...');
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'super_admin',
        isActive: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date()
      }
    });
    console.log(`Successfully created new Super Admin user:`);
    console.log(`- Email: ${newUser.email}`);
    console.log(`- Phone: ${newUser.phone}`);
    console.log(`- Password: ${plainPassword}`);
    console.log(`- Role: ${newUser.role}`);
  }

  await prisma.$disconnect();
  await client.end();
}

main()
  .catch((e) => {
    console.error('Error creating super admin:', e);
    process.exit(1);
  });
