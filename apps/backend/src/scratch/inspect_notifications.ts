// apps/backend/src/scratch/inspect_notifications.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mM2JqFenD5IV@ep-wandering-bread-aszzcx0g.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  const notifs = await prisma.notification.findMany({
    where: {
      entityType: 'security.password.changed',
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('====================================================');
  console.log('[DIAGNOSTIC RUNTIME DATABASE QUERY RESULTS]');
  console.log('====================================================');
  console.log(`Total 'security.password.changed' rows in DB: ${notifs.length}`);
  notifs.forEach((n, idx) => {
    console.log(`\nRow #${idx + 1}:`);
    console.log(`  id: ${n.id}`);
    console.log(`  userId: ${n.userId}`);
    console.log(`  createdAt: ${n.createdAt.toISOString()}`);
    console.log(`  type: ${n.type}`);
    console.log(`  entityType: ${n.entityType}`);
    console.log(`  entityId: ${n.entityId}`);
    console.log(`  title: "${n.title}"`);
    console.log(`  body: "${n.body}"`);
    console.log(`  isRead: ${n.isRead}`);
  });

  const allNotifs = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log(`\n====================================================`);
  console.log(`Last 10 Notifications Total in DB:`);
  console.log(`====================================================`);
  allNotifs.forEach((n) => {
    console.log(`- [${n.createdAt.toISOString()}] id=${n.id} [type=${n.type}] [entityType=${n.entityType}] [entityId=${n.entityId}] title="${n.title}"`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
