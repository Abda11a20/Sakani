import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

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

  console.log('🌱 Seeding Ad Server initial placements & settings...');

  // 1. Initial Feature Flags
  await prisma.systemSetting.upsert({
    where: { key: 'adsEnabled' },
    update: { value: true },
    create: {
      key: 'adsEnabled',
      value: true,
      description: 'تفعيل أو إيقاف نظام الإعلانات بالكامل في الموقع',
    },
  });

  // 2. Initial Placement Configs
  const placements = [
    {
      key: 'HOME_HERO',
      name: 'أعلى الصفحة الرئيسية (Hero)',
      description: 'إعلان أفقية ممتازة تظهر مباشرة بعد قسم الهيرو الرئيسي',
    },
    {
      key: 'HOME_AFTER_FEATURED',
      name: 'بعد الوحدات المميزة بالرئيسية',
      description: 'إعلان وسط الصفحة الرئيسية بعد قسم الشقق والوحدات المميزة',
    },
    {
      key: 'HOME_BOTTOM',
      name: 'أسفل الصفحة الرئيسية',
      description: 'إعلان أسفل الرئيسية قبل الـ Footer',
    },
    {
      key: 'SEARCH_AFTER_8',
      name: 'بين نتائج البحث (بعد أول 8 عقارات)',
      description: 'إعلان يظهر ديناميكياً بين الكروت بعد أول 8 عقارات في صفحة البحث',
    },
    {
      key: 'SEARCH_BOTTOM',
      name: 'أسفل نتائج البحث',
      description: 'إعلان يظهر أسفل قائمة البحث فوق الترقيم (Pagination)',
    },
    {
      key: 'LISTING_AFTER_GALLERY',
      name: 'صفحة العقار (بعد معرض الصور)',
      description: 'إعلان مميز داخل تفاصيل العقار بعد معرض الصور',
    },
    {
      key: 'LISTING_BOTTOM',
      name: 'أسفل صفحة العقار',
      description: 'إعلان يظهر قبل معلومات التواصل وحاسبة الإيجار',
    },
    {
      key: 'COMMUNITY_TOP',
      name: 'أعلى صفحة مجتمع سكني',
      description: 'إعلان أعلى منتديات ومنشورات مجتمع سكني',
    },
    {
      key: 'COMMUNITY_BOTTOM',
      name: 'أسفل صفحة مجتمع سكني',
      description: 'إعلان أسفل صفحة منشورات المجتمع',
    },
    {
      key: 'DASHBOARD_TOP',
      name: 'أعلى لوحة التحكم',
      description: 'إعلان خاص للمستخدمين والمؤجرين في أعلى الداشبورد',
    },
    {
      key: 'DASHBOARD_BOTTOM',
      name: 'أسفل لوحة التحكم',
      description: 'إعلان أسفل لوحة التحكم',
    },
    {
      key: 'INTERSTITIAL',
      name: 'إعلان الشاشة الكاملة (Fullscreen Modal)',
      description: 'إعلان منبثق بشاشة كاملة عند أول زيارة بمهلة تخطي',
    },
  ];

  for (const placement of placements) {
    await prisma.adPlacementConfig.upsert({
      where: { key: placement.key },
      update: { name: placement.name, description: placement.description },
      create: {
        key: placement.key,
        name: placement.name,
        description: placement.description,
        enabled: true,
      },
    });
  }

  console.log('✅ Ad Server placements & settings seeded successfully!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error seeding Ad Server:', e);
  process.exit(1);
});
