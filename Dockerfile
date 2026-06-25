FROM docker.io/library/node:22-alpine

WORKDIR /app

# نسخ ملفات الباك إند بالكامل من المجلد الداخلي
COPY apps/backend/ .

# تثبيت الحزم وبناء المشروع الخاص بـ NestJS وقاعدة البيانات
RUN npm install
RUN npx prisma generate
RUN npm run build

# فتح المنفذ المبرمج عليه الكود داخلياً
EXPOSE 3001

# أمر التشغيل النهائي للإنتاج
CMD ["npm", "run", "start:prod"]