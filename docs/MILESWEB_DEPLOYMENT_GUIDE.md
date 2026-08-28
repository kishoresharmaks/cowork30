# MilesWeb mPanel Deployment Guide — Available Ports (3000 - 3020)

This guide provides step-by-step instructions to deploy the **Cowork30 Enterprise Platform** using MilesWeb mPanel available ports (`3000` to `3020`):

- **Frontend Website**: Port `3000` (`https://v1dev.cowork30.com`)
- **Backend API**: Port `3001` (`https://v1dev.cowork30.com/api/v1`)
- **Swagger Documentation**: `https://v1dev.cowork30.com/api/docs`

---

## 🗄️ Step 1: Create MySQL Database in mPanel

1. Log into **MilesWeb mPanel**.
2. Go to **Databases ➡️ MySQL Databases**.
3. Under **Create Database**, enter: `v1dev_cowork30` ➡️ Click **Create Database**.
4. Under **Add User**, enter:
   - Username: `v1dev_dbuser`
   - Password: Enter a strong password (e.g. `MilesWebPassword2026!`).
5. Under **Add User to Database**, select `v1dev_dbuser` and `v1dev_cowork30`, click **Add**, check **ALL PRIVILEGES**, and click **Save Changes**.

> 💡 **Database Connection String**:  
> `DATABASE_URL="mysql://cpaneluser_v1dev_dbuser:MilesWebPassword2026!@localhost:3306/cpaneluser_v1dev_cowork30"`

---

## ⚙️ Step 2: Deploy Backend App on Port 3001

1. Create `.env` file in `v1dev.cowork30.com/backend/.env`:

   ```env
   PORT=3001
   NODE_ENV=production
   DATABASE_URL="mysql://cpaneluser_v1dev_dbuser:MilesWebPassword2026!@localhost:3306/cpaneluser_v1dev_cowork30"
   JWT_SECRET="prod_cowork30_milesweb_jwt_secret_token_v1dev_987654321"
   FRONTEND_URL="https://v1dev.cowork30.com"
   RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
   SMTP_HOST="mail.v1dev.cowork30.com"
   SMTP_PORT=465
   SMTP_USER="no-reply@v1dev.cowork30.com"
   SMTP_PASSWORD="YourEmailPassword2026"
   ```

2. Open **Manage Node** in mPanel ➡️ Click **Deploy Node App**:
   - **Mode**: `Automatic (Production)`
   - **Node Version**: `26.7.0` (or `20.x`)
   - **Working directory**: `v1dev.cowork30.com/backend`
   - **Startup command**: `npm run start:prod`
   - **Proxy enabled**: Toggle **ON**
   - **Path**: `api` (or `api/v1`)
   - **Port**: `3001` *(Selected from mPanel dropdown)*
   - **Allow web socket proxy upgrade**: **CHECKED** `[x]`
3. Click **Deploy Node App**.

---

## 🗃️ Step 3: Run Database Migrations & Compile Backend

Open mPanel **SSH / Terminal** and run:

```bash
cd ~/v1dev.cowork30.com/backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Then click **Restart App** for the backend in mPanel Node Manager.

---

## 🎨 Step 4: Deploy Frontend App on Port 3000

1. Create `.env.production` file in `v1dev.cowork30.com/frontend/.env.production`:
   ```env
   NEXT_PUBLIC_API_URL="https://v1dev.cowork30.com/api/v1"
   ```

2. In mPanel **Manage Node**, click **Deploy Node App** for Frontend:
   - **Mode**: `Automatic (Production)`
   - **Node Version**: `26.7.0` (or `20.x`)
   - **Working directory**: `v1dev.cowork30.com/frontend`
   - **Startup command**: `npm start`
   - **Proxy enabled**: Toggle **ON**
   - **Path**: *(Leave completely BLANK to proxy root domain `v1dev.cowork30.com`)*
   - **Port**: `3000` *(Selected from mPanel dropdown)*
   - **Allow web socket proxy upgrade**: **CHECKED** `[x]`
3. Click **Deploy Node App**.

4. In mPanel **SSH / Terminal**, run:
   ```bash
   cd ~/v1dev.cowork30.com/frontend
   npm install
   npm run build
   ```
   Then click **Restart App** for the frontend in mPanel Node Manager.

---

## 🔒 Step 5: Enable Free SSL Certificate

In mPanel, open **SSL Certificates / AutoSSL** ➡️ Issue Let's Encrypt SSL for `v1dev.cowork30.com`.

---

## ✅ Final Verification Checklist

| Target Endpoint | Port | Expected Result |
| :--- | :--- | :--- |
| **API Root** (`https://v1dev.cowork30.com/api/v1`) | `3001` | `{"success": true, "message": "🚀 Cowork30 Enterprise Platform API v1 is active and running"}` |
| **Swagger Docs** (`https://v1dev.cowork30.com/api/docs`) | `3001` | Interactive Swagger API Documentation loads |
| **Frontend Portal** (`https://v1dev.cowork30.com`) | `3000` | Complete website loads with live branches, pricing, and member booking |
