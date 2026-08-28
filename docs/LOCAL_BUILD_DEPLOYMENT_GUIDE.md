# Master Guide: Local Build & Deploy to MilesWeb Hosting 🚀

This is the **fastest, most reliable, and industry-standard method** for deploying Next.js & NestJS applications to shared hosting (MilesWeb cPanel / mPanel).

By building on your local laptop, your server uses **0% CPU compiler overhead** and **starts instantly in <100ms** with zero memory or process limits (`EAGAIN` errors fixed!).

---

## Step 1: Build Applications Locally on Your Laptop

Open PowerShell / Terminal on your PC and execute:

```powershell
# 1. Build NestJS Backend
cd D:\cllient\cowork30\backend
npm run build

# 2. Build Next.js Frontend
cd D:\cllient\cowork30\frontend
npm run build
```

---

## Step 2: Upload Pre-Built Files to MilesWeb

Upload the following folders and files via **cPanel File Manager** or **FTP / SFTP**:

### A. Backend Files (`v1dev.cowork30.com/backend/`)
- `dist/` (contains pre-compiled `main.js`)
- `node_modules/`
- `prisma/`
- `scripts/`
- `package.json`
- `app.js`
- `.env` (contains `GLOBAL_PREFIX=""`)

### B. Frontend Files (`v1dev.cowork30.com/frontend/`)
- `.next/` (contains pre-compiled production HTML/CSS/JS)
- `public/`
- `node_modules/`
- `package.json`
- `next.config.ts`
- `.env` (contains `NEXT_PUBLIC_API_URL="https://v1dev.cowork30.com/api/v1"`)

---

## Step 3: MilesWeb mPanel App Configuration

In **MilesWeb Node Manager**:

### 1. Frontend App Configuration:
- **Directory**: `frontend`
- **Port**: `3000`
- **Proxy Path**: `/`
- **Startup Command**: `npm start`

### 2. Backend App Configuration:
- **Directory**: `backend`
- **Port**: `3001`
- **Proxy Path**: `api/v1`
- **Startup Command**: `npm run start:prod`

---

## Step 4: Click Restart & Verify!

Click **Restart** on both applications in mPanel:

- **Frontend Homepage**: `https://v1dev.cowork30.com` ➡️ Live & Blazing Fast!
- **Backend API**: `https://v1dev.cowork30.com/api/v1/branches` ➡️ Returns live JSON data!
- **Swagger API Docs**: `https://v1dev.cowork30.com/api/docs` ➡️ Interactive API docs!
