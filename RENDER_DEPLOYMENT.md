# Render Deployment Guide for Cowork30

## Prerequisites
- Push all code changes to your GitHub repository
- Have your database credentials ready (or use Render PostgreSQL)

---

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: `cowork30-db`
   - **Database**: `cowork30`
   - **User**: `cowork30`
   - **Region**: Choose closest to your users (e.g., Ohio or Frankfurt)
   - **Plan**: Free or Starter
4. Click **"Create Database"**
5. **Copy the "Internal Database URL"** (you'll need this for the backend)

---

## Step 2: Deploy Backend

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `cowork30-backend`
   - **Runtime**: `Node`
   - **Region**: Same as database
   - **Build Command**: `cd backend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `cd backend && npm run start:prod`
   - **Plan**: Free or Starter

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | |
   | `DATABASE_URL` | (paste Internal Database URL from Step 1) | Critical! |
   | `JWT_SECRET` | (generate a strong random string) | Use `openssl rand -base64 32` |
   | `FRONTEND_URL` | (your frontend URL, e.g., `https://cowork30.onrender.com`) | Update after frontend deploys |
   | `BACKEND_URL` | (your backend URL, e.g., `https://cowork30-backend.onrender.com`) | Update after backend deploys |
   | `RAZORPAY_KEY_ID` | `rzp_live_...` | From your Razorpay account |
   | `RAZORPAY_KEY_SECRET` | `...` | From your Razorpay account |
   | `SMTP_HOST` | `smtp.gmail.com` | Your email provider |
   | `SMTP_PORT` | `587` | |
   | `SMTP_USER` | `your-email@gmail.com` | |
   | `SMTP_PASS` | `your-app-password` | Gmail app password |

6. Click **"Create Web Service"**
7. Wait for deployment (first deploy takes 3-5 minutes)
8. **Copy the backend URL** (e.g., `https://cowork30-backend.onrender.com`)

---

## Step 3: Deploy Frontend

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `cowork30-frontend`
   - **Runtime**: `Node`
   - **Region**: Same as backend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`
   - **Plan**: Free or Starter

5. **Add Environment Variables**:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | |
   | `NEXT_PUBLIC_API_URL` | `https://cowork30-backend.onrender.com/api/v1` | **Use your actual backend URL** |

6. Click **"Create Web Service"**
7. Wait for deployment
8. **Copy the frontend URL** (e.g., `https://cowork30-frontend.onrender.com`)

---

## Step 4: Update Backend Environment Variables

1. Go to your backend service on Render
2. Click **"Environment"** tab
3. Update these variables with the actual URLs:
   - `FRONTEND_URL`: `https://cowork30-frontend.onrender.com`
   - `BACKEND_URL`: `https://cowork30-backend.onrender.com`
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Step 5: Run Database Migrations

1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend && npx prisma migrate deploy
   ```
4. Verify the output shows migrations applied successfully

---

## Step 6: Seed Database (Optional)

If you want initial data (branches, pricing plans, etc.):

1. In the Shell tab, run:
   ```bash
   cd backend && npx ts-node prisma/seed.ts
   ```

---

## Step 7: Verify Deployment

1. Visit your backend URL + `/health` (e.g., `https://cowork30-backend.onrender.com/health`)
2. You should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "checks": {
       "database": {
         "status": "healthy",
         "latencyMs": 123
       }
     }
   }
   ```
3. Visit your frontend URL
4. Test login/register functionality

---

## Important Notes

### Free Tier Limitations
- Free tier services **sleep after 15 minutes of inactivity**
- First request after sleep takes 30-50 seconds to wake up
- Consider upgrading to Starter ($7/month) for always-on

### Database Backups
- Render PostgreSQL free tier: No automatic backups
- Upgrade to paid plan for automated backups
- Or manually export: `pg_dump $DATABASE_URL > backup.sql`

### CORS Configuration
- The backend CORS is already configured to allow your frontend URL
- WebSocket CORS is also configured
- If you get CORS errors, update `FRONTEND_URL` in backend environment variables

### Environment Variables
- **Never commit `.env` files** to GitHub
- Use Render's environment variable dashboard for all secrets
- The `render.yaml` file is already in `.gitignore`

---

## Post-Deployment Checklist

- [ ] Backend health check returns `healthy`
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Desk booking works
- [ ] Meeting room booking works
- [ ] Payment flow works (test with Razorpay test mode first)
- [ ] Email notifications send correctly
- [ ] Admin panel accessible
- [ ] Staff panel accessible

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (Render uses Node 18+)

### Database Connection Fails
- Verify `DATABASE_URL` is set correctly
- Ensure database is in the same region as backend
- Check if database is still active (free tier may pause)

### CORS Errors
- Update `FRONTEND_URL` in backend environment variables
- Redeploy backend after changing env vars

### Prisma Migrations Fail
- Ensure `DATABASE_URL` is correct
- Check database is running
- Try running migrations manually via Shell

---

## Cost Estimate (Monthly)

- **Backend Web Service**: Free or $7 (Starter)
- **Frontend Web Service**: Free or $7 (Starter)
- **PostgreSQL Database**: Free or $7 (Starter)
- **Total**: $0 (Free tier) or $21/month (Starter tier with always-on)

**Recommendation**: Start with Free tier, upgrade to Starter once you have real users.
