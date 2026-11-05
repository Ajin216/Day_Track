# DayTrack – Production Deployment Guide

This document contains step-by-step instructions for deploying the **DayTrack** MERN (MongoDB, Express, React, Node.js) application into a secure production environment.

---

## Table of Contents

1. [DayTrack Architecture Overview](#1-daytrack-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [MongoDB Atlas Setup Instructions](#3-mongodb-atlas-setup-instructions)
4. [Backend Environment Variables](#4-backend-environment-variables)
5. [Frontend Environment Variables](#5-frontend-environment-variables)
6. [Production Build Commands](#6-production-build-commands)
7. [Production Start Commands](#7-production-start-commands)
8. [CORS, CSRF, and Cookie Configuration](#8-cors-csrf-and-cookie-configuration)
9. [Health-Check and Monitoring](#9-health-check-and-monitoring)
10. [Production Security Checklist](#10-production-security-checklist)
11. [Common Deployment Errors & Troubleshooting](#11-common-deployment-errors--troubleshooting)
12. [Backup, Recovery, and Disaster Recovery](#12-backup-recovery-and-disaster-recovery)
13. [Deployment Execution Checklist](#13-deployment-execution-checklist)

---

## 1. DayTrack Architecture Overview

DayTrack is architected with a strict separation between client presentation and server persistence:

```
┌─────────────────────────────────┐       HTTPS / WSS        ┌──────────────────────────────────┐
│        Frontend (React 19)      │ ───────────────────────> │       Backend (Express / Node)   │
│  - Vite + Tailwind CSS v4       │   Credentials: include   │  - RESTful APIs (/api/*)         │
│  - React Router DOM v7 (SPA)    │                          │  - JWT in HTTP-Only Cookies      │
│  - Recharts & Date-fns          │                          │  - Helmet & Rate-Limiting        │
│  - Code-Split Dynamic Chunks    │ <─────────────────────── │  - CSRF & Strict Ownership       │
└─────────────────────────────────┘      Set-Cookie Token    └─────────────────┬────────────────┘
                                                                               │
                                                                       Mongoose│TLS
                                                                               ▼
                                                             ┌──────────────────────────────────┐
                                                             │     MongoDB Atlas (Database)     │
                                                             │  - Users & Tasks Collections     │
                                                             │  - DailyReviews Collection       │
                                                             │  - Compound Indexes (userId+date)│
                                                             └──────────────────────────────────┘
```

- **Frontend Client**: Static single-page application (SPA). Can be hosted on any static edge/CDN host (e.g. AWS CloudFront/S3, Cloudflare Pages, Netlify, Vercel, or served via Nginx/Express).
- **Backend API**: Node.js/Express server. Can run as a containerized service (Docker/Kubernetes, AWS ECS, Google Cloud Run) or PaaS service (Render, Railway, Heroku).
- **Database**: MongoDB Atlas cloud cluster with encryption-at-rest and transport encryption (TLS).

---

## 2. Prerequisites

Before starting the production deployment, verify the following are available:

- **Node.js**: Version `20.x` or `22.x` LTS.
- **npm**: Version `10.x` or higher.
- **MongoDB Atlas Account**: Free tier (M0) or dedicated production tier (M10+).
- **Domain Name & SSL/TLS**: Registered domain (or subdomain) with valid SSL certificates. Modern browser cookie policies require HTTPS for `SameSite=None; Secure`.
- **OpenSSL**: For generating cryptographically secure JWT secrets (`openssl rand -hex 32`).

---

## 3. MongoDB Atlas Setup Instructions

Follow these steps to configure a secure production MongoDB database:

### Step 3.1: Create an Atlas Cluster
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new organization and project (e.g. `DayTrack-Production`).
3. Deploy a new cluster:
   - For hobby/staging: Shared `M0` (Free).
   - For commercial production: Dedicated `M10` or higher with automated backup snapshots.
4. Select the cloud provider and cloud region closest to your backend hosting server (to minimize latency).

### Step 3.2: Create a Production Database User
1. Navigate to **Security** > **Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Set a strong, randomly generated username (e.g. `daytrack_app_prod`) and a 32+ character random password.
5. In **Database User Privileges**, select **Built-in Role** > **Read and write to any database** (or restrict specifically to the `daytrack` database: `readWrite@daytrack`).
6. Click **Add User**.
   > [!IMPORTANT]
   > Do NOT grant `atlasAdmin` permissions to the application runtime user. Follow the principle of least privilege.

### Step 3.3: Configure Network Access
1. Navigate to **Security** > **Network Access**.
2. Click **Add IP Address**.
3. Production best practice:
   - If your hosting platform provides static outbound IPs (e.g. AWS Elastic IPs, dedicated proxy), whitelist only those specific CIDR blocks.
   - If deploying to a dynamic PaaS provider (e.g. Render, Railway, Vercel Serverless), you may need to allow access from anywhere (`0.0.0.0/0`). Ensure you enforce strong user authentication, strict TLS, and VPC peering where available.

### Step 3.4: Obtain Connection String
1. In **Deployments** > **Database**, click **Connect** on your cluster.
2. Select **Drivers** (Node.js, version 5.5 or later).
3. Copy the SRV connection URI:
   ```text
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/daytrack?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials.
5. Append `/daytrack` before query parameters to ensure tasks and reviews are placed in the dedicated `daytrack` database.

### Step 3.5: Verify Database Indexes
DayTrack automatically registers required indexes via Mongoose schemas upon startup:
- `Task`: `{ userId: 1, date: 1 }`
- `DailyReview`: `{ userId: 1, date: 1 }` (unique constraint)
- `User`: `{ email: 1 }` (unique constraint)

---

## 4. Backend Environment Variables

Configure these environment variables in your backend hosting environment (or container secrets manager).

| Variable Name | Required | Default | Description / Example |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | **Yes** | `development` | Must be set to `production` in live environments. |
| `PORT` | Optional | `5000` | Port for Express HTTP server to listen on. Most PaaS platforms inject this automatically. |
| `MONGODB_URI` | **Yes** | — | Production MongoDB connection string (`mongodb+srv://...`). |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWTs. Must be $\ge 32$ characters in production. Generate with `openssl rand -hex 32`. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiration lifespan (e.g. `7d`, `24h`). |
| `CLIENT_URL` | **Yes** | — | Approved production frontend origin(s). E.g. `https://daytrack.app`. Multiple origins can be comma-separated: `https://daytrack.app,https://admin.daytrack.app`. |
| `TRUST_PROXY` | Optional | — | Set to `1` or `true` if backend runs behind reverse proxies (Render, AWS ALB, Cloudflare, Nginx) so client IP and HTTPS are detected accurately. |
| `COOKIE_SECURE` | Optional | `true` (in prod) | Enforces `Secure` flag on JWT cookies. Requires HTTPS. Set `false` only during local HTTP testing. |
| `COOKIE_SAMESITE`| Optional | `none` (in prod) | Cookie SameSite policy (`none`, `lax`, `strict`). Use `none` when frontend and backend domains differ. |
| `COOKIE_DOMAIN` | Optional | — | Parent domain if frontend and backend share subdomains (e.g. `.daytrack.app`). |

---

## 5. Frontend Environment Variables

Configure these variables at **build time** for the frontend:

| Variable Name | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `https://api.daytrack.app/api` | Full URL to the backend `/api` endpoint. If omitted in production, defaults to relative `/api`. |

> [!WARNING]
> Vite embeds variables prefixed with `VITE_` directly into client-side JavaScript. **NEVER** place database passwords, private keys, or `JWT_SECRET` in frontend environment variables.

---

## 6. Production Build Commands

### Frontend Production Build
To compile optimized, minified production assets:

```bash
# Navigate to frontend
cd frontend

# Install production dependencies cleanly
npm ci

# Run linter
npm run lint

# Build production assets
npm run build
```

Production output is generated in `frontend/dist/`:
- `index.html` (entry point)
- `_redirects` (SPA rewrite rule)
- `assets/vendor-react-*.js` (React framework bundle)
- `assets/vendor-recharts-*.js` (Recharts & D3 charting bundle)
- `assets/vendor-date-fns-*.js` (Date utility bundle)
- `assets/vendor-icons-*.js` (Lucide icons)
- Lazy chunks: `Analytics-*.js`, `Tasks-*.js`, `Calendar-*.js`, `Journal-*.js`, `Settings-*.js`

### Backend Preparation
```bash
# Navigate to backend
cd backend

# Install production dependencies cleanly (excluding devDependencies)
npm ci --omit=dev
```

---

## 7. Production Start Commands

### Backend Startup
```bash
cd backend
NODE_ENV=production node server.js
```

Or using npm:
```bash
npm start --prefix backend
```

Using a process manager (PM2) for resilience and multi-core clustering:
```bash
# Install pm2 globally or as a dev tool
npm install -g pm2

# Start backend with cluster mode and automatic restarts
pm2 start backend/server.js --name "daytrack-api" -i max --env NODE_ENV=production
```

### Static Frontend Serving
The `frontend/dist` directory contains static assets and can be hosted via:
- **Nginx**:
  ```nginx
  server {
      listen 443 ssl http2;
      server_name daytrack.app;

      root /var/www/daytrack/frontend/dist;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      location /api {
          proxy_pass http://127.0.0.1:5000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- **Vercel / Netlify**: Point root directory to `frontend`, build command `npm run build`, and publish directory `dist`.

---

## 8. CORS, CSRF, and Cookie Configuration

### Cross-Site vs. Same-Site Topologies

| Scenario | Frontend Domain | Backend Domain | Recommended Cookie Settings |
| :--- | :--- | :--- | :--- |
| **Unified Domain** | `https://daytrack.app` | `https://daytrack.app/api` (reverse proxy) | `COOKIE_SAMESITE=lax`<br>`COOKIE_SECURE=true` |
| **Shared Parent** | `https://app.daytrack.app` | `https://api.daytrack.app` | `COOKIE_SAMESITE=none` or `lax`<br>`COOKIE_DOMAIN=.daytrack.app`<br>`COOKIE_SECURE=true` |
| **Separate Domains** | `https://daytrack.netlify.app` | `https://daytrack-api.onrender.com` | `COOKIE_SAMESITE=none`<br>`COOKIE_SECURE=true` |

### Security Guarantees
1. **Credentials Support**: `cors` is configured with `credentials: true`. Arbitrary origins (`*`) are disallowed.
2. **CSRF Protection**: All cookie-authenticated mutations (`POST`, `PATCH`, `DELETE`) are verified against `CLIENT_URL` by `csrfMiddleware.js`.
3. **Bearer Token Support**: Automated testing and headless API integrations pass `Authorization: Bearer <token>`, bypassing cookie CSRF checks safely.

---

## 9. Health-Check and Monitoring

### Endpoint Specification
- **URL**: `GET /api/health`
- **Authentication**: Public (no credentials required)
- **Status Codes**:
  - `200 OK`: Database connected and backend fully operational.
  - `503 Service Unavailable`: Database disconnected or unreachable.

### Sample Response (`200 OK`)
```json
{
  "success": true,
  "status": "healthy",
  "message": "DayTrack Backend API is healthy and operational.",
  "database": "connected",
  "uptime": 86400,
  "environment": "production",
  "timestamp": "2026-11-04T12:00:00.000Z"
}
```

### Integration with Uptime Monitors
Configure external monitors (BetterStack, UptimeRobot, AWS Route53 Health Checks, Datadog) to ping `https://api.yourdomain.com/api/health` every 60 seconds expecting HTTP `200` with response body containing `"status":"healthy"`.

---

## 10. Production Security Checklist

- [ ] **HTTPS Enforced**: All traffic routed over TLS 1.3 / 1.2 with HSTS enabled.
- [ ] **Strong JWT Secret**: `JWT_SECRET` generated with at least 32 bytes of cryptographic randomness.
- [ ] **Environment Validation Active**: Startup verifies all required variables and fails fast if missing.
- [ ] **Credentials Sanitized**: No passwords or database strings exposed in logs or API responses.
- [ ] **Rate Limiting Active**:
  - Global API: 1,000 requests per 15 minutes per IP.
  - Auth routes (`/login`, `/register`): 50 requests per 15 minutes per IP.
- [ ] **Security Headers**: `helmet` enabled for XSS filter, frameguard (clickjacking prevention), and MIME-sniffing protection.
- [ ] **Strict CORS**: Only approved production `CLIENT_URL` origins allowed.
- [ ] **Git Exclusions Verified**: Real `.env` and `.env.production` files confirmed present in `.gitignore`.
- [ ] **Frontend Build Clean**: No private keys or database URLs bundled into `frontend/dist`.

---

## 11. Common Deployment Errors & Troubleshooting

### Issue 1: `CORS error / Access-Control-Allow-Origin blocked`
- **Symptom**: Frontend console reports preflight CORS failure when making API calls.
- **Cause**: The `CLIENT_URL` environment variable on the backend does not match the exact scheme and domain of the frontend (e.g. `http://` vs `https://`, missing trailing slash discrepancies, or missing subdomains).
- **Fix**: Set backend `CLIENT_URL=https://daytrack.app` (omit trailing slash). If using multiple domains, supply comma-separated URLs: `CLIENT_URL=https://daytrack.app,https://www.daytrack.app`.

### Issue 2: `Cookies not set in browser after login`
- **Symptom**: Login succeeds with 200 OK, but subsequent `/api/auth/me` or `/api/tasks` return 401 Unauthorized.
- **Cause**: Frontend and backend are hosted on different domains and the cookie lacks `SameSite=None; Secure`, or the request is transmitted over insecure HTTP.
- **Fix**: Ensure HTTPS is used on both frontend and backend. Verify backend environment has `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`.

### Issue 3: `404 on Page Refresh on Frontend`
- **Symptom**: Clicking links within the SPA works, but refreshing `/calendar` or `/tasks` returns 404 from the web server.
- **Cause**: The static file host is trying to locate `/calendar/index.html` on disk instead of delegating routing to the SPA `index.html`.
- **Fix**: Configure URL rewrites. DayTrack includes `frontend/public/_redirects` (`/* /index.html 200`) for Netlify/Cloudflare Pages. For Nginx, use `try_files $uri $uri/ /index.html;`.

### Issue 4: `MongoNetworkTimeoutError / connection buffered timed out`
- **Symptom**: Backend crashes on startup or `/api/health` returns 503.
- **Cause**: MongoDB Atlas Network Access IP Whitelist is blocking the backend's IP address.
- **Fix**: In MongoDB Atlas, add your server's public IP to **Network Access** > **IP Access List**.

---

## 12. Backup, Recovery, and Disaster Recovery

### 12.1. Automated Backups via MongoDB Atlas
1. In MongoDB Atlas, enable **Cloud Backups** in cluster settings.
2. Recommended retention policy:
   - Daily snapshots retained for 7 days.
   - Weekly snapshots retained for 4 weeks.
   - Monthly snapshots retained for 12 months.
3. Enable Point-in-Time Restore (PITR) if running on dedicated `M10+` tiers.

### 12.2. Manual Disaster Recovery Dump (`mongodump` & `mongorestore`)
To create an offline cold backup before applying schema changes or major updates:

```bash
# Export compressed archive
mongodump --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/daytrack" \
  --archive=daytrack_backup_$(date +%Y%m%d).gz --gzip

# Restore archive to target database
mongorestore --uri="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/daytrack" \
  --archive=daytrack_backup_20261104.gz --gzip --drop
```

---

## 13. Deployment Execution Checklist

When you are ready to select a hosting provider, follow this quick checklist:

1. [ ] **Database**: Create MongoDB Atlas cluster, database user, and network access rule.
2. [ ] **Secrets**: Generate a 32-byte secret: `openssl rand -hex 32`.
3. [ ] **Backend Service**:
   - Deploy backend code repository.
   - Set environment variables (`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `TRUST_PROXY=1`).
   - Run start command: `npm start --prefix backend`.
   - Verify health check: `curl -i https://<your-backend-domain>/api/health`.
4. [ ] **Frontend Service**:
   - Deploy frontend code repository.
   - Set build environment variable: `VITE_API_URL=https://<your-backend-domain>/api`.
   - Build command: `npm run build`.
   - Publish directory: `dist`.
   - Confirm SPA rewrites to `/index.html`.
5. [ ] **End-to-End Smoke Test**:
   - Open production frontend in browser.
   - Register a new account.
   - Create a task, mark as completed, create a daily journal review.
   - Refresh page to verify persistent authentication.
   - Log out and confirm cookie invalidation.

