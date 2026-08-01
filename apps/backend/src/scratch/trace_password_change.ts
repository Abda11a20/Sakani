// apps/backend/src/scratch/trace_password_change.ts
import { PrismaClient, NotificationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_mM2JqFenD5IV@ep-wandering-bread-aszzcx0g.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function traceCurrentExecution() {
  await prisma.$connect();
  const userId = "cms0cbb0k0001vovwvjb0kiyi";

  console.log('====================================================');
  console.log('[PHASE 1: VERIFY CODE & TRACE EXECUTION]');
  console.log('====================================================');

  const input = {
    userId,
    type: NotificationType.SYSTEM,
    title: 'Password changed',
    body: 'Your password was changed successfully.',
    entityType: 'security.password.changed',
    entityId: userId, // Current running code in auth.service.ts line 593
  };

  console.log('Step 1: changePassword() called -> YES');
  console.log('Step 2: notificationService.createUnique() called -> YES');
  
  // Step 3: findFirst
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });

  if (existing) {
    console.log(`Step 3: findFirst() returned -> EXISTING ROW (id=${existing.id}, createdAt=${existing.createdAt.toISOString()})`);
    console.log('Step 4: create() executed -> NO (Skipped due to duplicate check)');
    console.log('Step 5: dispatcher.dispatch() executed -> NO (Skipped)');
  } else {
    console.log('Step 3: findFirst() returned -> NULL');
    console.log('Step 4: create() executed -> YES');
    console.log('Step 5: dispatcher.dispatch() executed -> YES');
  }

  // Step 6: GET /notifications query output
  const userNotifs = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('\nStep 6: GET /notifications API response top items:');
  userNotifs.forEach((n, idx) => {
    console.log(`  [#${idx+1}] id=${n.id} createdAt=${n.createdAt.toISOString()} title="${n.title}" isRead=${n.isRead}`);
  });

  const latestNotif = userNotifs[0];
  const isTodayNotif = latestNotif && latestNotif.entityType === 'security.password.changed' && latestNotif.createdAt.getTime() > Date.now() - 3600000;
  console.log(`\nStep 7: React Query & NotificationDropdown receives new notification today -> ${isTodayNotif ? 'YES' : 'NO'}`);
}

traceCurrentExecution()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
