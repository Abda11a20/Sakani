# 🏠 Sakany (سكني) - Premier Egyptian Housing & Rental Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescript.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Sakany (سكني)** is an end-to-end Egyptian property and shared-housing platform designed specifically for students, young professionals, and property owners. It bridges the gap between tenants and landlords by offering shared room/bed rentals, full apartment listings, student community networking, real-time live support, and automated vacancy management.

---

## ⚡ Quick Start (5-Minute Developer Setup)

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v16.x` running locally on port `5432`

### 2. Environment Setup
Clone the repository and prepare your environment variables:

```bash
# Clone the repository
git clone https://github.com/your-org/sakani.git
cd sakani

# Create backend .env file
cp apps/backend/.env.example apps/backend/.env

# Create frontend .env.local file
cp apps/frontend/.env.example apps/frontend/.env.local
```

Ensure your `apps/backend/.env` contains PostgreSQL connection details:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/sakani_db?schema=public"
JWT_SECRET="super-secret-jwt-key"
JWT_REFRESH_SECRET="super-secret-refresh-key"
PORT=4000
```

### 3. Install & Seed Database
```bash
# Install dependencies across Turborepo workspaces
npm install

# Run Prisma migrations & seed default categories/admin
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
cd ../..
```

### 4. Run Development Servers
```bash
# Run both Frontend (port 3000) and Backend (port 4000) concurrently
npm run dev

# Or run separately:
npm run dev:frontend
npm run dev:backend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack & Key Technologies

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router, Server & Client Components) |
| **Language & Styling** | TypeScript 5.x, Tailwind CSS, Lucide Icons |
| **Internationalization** | `next-intl` (Arabic `ar` & English `en` with RTL/LTR support) |
| **State & Data Fetching** | TanStack React Query v5, React Hook Form, Zod validation |
| **Backend Framework** | NestJS (Modular Architecture, Controllers, Providers, Guards) |
| **ORM & Database** | Prisma ORM, PostgreSQL 16 DB |
| **Realtime & Storage** | Pusher WebSocket, Cloudinary SDK |
| **Monorepo Engine** | Turborepo |

---

## 📂 Repository Structure Overview

```text
sakani/
├── apps/
│   ├── frontend/                # Next.js 14 Application
│   │   ├── messages/            # i18n Dictionaries (ar.json, en.json)
│   │   ├── src/
│   │   │   ├── app/[locale]/    # App Router (Home, Search, Dashboard, Admin, Community)
│   │   │   ├── components/      # Reusable UI & Layout Components
│   │   │   ├── features/        # Feature Modules (Auth, Listings, Search, Chat, etc.)
│   │   │   ├── hooks/           # Custom React & React Query Hooks
│   │   │   └── lib/             # Utilities, Constants, & Formatter Helpers
│   └── backend/                 # NestJS Application
│       ├── prisma/              # Schema definition, Migrations, Seeders
│       └── src/
│           ├── auth/            # JWT Auth, Refresh Tokens, Identity Verification
│           ├── listings/        # Apartment & Bed Listings Management
│           ├── requests/        # Viewing Requests & Rental Contracts
│           ├── users/           # User Profiles & Account Lifecycle
│           ├── community/       # Community Events, Posts & Reports
│           └── chat/            # Live Support & P2P Realtime Chat
├── packages/                    # Shared Types, Configs & UI Tokens
├── README.md                    # Quick Start & Developer Overview (This File)
├── PROJECT_DOCUMENTATION.md     # Comprehensive 20-Section Technical Master Manual
└── ARCHITECTURE.md              # Diagrams, ER Models, & Flowcharts
```

---

## 📜 Key NPM Commands

```bash
npm run dev           # Starts both frontend and backend concurrently via Turbo
npm run build         # Builds production bundles for all apps
npm run lint          # Runs ESLint checks across workspace
npm run dev:frontend  # Launches Next.js frontend only (http://localhost:3000)
npm run dev:backend   # Launches NestJS backend only (http://localhost:4000)
```

---

## 🏛️ Core Architectural Rules

1. **i18n String Safety:** Zero hardcoded translatable strings in JSX. All UI labels must consume keys from `messages/ar.json` and `messages/en.json` via `useTranslations()`.
2. **Logic Protection:** Component state, Tailwind CSS utility classes, React hooks, and API contracts must remain strictly decoupled from localization logic.
3. **Database & API Safety:** Never alter Prisma models or NestJS DTOs without writing formal migrations and updating TypeScript interface contracts across frontend features.

---

## 📖 Complete Documentation Links

- [PROJECT_DOCUMENTATION.md](file:///c:/Users/pc/Desktop/Sakany/sakani/PROJECT_DOCUMENTATION.md) — 20-Section Deep Technical Manual
- [ARCHITECTURE.md](file:///c:/Users/pc/Desktop/Sakany/sakani/ARCHITECTURE.md) — Diagrams, System Architecture, & Database Models
- [API_REFERENCE.md](file:///c:/Users/pc/Desktop/Sakany/sakani/API_REFERENCE.md) — REST API Endpoints & Request/Response Contracts

---

## 📄 License

This project is proprietary software developed for Sakany Platform. All rights reserved.
