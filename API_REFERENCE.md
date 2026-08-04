# Sakany Platform — Enterprise API Reference & Integration Guide

> **Production API Base URL:** `https://sakani-backend-production.up.railway.app/api/v1`  
> **Local Development API Base URL:** `http://localhost:3001/api/v1`  
> **Interactive Swagger Documentation:** `http://localhost:3001/api/docs`  
> **API Version:** `v1.1 (Production Hardened)`

---

## 📋 Table of Contents

1. [Global Architecture & Security Standards](#1-global-architecture--security-standards)
2. [Authentication & Session Management (`/auth`)](#2-authentication--session-management-auth)
3. [Users & Profile Management (`/users`)](#3-users--profile-management-users)
4. [Listings & Properties (`/listings`)](#4-listings--properties-listings)
5. [Beds & Room Occupancy (`/beds`)](#5-beds--room-occupancy-beds)
6. [Rental Requests (`/requests`)](#6-rental-requests-requests)
7. [Rental Contracts & History (`/rental-contracts`, `/rental-history`)](#7-rental-contracts--history-rental-contracts-rental-history)
8. [Search & Discovery Engine (`/search`)](#8-search--discovery-engine-search)
9. [Smart Saved Search Alerts (`/alerts`)](#9-smart-saved-search-alerts-alerts)
10. [Interactive Community System (`/community`, `/admin/community`)](#10-interactive-community-system-community-admincommunity)
11. [Ad Engine & Campaign System (`/ads`, `/admin/ads`)](#11-ad-engine--campaign-system-ads-adminads)
12. [Real-time Chat & Support (`/chat`, `/chat/pusher`)](#12-real-time-chat--support-chat-chatpusher)
13. [Notifications & Webhooks (`/notifications`, `/telegram`)](#13-notifications--webhooks-notifications-telegram)
14. [Payments, Billing & Subscriptions (`/payments`)](#14-payments-billing--subscriptions-payments)
15. [Media Uploads & Storage (`/uploads`)](#15-media-uploads--storage-uploads)
16. [Location Data Services (`/location`)](#16-location-data-services-location)
17. [Dashboard Analytics (`/dashboard`)](#17-dashboard-analytics-dashboard)
18. [Admin Panel & Governance (`/admin`)](#18-admin-panel--governance-admin)
19. [System Health Check (`/health`)](#19-system-health-check-health)
20. [Error Codes & HTTP Status Matrix](#20-error-codes--http-status-matrix)

---

## 1. Global Architecture & Security Standards

### Authentication Header
Protected endpoints require a standard JSON Web Token (JWT) sent in the HTTP Request Header:
```http
Authorization: Bearer <accessToken>
```

### Dual-Token Lifecycle Architecture
- **Access Token:** Short-lived JWT (default `15m`). Signed securely using `JWT_SECRET`.
- **Refresh Token:** High-entropy 64-byte random string stored securely in HTTP-Only Cookies / LocalStorage and hashed (`SHA-256`) in database `DeviceSession` records.
- **Silent Refresh Interceptor:** When an API request returns `401 Unauthorized`, the frontend interceptor automatically executes `POST /auth/refresh` to obtain a fresh `AccessToken` seamlessly.

### Common Response Schema
All JSON API endpoints return responses adhering to this standard wrapper:
```json
{
  "message": "Human readable status message",
  "data": { ... }
}
```

---

## 2. Authentication & Session Management (`/auth`)

Base path: `/auth`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/auth/register` | ❌ Public | Any | Register new account (Tenant or Landlord). Triggers OTP |
| `POST` | `/auth/verify-email` | ❌ Public | Any | Verify registration OTP code & activate account |
| `POST` | `/auth/login` | ❌ Public | Any | Authenticate with phone/email & password → returns tokens |
| `POST` | `/auth/refresh` | ❌ Public | Any | Obtain new `accessToken` using active `refreshToken` |
| `POST` | `/auth/logout` | ✅ Required | Any | Revoke current `DeviceSession` and clear client tokens |
| `GET` | `/auth/me` | ✅ Required | Any | Retrieve currently authenticated user context & permissions |
| `POST` | `/auth/forgot-password` | ❌ Public | Any | Request password reset OTP via Email or WhatsApp |
| `POST` | `/auth/verify-reset-otp` | ❌ Public | Any | Validate 6-digit reset OTP |
| `POST` | `/auth/reset-password` | ❌ Public | Any | Execute password update using valid OTP |
| `PATCH` | `/auth/change-password` | ✅ Required | Any | Change password while authenticated |

<details>
<summary><code>POST /auth/register</code> Payload Example</summary>

```json
{
  "name": "Ahmed Mohamed",
  "phone": "01012345678",
  "email": "ahmed@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "nationalId": "30001011234567",
  "role": "tenant"
}
```
</details>

---

## 3. Users & Profile Management (`/users`)

Base path: `/users`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/users/profile` | ✅ Required | Any | Get authenticated user's complete profile & stats |
| `PATCH` | `/users/profile` | ✅ Required | Any | Update bio, avatar, name, or phone number |
| `DELETE` | `/users/profile` | ✅ Required | Active User | Permanently request self-account deletion (banned users blocked) |
| `POST` | `/users/restore-account` | ❌ Public | Any | Request restoration of a soft-deleted account |
| `GET` | `/users/:id` | ❌ Public | Any | View public profile of a user/landlord |

---

## 4. Listings & Properties (`/listings`)

Base path: `/listings`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/listings` | ❌ Public | Any | Search & filter active approved property listings |
| `GET` | `/listings/my` | ✅ Required | Landlord | Fetch all properties owned by logged-in landlord |
| `GET` | `/listings/:id` | ❌ Public | Any | Get detailed view of a property listing |
| `POST` | `/listings` | ✅ Required | Landlord | Create a new property listing |
| `PATCH` | `/listings/:id` | ✅ Required | Landlord (Owner) | Edit listing details |
| `DELETE` | `/listings/:id` | ✅ Required | Landlord (Owner) | Soft-delete a property listing |

---

## 5. Beds & Room Occupancy (`/beds`)

Base path: `/beds` & `/listings/:listingId/beds`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/listings/:listingId/beds` | ❌ Public | Any | Fetch available bed slots in a listing |
| `GET` | `/listings/:listingId/beds/all` | ✅ Required | Landlord | Get all beds (occupied + vacant) |
| `GET` | `/listings/:listingId/beds/stats` | ✅ Required | Landlord | Get bed occupancy percentage & stats |
| `GET` | `/beds/:bedId` | ✅ Required | Any | Get single bed slot information |
| `PATCH` | `/beds/:bedId/rent` | ✅ Required | Landlord | Mark bed as occupied → auto-updates property status |
| `PATCH` | `/beds/:bedId/vacate` | ✅ Required | Landlord | Mark bed as vacant → restores property to search |
| `PATCH` | `/beds/:bedId/type` | ✅ Required | Landlord | Update bed slot price and specifications |

---

## 6. Rental Requests (`/requests`)

Base path: `/requests`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/requests` | ✅ Required | Tenant | Submit rental booking application for a property |
| `GET` | `/requests/my/tenant` | ✅ Required | Tenant | List all rental applications submitted by tenant |
| `GET` | `/requests/my/landlord` | ✅ Required | Landlord | List incoming applications for landlord properties |
| `GET` | `/requests/my/landlord/stats` | ✅ Required | Landlord | Summary stats of pending, accepted, and rejected requests |
| `GET` | `/requests/:id` | ✅ Required | Any Party | Get details of a single rental request |
| `PATCH` | `/requests/:id/status` | ✅ Required | Landlord | Accept or Reject a rental application |
| `DELETE` | `/requests/:id` | ✅ Required | Tenant | Cancel a pending rental application |

---

## 7. Rental Contracts & History (`/rental-contracts`, `/rental-history`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/rental-contracts/my` | ✅ Required | Tenant/Landlord | Fetch active rental agreements |
| `PATCH` | `/rental-contracts/:id/sign` | ✅ Required | Tenant/Landlord | Digitally sign rental agreement |
| `PATCH` | `/rental-contracts/:id/terminate` | ✅ Required | Landlord | Terminate active rental agreement |
| `GET` | `/rental-history/tenant` | ✅ Required | Tenant | Fetch historical past tenancy records |
| `GET` | `/rental-history/landlord` | ✅ Required | Landlord | Fetch historical tenant checkout records |

---

## 8. Search & Discovery Engine (`/search`)

Base path: `/search`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/search` | ❌ Public | Advanced search with filters (City, Price, Gender, Amenities) |
| `GET` | `/search/popular-districts` | ❌ Public | Top trending districts & search hotspots |
| `GET` | `/search/suggested/:listingId` | ❌ Public | Smart recommendation Engine (similar properties) |
| `GET` | `/search/price-stats` | ❌ Public | Price distribution & average rental cost metrics |

---

## 9. Smart Saved Search Alerts (`/alerts`)

Base path: `/alerts`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/alerts` | ✅ Required | Tenant | Create saved search alert criteria |
| `GET` | `/alerts/my` | ✅ Required | Tenant | Fetch saved property alerts |
| `PATCH` | `/alerts/:id` | ✅ Required | Tenant | Edit search alert criteria |
| `PATCH` | `/alerts/:id/toggle` | ✅ Required | Tenant | Enable or disable instant alert notifications |
| `DELETE` | `/alerts/:id` | ✅ Required | Tenant | Delete saved search alert |

---

## 10. Interactive Community System (`/community`, `/admin/community`)

Base path: `/community` & `/admin/community`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/community/categories` | ❌ Public | Any | List community post categories |
| `GET` | `/community/posts` | ❌ Public | Any | Browse community posts (with governorate/category filters) |
| `GET` | `/community/posts/:id` | ❌ Public | Any | View post details, comments, and members |
| `POST` | `/community/posts` | ✅ Required | Tenant/Landlord | Create a new community activity post |
| `POST` | `/community/posts/:id/join` | ✅ Required | Any | Join a community post activity group |
| `POST` | `/community/posts/:id/leave` | ✅ Required | Any | Leave a community post activity group |
| `POST` | `/community/posts/:id/comments` | ✅ Required | Any | Add a comment to a post |
| `POST` | `/community/posts/:id/report` | ✅ Required | Any | Report an inappropriate post |
| `GET` | `/admin/community/posts` | ✅ Required | Admin | Moderation list of community posts |
| `GET` | `/admin/community/reports` | ✅ Required | Admin | View reported community posts |
| `PATCH` | `/admin/community/posts/:id/status` | ✅ Required | Admin | Moderate post status (APPROVE, BLOCK, ARCHIVE) |

---

## 11. Ad Engine & Campaign System (`/ads`, `/admin/ads`)

Base path: `/ads` & `/admin/ads`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/ads/active` | ❌ Public | Any | Fetch active winning ad for slot via Smart Weighting Engine |
| `POST` | `/ads/:id/impression` | ❌ Public | Any | Asynchronously record ad view impression |
| `POST` | `/ads/:id/click` | ❌ Public | Any | Asynchronously record ad click event |
| `GET` | `/admin/ads/analytics` | ✅ Required | Admin | Super Admin Ad Engine Analytics & CTR Metrics |
| `GET` | `/admin/ads/advertisements` | ✅ Required | Admin | Manage all advertisement items |
| `POST` | `/admin/ads/advertisements` | ✅ Required | Admin | Create advertisement item |
| `PATCH` | `/admin/ads/advertisements/:id` | ✅ Required | Admin | Update advertisement controls & target |
| `DELETE` | `/admin/ads/advertisements/:id` | ✅ Required | Admin | Soft-delete advertisement |
| `GET` | `/admin/ads/campaigns` | ✅ Required | Admin | Manage advertising campaigns |
| `POST` | `/admin/ads/campaigns` | ✅ Required | Admin | Create advertising campaign |
| `PATCH` | `/admin/ads/campaigns/:id` | ✅ Required | Admin | Update campaign status/budget |
| `GET` | `/admin/ads/placements` | ✅ Required | Admin | List ad placement configurations |
| `PATCH` | `/admin/ads/placements/:id` | ✅ Required | Admin | Toggle placement slot status |
| `GET` | `/admin/ads/debug` | ✅ Required | Super Admin | Ad Engine Simulator & Exclusion Breakdown Tool |
| `POST` | `/admin/ads/toggle-setting` | ✅ Required | Super Admin | Global toggle for `adsEnabled` system setting |

---

## 12. Real-time Chat & Support (`/chat`, `/chat/pusher`)

Base path: `/chat`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/chat/send` | ✅ Required | Any | Send direct message or submit to Support Inbox |
| `GET` | `/chat/conversation/:userId` | ✅ Required | Any | Get paginated chat history with a user |
| `GET` | `/chat/support` | ✅ Required | Admin | View admin support inbox conversations |
| `PATCH` | `/chat/read/:senderId` | ✅ Required | Any | Mark messages from sender as read |
| `GET` | `/chat/unread-count` | ✅ Required | Any | Get unread messages counter |
| `POST` | `/chat/pusher/auth` | ✅ Required | Any | Authenticate private Pusher channels (`private-chat-user-{userId}`) |

---

## 13. Notifications & Webhooks (`/notifications`, `/telegram`)

Base path: `/notifications` & `/telegram`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/notifications` | ✅ Required | Any | Fetch user notifications (paginated) |
| `GET` | `/notifications/unread-count` | ✅ Required | Any | Get unread notifications badge counter |
| `PATCH` | `/notifications/read-all` | ✅ Required | Any | Mark all notifications as read |
| `PATCH` | `/notifications/:id/read` | ✅ Required | Any | Mark single notification as read |
| `GET` | `/notifications/push/vapid-key` | ❌ Public | Any | Get WebPush VAPID public key |
| `POST` | `/notifications/push/subscribe` | ✅ Required | Any | Register WebPush subscription payload |
| `POST` | `/telegram/webhook` | ❌ Public | Any | Telegram Bot Webhook endpoint for instant notifications |

---

## 14. Payments, Billing & Subscriptions (`/payments`)

Base path: `/payments`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/payments/plan` | ✅ Required | Landlord | Get active landlord subscription plan details |
| `POST` | `/payments/initiate` | ✅ Required | Landlord | Initiate Paymob payment checkout session |
| `POST` | `/payments/webhook` | ❌ Public | Service | Webhook callback handler from Paymob gateway |
| `GET` | `/payments/history` | ✅ Required | Landlord | Transaction history & billing invoices |
| `DELETE` | `/payments/subscription` | ✅ Required | Landlord | Cancel recurring landlord subscription |

---

## 15. Media Uploads & Storage (`/uploads`)

Base path: `/uploads`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/uploads/listings/:listingId/images` | ✅ Required | Landlord | Upload property images (`multipart/form-data`) |
| `DELETE` | `/uploads/images/:imageId` | ✅ Required | Landlord | Delete property image |
| `PATCH` | `/uploads/listings/:listingId/images/reorder` | ✅ Required | Landlord | Reorder gallery images |
| `POST` | `/uploads/id-card` | ✅ Required | Any | Upload National ID image for verification |
| `GET` | `/uploads/id-card/:userId` | ✅ Required | Admin | View user National ID image |
| `POST` | `/uploads/avatar` | ✅ Required | Any | Upload/update profile picture |

---

## 16. Location Data Services (`/location`)

Base path: `/location`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/location/governorates` | ❌ Public | Fetch Egyptian Governorates list |
| `GET` | `/location/cities/:governorateId` | ❌ Public | Fetch Cities/Districts for a Governorate |

---

## 17. Dashboard Analytics (`/dashboard`)

Base path: `/dashboard`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/dashboard/tenant/summary` | ✅ Required | Tenant | Tenant dashboard summary (wishlist, applications, alerts) |
| `GET` | `/dashboard/landlord/summary` | ✅ Required | Landlord | Landlord dashboard summary (occupancy, revenue, requests) |

---

## 18. Admin Panel & Governance (`/admin`)

Base path: `/admin`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/admin/dashboard/stats` | ✅ Required | Admin | Platform KPI stats & system health metrics |
| `GET` | `/admin/listings/pending` | ✅ Required | Admin | Moderation queue of listings pending approval |
| `PATCH` | `/admin/listings/:id/review` | ✅ Required | Admin | Approve or reject pending listing |
| `DELETE` | `/admin/listings/:id` | ✅ Required | Admin | Permanently purge violating listing |
| `GET` | `/admin/users` | ✅ Required | Admin | List all registered users (filterable) |
| `PATCH` | `/admin/users/:id/verify` | ✅ Required | Admin | Verify National ID & identity badge |
| `PATCH` | `/admin/users/:id/toggle-status` | ✅ Required | Admin | Activate or suspend user account |
| `PATCH` | `/admin/users/:id/role` | ✅ Required | Super Admin | Change user role (`TENANT`, `LANDLORD`, `ADMIN`, `SUPER_ADMIN`) |
| `POST` | `/admin/register-admin` | ✅ Required | Super Admin | Register new Admin account |
| `POST` | `/admin/ban` | ✅ Required | Admin | Ban user by Phone / National ID |
| `GET` | `/admin/banned` | ✅ Required | Admin | List blacklisted users |
| `DELETE` | `/admin/banned/:id` | ✅ Required | Super Admin | Lift user ban |
| `GET` | `/admin/banned-words` | ✅ Required | Admin | List automated content moderation banned words |
| `POST` | `/admin/banned-words` | ✅ Required | Admin | Add new banned word filter |
| `DELETE` | `/admin/banned-words/:id` | ✅ Required | Admin | Remove banned word filter |
| `GET` | `/admin/account-lifecycle/restorations` | ✅ Required | Admin | View pending account restoration requests |
| `POST` | `/admin/account-lifecycle/restore` | ✅ Required | Admin | Approve account restoration |

---

## 19. System Health Check (`/health`)

Base path: `/health`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ Public | Service health, DB latency, Memory & CPU metrics |

---

## 20. Error Codes & HTTP Status Matrix

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| `200 OK` | Request Succeeded | Normal query/fetch execution |
| `201 Created` | Created | Resource successfully initialized |
| `400 Bad Request` | Validation Failure | Invalid DTO format, missing required fields |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT token |
| `403 Forbidden` | Access Denied | Lacking role permissions or account is suspended/banned |
| `404 Not Found` | Resource Missing | Invalid ID or soft-deleted record |
| `409 Conflict` | Unique Key Conflict | Phone number or National ID already registered |
| `500 Server Error` | Internal Failure | Unexpected exception (monitored & logged) |

---

*Document Revision: August 2026 — Sakani Enterprise Core v1.1*
