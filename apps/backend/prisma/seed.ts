// apps/backend/prisma/seed.ts

import { PrismaClient, UserRole, UnitType, ListingStatus, GenderTarget, ElectricityType, BedType, BedStatus, RequestStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { fakerAR as faker } from '@faker-js/faker';
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

  console.log('⏳ Cleaning database tables to ensure idempotency...');

  // 1. Delete in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.viewingRequest.deleteMany();
  await prisma.listingBed.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listingAuditLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.viewedListing.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleaned.');

  console.log('⏳ Seeding users (Admins, Landlords, Tenants)...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', saltRounds);
  const landlordPasswordHash = await bcrypt.hash('LandlordPassword123!', saltRounds);
  const tenantPasswordHash = await bcrypt.hash('TenantPassword123!', saltRounds);

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@sakani.eg',
      phone: '01000000000',
      passwordHash: adminPasswordHash,
      role: UserRole.super_admin,
      isActive: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      nationalIdVerified: true,
      identityStatus: 'VERIFIED',
    },
  });

  // Create Landlords (3)
  const landlords: any[] = [];
  const landlordNames = ['أحمد المنشاوي', 'سارة كريم', 'محمود عبد الرحمن'];
  const landlordPhones = ['01111111111', '01222222222', '01555555555'];
  const landlordEmails = ['landlord1@sakani.eg', 'landlord2@sakani.eg', 'landlord3@sakani.eg'];

  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        name: landlordNames[i],
        email: landlordEmails[i],
        phone: landlordPhones[i],
        passwordHash: landlordPasswordHash,
        role: UserRole.landlord,
        isActive: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        nationalIdVerified: true,
        identityStatus: 'VERIFIED',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=landlord_${i}`,
      },
    });
    landlords.push(user);
  }

  // Create Tenants (5)
  const tenants: any[] = [];
  const tenantNames = ['كريم ممدوح', 'نور الشربيني', 'مي علاء', 'يوسف حسن', 'رانيا مصطفى'];
  const tenantPhones = ['01011111111', '01022222222', '01033333333', '01044444444', '01055555555'];
  const tenantEmails = ['tenant1@sakani.eg', 'tenant2@sakani.eg', 'tenant3@sakani.eg', 'tenant4@sakani.eg', 'tenant5@sakani.eg'];

  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        name: tenantNames[i],
        email: tenantEmails[i],
        phone: tenantPhones[i],
        passwordHash: tenantPasswordHash,
        role: UserRole.tenant,
        isActive: true,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        nationalIdVerified: true,
        identityStatus: 'VERIFIED',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=tenant_${i}`,
      },
    });
    tenants.push(user);
  }

  console.log('✅ Users seeded successfully.');

  console.log('⏳ Seeding listings (apartments, rooms, beds)...');

  // Define location options for generating realistic addresses
  const locations = [
    { governorate: 'القاهرة', district: 'المعادي', address: 'شارع 9، المعادي بجوار محطة المترو', lat: 29.9602, lng: 31.2569 },
    { governorate: 'القاهرة', district: 'مدينة نصر', address: 'شارع عباس العقاد، مدينة نصر أمام جنينة مول', lat: 30.0609, lng: 31.3392 },
    { governorate: 'الجيزة', district: 'الدقي', address: 'شارع التحرير، الدقي بالقرب من جامعة القاهرة', lat: 30.0384, lng: 31.2115 },
    { governorate: 'الإسكندرية', district: 'سموحة', address: 'شارع فوزي معاذ، سموحة بجوار نادي سموحة', lat: 31.2089, lng: 29.9542 },
    { governorate: 'القاهرة', district: 'التجمع الخامس', address: 'شارع التسعين الشمالي، التجمع الخامس خلف الجامعة الأمريكية', lat: 30.0276, lng: 31.4913 },
    { governorate: 'الجيزة', district: 'المهندسين', address: 'شارع جامعة الدول العربية، المهندسين أمام نادي الصيد', lat: 30.0528, lng: 31.2023 },
    { governorate: 'القاهرة', district: 'مصر الجديدة', address: 'شارع الميرغني، مصر الجديدة بجوار قصر الاتحادية', lat: 30.0901, lng: 31.3225 },
    { governorate: 'الإسكندرية', district: 'جليم', address: 'شارع طريق الحرية، جليم بالقرب من البحر', lat: 31.2335, lng: 29.9658 },
  ];

  const listingTitles = [
    'شقة فاخرة للإيجار بالمعادي - عائلات فقط',
    'غرفة مكيفة هادئة للشباب بمدينة نصر',
    'سرير مشترك في شقة طالبات بالدقي',
    'شقة راقية ومفروشة بسموحة الإسكندرية',
    'سرير في سكن شباب راقي بالتجمع الخامس',
    'غرفة مفروشة للبنات بالمهندسين بجوار الخدمات',
    'شقة واسعة وممتازة بمصر الجديدة',
    'غرفة مزدوجة قريبة من البحر في جليم',
  ];

  const unitTypes = [
    UnitType.apartment,
    UnitType.room,
    UnitType.bed,
    UnitType.apartment,
    UnitType.bed,
    UnitType.room,
    UnitType.apartment,
    UnitType.room,
  ];

  const prices = [8000, 2500, 1500, 12000, 3000, 3500, 15000, 2000];
  const securityDeposits = [8000, 1000, 500, 12000, 1500, 2000, 15000, 1000];
  const genderTargets = [
    GenderTarget.family,
    GenderTarget.male,
    GenderTarget.female,
    GenderTarget.mixed,
    GenderTarget.male,
    GenderTarget.female,
    GenderTarget.family,
    GenderTarget.mixed,
  ];

  const statuses = [
    ListingStatus.active,
    ListingStatus.active,
    ListingStatus.active,
    ListingStatus.active,
    ListingStatus.active,
    ListingStatus.active,
    ListingStatus.pending_review,
    ListingStatus.draft,
  ];

  const amenities = [
    ['مصعد', 'حارس عقار', 'تكييف', 'إنترنت سريع', 'مطبخ كامل'],
    ['تكييف', 'إنترنت سريع', 'سخان مياه', 'غسالة ملابس'],
    ['إنترنت سريع', 'سخان مياه', 'غسالة ملابس', 'تليفزيون'],
    ['مصعد', 'حارس عقار', 'تكييف', 'إنترنت سريع', 'شرفة واسعة', 'أمن 24 ساعة'],
    ['إنترنت سريع', 'سخان مياه', 'تكييف', 'صالة ألعاب رياضية'],
    ['إنترنت سريع', 'سخان مياه', 'غسالة ملابس', 'ميكروويف'],
    ['مصعد', 'حارس عقار', 'تكييف', 'إنترنت سريع'],
    ['سخان مياه', 'غسالة ملابس', 'قريب من البحر'],
  ];

  const listings: any[] = [];

  for (let i = 0; i < 8; i++) {
    // Distribute among the 3 landlords
    const landlord = landlords[i % 3];
    const loc = locations[i];

    const listing = await prisma.listing.create({
      data: {
        landlordId: landlord.id,
        title: listingTitles[i],
        description: faker.lorem.paragraphs(2),
        unitType: unitTypes[i],
        price: prices[i],
        securityDeposit: securityDeposits[i],
        includesBills: faker.datatype.boolean(),
        electricityType: faker.helpers.arrayElement([ElectricityType.modern_meter, ElectricityType.prepaid_card, ElectricityType.old_meter]),
        genderTarget: genderTargets[i],
        governorate: loc.governorate,
        district: loc.district,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        status: statuses[i],
        amenities: amenities[i],
        roommateFeatureEnabled: unitTypes[i] !== UnitType.apartment,
        totalBeds: unitTypes[i] === UnitType.bed ? 4 : null,
        availableBeds: unitTypes[i] === UnitType.bed ? 4 : null,
      },
    });

    listings.push(listing);

    // Create realistic dummy image entries
    for (let imgIndex = 0; imgIndex < 3; imgIndex++) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          s3Key: `dummy/listing_${listing.id}_${imgIndex}.jpg`,
          url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
          order: imgIndex,
        },
      });
    }

    // For Bed listings, create individual Bed entries
    if (unitTypes[i] === UnitType.bed) {
      for (let bedNum = 1; bedNum <= 4; bedNum++) {
        await prisma.listingBed.create({
          data: {
            listingId: listing.id,
            bedNumber: bedNum,
            bedType: bedNum % 2 === 0 ? BedType.double : BedType.single,
            status: BedStatus.available,
          },
        });
      }
    }
  }

  console.log('✅ Listings and beds seeded successfully.');

  console.log('⏳ Seeding viewing requests...');

  // Active listings are indices 0 to 5
  const activeListings = listings.filter(l => l.status === ListingStatus.active);

  // Seed requests from tenants to listings
  const requestStatuses = [RequestStatus.pending, RequestStatus.accepted, RequestStatus.rejected, RequestStatus.completed];

  for (let i = 0; i < 6; i++) {
    const tenant = tenants[i % tenants.length];
    const listing = activeListings[i % activeListings.length];
    const status = requestStatuses[i % requestStatuses.length];

    await prisma.viewingRequest.create({
      data: {
        tenantId: tenant.id,
        listingId: listing.id,
        status: status,
        preferredDate: faker.date.future(),
        message: faker.helpers.arrayElement([
          'أريد معاينة الشقة في أقرب وقت ممكن لو تكرمت.',
          'هل الشقة متاحة للمعاينة يوم الجمعة القادم؟',
          'أنا طالب مغترب وأرغب في تأجير هذا السكن سريعاً.',
          'هل يمكن التفاوض البسيط في قيمة التأمين؟',
        ]),
      },
    });
  }

  console.log('✅ Viewing requests seeded.');

  console.log('⏳ Seeding reviews...');

  // Seed reviews for active listings
  for (let i = 0; i < 4; i++) {
    const tenant = tenants[i % tenants.length];
    const listing = activeListings[i % activeListings.length];

    await prisma.review.create({
      data: {
        tenantId: tenant.id,
        landlordId: listing.landlordId,
        listingId: listing.id,
        rating: faker.helpers.arrayElement([4, 5]),
        comment: faker.helpers.arrayElement([
          'شقة ممتازة ونظيفة جداً وصاحب العقار شخص محترم ومتعاون.',
          'مكان هادئ ومناسب للمذاكرة والخدمات قريبة جداً.',
          'تجربة سكن رائعة ومريحة، أنصح بها بشدة.',
          'الموقع ممتاز والشقة مطابقة تماماً للوصف والصور.',
        ]),
      },
    });
  }

  console.log('✅ Reviews seeded.');

  await prisma.$disconnect();
  await pool.end();

  console.log('🏁 Database seeding completed successfully! 🎉');
}

main().catch(e => {
  console.error('❌ Error seeding database:', e);
  process.exit(1);
});
