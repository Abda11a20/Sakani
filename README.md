---
title: Sakani Backend
emoji: 🏠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# سكني — Sakani 🏠

<div align="center">

**ابحث بثقة، اسكن بأمان**  
*Find with confidence, live with peace of mind*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

</div>

---

## 📖 عن المشروع | About

**سكني** منصة تأجير عقارات مصرية متكاملة تربط بين المستأجرين والملاك بشكل آمن وشفاف.

**Sakani** is a comprehensive Egyptian real estate rental platform connecting tenants and landlords safely and transparently.

### المميزات | Features
- 🔍 بحث متقدم بفلاتر متعددة (المحافظة، السعر، النوع، الجنس المستهدف)
- 🏠 إعلانات شقق وغرف وأسرة مع صور حقيقية
- ✅ نظام توثيق هوية المستخدمين والملاك
- 💬 محادثات مباشرة بين المستأجرين والملاك عبر Pusher
- 🔔 تنبيهات ذكية عند توفر عقار مناسب
- 👑 لوحة تحكم إدارية متكاملة (Admin, Super Admin)
- 💳 دعم الاشتراكات المدفوعة عبر Paymob
- 🌍 دعم اللغتين العربية والإنجليزية (RTL/LTR)
- 🌙 الوضع المظلم والفاتح

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **UI Components** | Radix UI, Lucide Icons, next-themes |
| **i18n** | next-intl (Arabic + English, RTL support) |
| **State / Data** | TanStack Query v5, React Context |
| **Backend** | NestJS 11, TypeScript |
| **Database** | PostgreSQL 16 + Prisma 7 |
| **Authentication** | JWT (Access + Refresh Tokens), Passport.js |
| **Real-time** | Pusher (private channels per user) |
| **File Storage** | Cloudinary (images + ID cards with presigned URLs) |
| **Email** | Resend (OTP, notifications) |
| **Payments** | Paymob (subscription management) |
| **Security** | Helmet, Rate Limiting, bcrypt, AES-256 encryption |
| **Dev Tools** | Turborepo, ESLint, Prettier |
| **Deploy** | Vercel (Frontend) + Railway/Render (Backend) |

---

## 📁 هيكل المشروع | Project Structure

```
sakani/
├── apps/
│   ├── frontend/          # Next.js 14 App
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   └── package.json
│   └── backend/           # NestJS API
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── listings/
│       │   ├── requests/
│       │   ├── chat/
│       │   ├── admin/
│       │   └── ...
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
├── packages/
│   └── types/             # Shared TypeScript Types
├── turbo.json
└── package.json
```

---

## 🚀 Getting Started

### المتطلبات | Prerequisites

- **Node.js** v22+
- **PostgreSQL** v16
- **npm** v10+
- حساب **Cloudinary** (للصور)
- حساب **Pusher** (للمحادثات الحية)
- حساب **Resend** (للإيميلات)

### التثبيت | Installation

```bash
git clone https://github.com/your-username/sakani.git
cd sakani
npm install
```

### إعداد البيئة | Environment Setup

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local

# عدّل الملفات بالقيم الحقيقية
# Edit files with your actual values
```

### قاعدة البيانات | Database Setup

```bash
cd apps/backend

# تشغيل الـ migrations
npx prisma migrate dev --name init

# توليد الـ Prisma Client
npx prisma generate

# (اختياري) بيانات تجريبية
npx prisma db seed
```

### التشغيل المحلي | Local Development

```bash
# من الـ root (يشغل الكل مع بعض عبر Turborepo)
npm run dev

# أو تشغيل كل تطبيق منفرداً
npm run dev:backend    # الباك فقط  → http://localhost:3001
npm run dev:frontend   # الفرونت فقط → http://localhost:3000
```

---

## 📚 API Documentation

بعد تشغيل الباك إند، تجد Swagger UI على:

```
http://localhost:3001/api/docs
```

**Base URL:** `http://localhost:3001/api/v1`

### أهم الـ Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | تسجيل، دخول، OTP، Refresh Token |
| Users | `/users` | الملف الشخصي، الهوية، الصور |
| Listings | `/listings` | إعلانات العقارات CRUD |
| Search | `/search` | البحث المتقدم مع فلاتر |
| Requests | `/requests` | طلبات المعاينة |
| Chat | `/chat` | المحادثات الحية (Pusher) |
| Admin | `/admin` | لوحة تحكم المشرفين |
| Payments | `/payments` | الاشتراكات (Paymob) |
| Health | `/health` | فحص صحة الخادم |

---

## 🐳 Deploy

### Frontend — Vercel

```bash
# في Vercel Dashboard، أضف هذه المتغيرات:
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Backend — Railway

1. أنشئ مشروع جديد على [Railway](https://railway.app)
2. أضف **PostgreSQL** plugin
3. اربط الـ repo وحدد `apps/backend/Dockerfile`
4. أضف متغيرات البيئة من `.env.example`
5. Railway سيملأ `DATABASE_URL` تلقائياً

```bash
# بعد الـ Deploy، شغّل الـ migrations:
npx prisma migrate deploy
```

### Docker (Manual)

```bash
# Build
docker build -f apps/backend/Dockerfile -t sakani-backend .

# Run
docker run -p 3001:3001 --env-file apps/backend/.env sakani-backend
```

---

## 🔐 Security Features

- ✅ JWT Access Token (15 min) + Refresh Token (7 days)
- ✅ Rate Limiting (100 req/15min globally, 5 req/min for auth)
- ✅ Helmet HTTP headers
- ✅ bcrypt password hashing (12 rounds)
- ✅ AES-256 National ID encryption
- ✅ Presigned URLs for sensitive documents
- ✅ Role-based access control (tenant, landlord, admin, super_admin)
- ✅ IP banning + user banning system

---

## 📜 License

Private — All rights reserved © 2026 Sakani
