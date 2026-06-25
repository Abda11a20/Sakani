FROM docker.io/library/node:22-alpine

WORKDIR /app

# نسخ ملفات الباك إند بالكامل من المجلد الداخلي
COPY apps/backend/ .

# تثبيت الحزم بنجاح
RUN npm install

# توليد ملفات Prisma مع تمرير رابط وهمي مؤقت لتخطي فحص البناء بنجاح
RUN DATABASE_URL="postgresql://mock_user:mock_pass@localhost:5432/mock_db" npx prisma generate

# بناء المشروع الخاص بـ NestJS
RUN npm run build

# فتح المنفذ المبرمج عليه الكود داخلياً
EXPOSE 3001

# أمر التشغيل النهائي للإنتاج
CMD ["npm", "run", "start:prod"]