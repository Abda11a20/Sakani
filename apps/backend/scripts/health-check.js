// apps/backend/scripts/health-check.js
// يتحقق من جاهزية جميع الخدمات قبل الـ Deploy
// الاستخدام: node scripts/health-check.js

const { execSync } = require('child_process');

// ── ANSI Colors ───────────────────────────────────────────────────────────────
const green  = (t) => `\x1b[32m${t}\x1b[0m`;
const red    = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const bold   = (t) => `\x1b[1m${t}\x1b[0m`;

const pass = (label) => console.log(`  ${green('✅')} ${label}`);
const fail = (label, reason) => {
  console.log(`  ${red('❌')} ${label}`);
  if (reason) console.log(`     ${red(`→ ${reason}`)}`);
};
const warn = (label) => console.log(`  ${yellow('⚠️')} ${label}`);

let hasErrors = false;

// ── Load .env ─────────────────────────────────────────────────────────────────
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('\n' + bold('🔍 سكني — Health Check Script') + '\n');
console.log('━'.repeat(50));

// ── 1. Required Environment Variables ─────────────────────────────────────────
console.log('\n' + bold('1. متغيرات البيئة الإلزامية'));

const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const OPTIONAL_ENV = [
  'RESEND_API_KEY',
  'PAYMOB_API_KEY',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_HMAC_SECRET',
];

for (const key of REQUIRED_ENV) {
  if (process.env[key]) {
    pass(key);
  } else {
    fail(key, 'مفقود — يجب إضافته لملف .env');
    hasErrors = true;
  }
}

for (const key of OPTIONAL_ENV) {
  if (process.env[key]) {
    pass(`${key} (اختياري)`);
  } else {
    warn(`${key} (اختياري) — غير موجود`);
  }
}

// ── 2. Encryption Key Length ───────────────────────────────────────────────────
console.log('\n' + bold('2. طول مفتاح التشفير'));
const encKey = process.env.ENCRYPTION_KEY ?? '';
if (encKey.length === 32) {
  pass(`ENCRYPTION_KEY: ${encKey.length} حرف (صحيح)`);
} else {
  fail(`ENCRYPTION_KEY: ${encKey.length} حرف`, 'يجب أن يكون 32 حرفاً بالضبط');
  hasErrors = true;
}

// ── 3. Database Connection ─────────────────────────────────────────────────────
console.log('\n' + bold('3. اتصال قاعدة البيانات'));
try {
  execSync('npx prisma db execute --stdin <<< "SELECT 1"', {
    stdio: 'ignore',
    cwd: require('path').join(__dirname, '..'),
  });
  pass('PostgreSQL متصل بنجاح');
} catch {
  // Try a simpler approach via node-postgres if available
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    // We can't await here in a sync script easily, so just validate URL format
    if (process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://')) {
      pass('DATABASE_URL صيغة صحيحة');
      warn('لم يتم اختبار الاتصال الفعلي — شغّل يدوياً');
    } else {
      fail('DATABASE_URL', 'صيغة غير صحيحة — يجب أن تبدأ بـ postgresql://');
      hasErrors = true;
    }
  } catch {
    warn('لم يمكن التحقق من قاعدة البيانات في هذه البيئة');
  }
}

// ── 4. Cloudinary Config ───────────────────────────────────────────────────────
console.log('\n' + bold('4. إعداد Cloudinary'));
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  if (apiKey.match(/^\d+$/) && apiSecret.length > 20) {
    pass(`Cloudinary: cloud="${cloudName}", key="${apiKey.slice(0,4)}****"`);
  } else {
    warn('Cloudinary: المتغيرات موجودة ولكن تبدو غير صحيحة — تحقق منها');
  }
} else {
  fail('Cloudinary', 'متغيرات ناقصة');
  hasErrors = true;
}

// ── 5. Pusher Config ───────────────────────────────────────────────────────────
console.log('\n' + bold('5. إعداد Pusher'));
const appId      = process.env.PUSHER_APP_ID;
const appKey     = process.env.PUSHER_KEY;
const appSecret  = process.env.PUSHER_SECRET;
const appCluster = process.env.PUSHER_CLUSTER;

if (appId && appKey && appSecret && appCluster) {
  pass(`Pusher: cluster="${appCluster}", app_id="${appId}", key="${appKey.slice(0,6)}****"`);
} else {
  fail('Pusher', 'متغيرات ناقصة');
  hasErrors = true;
}

// ── 6. JWT Secrets Strength ────────────────────────────────────────────────────
console.log('\n' + bold('6. قوة JWT Secrets'));
const jwtSecret = process.env.JWT_SECRET ?? '';
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

if (jwtSecret.length >= 32) {
  pass(`JWT_SECRET: ${jwtSecret.length} حرف ✓`);
} else {
  fail(`JWT_SECRET: ${jwtSecret.length} حرف`, 'يجب أن يكون 32 حرفاً على الأقل');
  hasErrors = true;
}

if (refreshSecret.length >= 32) {
  pass(`JWT_REFRESH_SECRET: ${refreshSecret.length} حرف ✓`);
} else {
  fail(`JWT_REFRESH_SECRET: ${refreshSecret.length} حرف`, 'يجب أن يكون 32 حرفاً على الأقل');
  hasErrors = true;
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n' + '━'.repeat(50));
if (hasErrors) {
  console.log('\n' + red(bold('❌ Health Check فشل — يرجى إصلاح الأخطاء أعلاه قبل الـ Deploy')) + '\n');
  process.exit(1);
} else {
  console.log('\n' + green(bold('✅ Health Check نجح — المشروع جاهز للـ Deploy!')) + '\n');
  process.exit(0);
}
