// apps/backend/prisma/seed-community-categories.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('⏳ Seeding Community categories...');

  const categories = [
    { nameAr: 'رياضة', nameEn: 'Sports', icon: '⚽' },
    { nameAr: 'ألعاب فيديو', nameEn: 'Gaming', icon: '🎮' },
    { nameAr: 'ألعاب اجتماعية', nameEn: 'Social Games', icon: '🎲' },
    { nameAr: 'خروجات وتجمع', nameEn: 'Outings', icon: '☕' },
    { nameAr: 'مجموعات دراسة', nameEn: 'Study', icon: '📚' },
    { nameAr: 'مشاركة مشاوير', nameEn: 'Carpool', icon: '🚗' },
  ];

  for (const cat of categories) {
    const existing = await prisma.communityCategory.findFirst({
      where: {
        OR: [
          { nameAr: cat.nameAr },
          { nameEn: cat.nameEn }
        ]
      }
    });

    if (!existing) {
      const created = await prisma.communityCategory.create({
        data: {
          nameAr: cat.nameAr,
          nameEn: cat.nameEn,
          icon: cat.icon,
        }
      });
      console.log(`✅ Created category: ${created.nameAr} (${created.nameEn})`);
    } else {
      console.log(`ℹ️ Category already exists: ${existing.nameAr}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('🏁 Community categories seeding completed! 🎉');
}

main().catch(e => {
  console.error('❌ Error seeding categories:', e);
  process.exit(1);
});
