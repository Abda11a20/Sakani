// scratch/inspect_notifications.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({
    where: {
      entityType: 'security.password.changed',
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('[RUNTIME DB QUERY RESULT]');
  console.log(`Total 'security.password.changed' rows found: ${notifs.length}`);
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
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
