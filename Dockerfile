FROM docker.io/library/node:22-alpine

WORKDIR /app

# نسخ ملفات الباك إند بالكامل
COPY apps/backend/ .

# تثبيت الحزم
RUN npm install

# تخطي فحص قاعدة البيانات بنجاح أثناء البناء عبر متغير وهمي
ENV DATABASE_URL="postgresql://mock_user:mock_pass@localhost:5432/mock_db"
RUN npx prisma generate

# بناء المشروع الخاص بـ NestJS
RUN npm run build

# فتح المنفذ المبرمج عليه الكود داخلياً
EXPOSE 3001

# الأمر النهائي المضمون: يفحص مكان الملف ويشغله فوراً سواء كان في dist أو dist/src
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]