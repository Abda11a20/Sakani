# Sakani API Documentation

> **Read-Only Reference** — All endpoints are served from `http://localhost:3001/api/v1`
>
> **Authentication:** Protected routes require a `Bearer` token in the `Authorization` header.
> Obtain a token from `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.
>
> **Interactive Docs:** Available at `http://localhost:3001/api/docs` (Swagger UI)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users & Profile](#2-users--profile)
3. [Listings](#3-listings)
4. [Beds](#4-beds)
5. [Requests (Rental Requests)](#5-requests-rental-requests)
6. [Reviews](#6-reviews)
7. [Search](#7-search)
8. [Alerts (Saved Searches)](#8-alerts-saved-searches)
9. [Uploads](#9-uploads)
10. [Payments & Subscriptions](#10-payments--subscriptions)
11. [Chat (Real-time Support)](#11-chat-real-time-support)
12. [Admin Panel](#12-admin-panel)
13. [Health Check](#13-health-check)

---

## 1. Authentication

Base path: `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ Public | Register a new user account (sends email OTP) |
| `POST` | `/auth/verify-email` | ❌ Public | Verify registration OTP and activate account |
| `POST` | `/auth/login` | ❌ Public | Login and receive a JWT access token |
| `POST` | `/auth/refresh` | ❌ Public | Refresh access token using current device session |
| `POST` | `/auth/logout` | ✅ Required | Logout and invalidate the current device session |
| `GET` | `/auth/me` | ✅ Required | Get the currently authenticated user's profile |
| `POST` | `/auth/forgot-password` | ❌ Public | Generate and send an OTP to the user's email or WhatsApp |
| `POST` | `/auth/verify-reset-otp` | ❌ Public | Verify the OTP validity (10-minute expiry window) |
| `POST` | `/auth/reset-password` | ❌ Public | Reset the password using a valid OTP |
| `PATCH` | `/auth/change-password` | ✅ Required | Change password while logged in |

### Request Body Examples

<details>
<summary><code>POST /auth/register</code></summary>

```json
{
  "name": "Ahmed Mohamed",
  "phone": "01012345678",
  "email": "ahmed@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "StrongPass123!",
  "nationalId": "30001011234567",
  "role": "tenant"
}
```
> `role` accepts: `"tenant"` | `"landlord"`
</details>

<details>
<summary><code>POST /auth/login</code></summary>

```json
{
  "phone": "01012345678",
  "password": "StrongPass123!"
}
```
</details>

<details>
<summary><code>POST /auth/forgot-password</code></summary>

```json
{
  "phone": "01012345678",
  "method": "email"
}
```
> `method` accepts: `"email"` | `"whatsapp"`
</details>

<details>
<summary><code>POST /auth/verify-reset-otp</code></summary>

```json
{
  "phone": "01012345678",
  "otp": "483920"
}
```
</details>

<details>
<summary><code>POST /auth/reset-password</code></summary>

```json
{
  "phone": "01012345678",
  "otp": "483920",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```
</details>

<details>
<summary><code>PATCH /auth/change-password</code></summary>

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```
</details>

---

## 2. Users & Profile

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/users/profile` | ✅ Required | Any | Get the authenticated user's full profile |
| `PATCH` | `/users/profile` | ✅ Required | Any | Update the authenticated user's profile |
| `DELETE` | `/users/profile` | ✅ Required | Any (not banned) | Permanently delete own account — **rejected with 403 if account is banned** |
| `GET` | `/users/:id` | ❌ Public | Any | Get the public profile of any user by ID |

> **Security rule:** Banned (inactive) users cannot self-delete. Only an admin can remove a banned account via `DELETE /admin/users/:id`.

---

## 3. Listings

Base path: `/listings`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/listings` | ✅ Required | Landlord | Create a new property listing |
| `GET` | `/listings/my` | ✅ Required | Landlord | Get all listings owned by the authenticated landlord |
| `GET` | `/listings` | ❌ Public | Any | Browse all approved listings (paginated & filterable) |
| `GET` | `/listings/:id` | ❌ Public | Any | Get details of a single listing |
| `PATCH` | `/listings/:id` | ✅ Required | Landlord (Owner) | Update a listing |
| `DELETE` | `/listings/:id` | ✅ Required | Landlord (Owner) | Delete own listing |

---

## 4. Beds

> **Inventory Logic:** When all beds in a listing are rented, the listing status automatically switches to `rented` and disappears from search. When a bed is vacated, the listing automatically returns to `active`.

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/listings/:listingId/beds` | ❌ Public | Any | Get available beds in a listing |
| `GET` | `/listings/:listingId/beds/all` | ✅ Required | Landlord | Get all beds (including rented) |
| `GET` | `/listings/:listingId/beds/stats` | ✅ Required | Landlord | Get bed occupancy statistics |
| `GET` | `/beds/:bedId` | ✅ Required | Any | Get details of a specific bed |
| `PATCH` | `/beds/:bedId/rent` | ✅ Required | Landlord | Mark a bed as rented → auto-updates listing status |
| `PATCH` | `/beds/:bedId/vacate` | ✅ Required | Landlord | Mark a bed as vacant → auto-restores listing to active |
| `PATCH` | `/beds/:bedId/type` | ✅ Required | Landlord | Update bed type/details |

---

## 5. Requests (Rental Requests)

Base path: `/requests`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/requests` | ✅ Required | Tenant | Submit a rental request for a listing |
| `GET` | `/requests/my/tenant` | ✅ Required | Tenant | Get all requests submitted by the authenticated tenant |
| `GET` | `/requests/my/landlord` | ✅ Required | Landlord | Get all incoming requests for the landlord's listings |
| `GET` | `/requests/my/landlord/stats` | ✅ Required | Landlord | Get request statistics |
| `GET` | `/requests/:id` | ✅ Required | Any | Get details of a specific request |
| `PATCH` | `/requests/:id/status` | ✅ Required | Landlord | Accept or reject a rental request |
| `DELETE` | `/requests/:id` | ✅ Required | Tenant | Cancel a pending request |

---

## 6. Reviews

Base path: `/reviews`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/reviews` | ✅ Required | Tenant | Submit a review for a listing or landlord |
| `GET` | `/reviews/listing/:listingId` | ❌ Public | Any | Get all reviews for a specific listing |
| `GET` | `/reviews/landlord/:landlordId` | ❌ Public | Any | Get all reviews for a specific landlord |
| `GET` | `/reviews/landlord/:landlordId/rating` | ❌ Public | Any | Get the aggregate rating of a landlord |
| `DELETE` | `/reviews/:id` | ✅ Required | Tenant (Author) | Delete a review |

---

## 7. Search

Base path: `/search`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/search` | ❌ Public | Search listings with filters |
| `GET` | `/search/popular-districts` | ❌ Public | Get most popular districts/neighborhoods |
| `GET` | `/search/suggested/:listingId` | ❌ Public | Get listings similar to a given one |
| `GET` | `/search/price-stats` | ❌ Public | Get min/max/average price statistics |

### Common Query Parameters for `GET /search`

| Param | Type | Description |
|-------|------|-------------|
| `city` | `string` | Filter by city name |
| `district` | `string` | Filter by district |
| `minPrice` | `number` | Minimum monthly price |
| `maxPrice` | `number` | Maximum monthly price |
| `type` | `string` | Listing type (`apartment`, `room`, `bed`) |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Results per page (default: 10) |

---

## 8. Alerts (Saved Searches)

Base path: `/alerts`  
**All endpoints require authentication and the `tenant` role.**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/alerts` | ✅ Tenant | Create a new saved search alert |
| `GET` | `/alerts/my` | ✅ Tenant | Get all saved alerts for the authenticated tenant |
| `PATCH` | `/alerts/:id` | ✅ Tenant | Update an existing alert |
| `PATCH` | `/alerts/:id/toggle` | ✅ Tenant | Enable or disable an alert |
| `DELETE` | `/alerts/:id` | ✅ Tenant | Delete an alert |

---

## 9. Uploads

Base path: `/uploads`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/uploads/listings/:listingId/images` | ✅ Required | Landlord | Upload listing images (`multipart/form-data`) |
| `DELETE` | `/uploads/images/:imageId` | ✅ Required | Landlord | Delete a specific listing image |
| `PATCH` | `/uploads/listings/:listingId/images/reorder` | ✅ Required | Landlord | Reorder listing images |
| `POST` | `/uploads/id-card` | ✅ Required | Any | Upload national ID card photo |
| `GET` | `/uploads/id-card/:userId` | ✅ Required | Admin | View a user's uploaded national ID card |
| `POST` | `/uploads/avatar` | ✅ Required | Any | Upload or update the user's profile avatar |

> **Note:** Image upload endpoints use `multipart/form-data` encoding, not JSON.

---

## 10. Payments & Subscriptions

Base path: `/payments`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/payments/plan` | ✅ Required | Landlord | Get active subscription plan details |
| `POST` | `/payments/initiate` | ✅ Required | Landlord | Initiate a new payment session |
| `POST` | `/payments/webhook` | ❌ Public | — | Webhook endpoint for Paymob payment provider |
| `GET` | `/payments/history` | ✅ Required | Landlord | Get all past payment transactions |
| `DELETE` | `/payments/subscription` | ✅ Required | Landlord | Cancel the active subscription |

---

## 11. Chat (Real-time Support)

Base path: `/chat`  
**All endpoints require authentication.**

> **Architecture:** Messages are persisted to the database first, then broadcast in real-time via Pusher. The frontend must subscribe to the appropriate Pusher channel to receive live messages.

### Pusher Channels

| Channel Name | Usage |
|---|---|
| `private-chat-user-{userId}` | Personal channel for a user to receive direct messages |
| `private-support` | General support messages with no specific receiver (admin inbox) |

### Pusher Event

| Event | Payload |
|---|---|
| `new-message` | `{ id, content, sender, receiverId, createdAt }` |

### Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/chat/send` | ✅ Required | Any | Send a message. Omit `receiverId` to send to admin support inbox |
| `GET` | `/chat/conversation/:userId` | ✅ Required | Any | Get paginated DM history with another user |
| `GET` | `/chat/support` | ✅ Required | Admin | View all support inbox messages |
| `PATCH` | `/chat/read/:senderId` | ✅ Required | Any | Mark all messages from a sender as read |
| `GET` | `/chat/unread-count` | ✅ Required | Any | Get total unread message count for current user |

### Request Body — `POST /chat/send`

```json
{
  "content": "Hello, I have a question about listing XYZ.",
  "receiverId": "optional-user-id"
}
```
> Omitting `receiverId` routes the message to the admin support channel.

---

## 12. Admin Panel

Base path: `/admin`  
**All endpoints require authentication and the `admin` or `super_admin` role.**

### Listings Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/listings/pending` | Admin | Get all listings awaiting review/approval |
| `PATCH` | `/admin/listings/:id/review` | Admin | Approve or reject a listing |
| `DELETE` | `/admin/listings/:id` | Admin | **Permanently** delete any fraudulent or violating listing |

### Users Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/users` | Admin | List all users (paginated, filterable by role) |
| `PATCH` | `/admin/users/:id/verify` | Admin | Verify a user's identity |
| `PATCH` | `/admin/users/:id/toggle-status` | Admin | Activate or deactivate a user account |
| `PATCH` | `/admin/users/:id/role` | **Super Admin only** | Change a user's role |
| `POST` | `/admin/users` | Admin | Manually create a new user account |
| `DELETE` | `/admin/users/:id` | Admin | **Permanently** delete any user (including banned users) |
| `POST` | `/admin/register-admin` | **Super Admin only** | Register a new admin account directly |

### Blacklist Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/admin/ban` | Admin | Ban a user from the platform |
| `GET` | `/admin/banned` | Admin | List all banned users |
| `DELETE` | `/admin/banned/:id` | **Super Admin only** | Lift a ban (unban a user) |

### Dashboard & Monitoring

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/dashboard/stats` | Admin | Get platform-wide statistics and KPIs |
| `GET` | `/admin/requests` | Admin | Monitor **all** rental requests on the platform (for dispute resolution) |

### Query Parameters — `GET /admin/requests`

| Param | Type | Description |
|-------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 10) |

---

## Response Format

All API responses follow this standard format:

```json
{
  "message": "Human-readable status message",
  "data": { "..." : "..." }
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created successfully |
| `400` | Bad Request — Invalid input or business rule violation |
| `401` | Unauthorized — Missing or invalid JWT token |
| `403` | Forbidden — Authenticated but lacking required role or account is banned |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate resource (e.g., phone already registered) |
| `500` | Internal Server Error — Unexpected server-side error |

---

## 13. Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ Public | Check service health including database connectivity |

<details>
<summary><code>GET /health</code> — Response Example</summary>

```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "latencyMs": 3
  },
  "uptime": 12345,
  "version": "1.0.0",
  "timestamp": "2026-06-24T01:00:00.000Z"
}
```
</details>

---

*Last updated: June 2026 — Sakani Backend v1.1 (Security Hardening v4 — Enterprise Edition)*
