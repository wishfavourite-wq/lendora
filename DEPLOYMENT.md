# Lendora — Deployment Guide (Option A: Fully Free)

## Final Architecture

```
Anyone with a browser
        │
        ▼
┌───────────────────────┐
│  Vercel               │  ← Next.js 15 Frontend
│  (FREE forever)       │  ← URL: https://lendora-xxx.vercel.app
└──────────┬────────────┘
           │ HTTPS API calls
           ▼
┌───────────────────────┐
│  Railway              │  ← Express.js API  ($5 free credit/month)
│  (FREE ~30 days)      │  ← URL: https://lendora-api.up.railway.app
└──────────┬────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌────────────┐
│ Railway │  │ Cloudinary │  ← MySQL DB + Image Storage
│  MySQL  │  │  (FREE)    │  ← Both free
└─────────┘  └────────────┘
```

**Total cost: $0** for the duration of your university defense.

---

## What You Need Before Starting

- [ ] Gmail account (you already have `buisnessmailpro@gmail.com`)
- [ ] GitHub account — create one free at github.com
- [ ] Your project folder: `c:\xampp\htdocs\lendora`

Everything else is created during the steps below.

---

## PHASE 1 — Set Up Accounts (15 minutes)

### Step 1.1 — Cloudinary (Image Storage)

1. Go to **https://cloudinary.com** → click **Sign Up For Free**
2. Fill in your details → Verify your email
3. On the dashboard, you will see three values — **write them down:**

```
Cloud Name:  drftwqcax
API Key:     972369438143758
API Secret:  BjMx003PltdJNkXiFEtTM5ySUZ4
```

That's all for Cloudinary for now.

---

### Step 1.2 — Railway Account

1. Go to **https://railway.app** → click **Login** → **Login with GitHub**
2. Authorise Railway to access your GitHub
3. You are now inside the Railway dashboard

---

### Step 1.3 — Vercel Account

1. Go to **https://vercel.com** → click **Sign Up** → **Continue with GitHub**
2. Select **Hobby** (free plan) → Continue
3. You are now inside the Vercel dashboard

---

## PHASE 2 — Push Code to GitHub (10 minutes)

### Step 2.1 — Create .gitignore

Create (or update) the file `c:\xampp\htdocs\lendora\.gitignore` and make sure it contains:

```
# Dependencies
node_modules/

# Environment files — NEVER commit these
.env
.env.local
.env.production

# Build output
dist/
.next/
.turbo/

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db
```

### Step 2.2 — Create a GitHub Repository

1. Go to **https://github.com** → click the **+** button top-right → **New repository**
2. Repository name: `lendora`
3. Visibility: **Public** (required for free Railway + Vercel)
4. Do NOT add README or .gitignore (you already have them)
5. Click **Create repository**
6. GitHub shows you commands — copy your repo URL, it looks like:
   `https://github.com/YOUR_USERNAME/lendora.git`

### Step 2.3 — Push Your Code

Open a terminal in `c:\xampp\htdocs\lendora` and run:

```bash
git init
git add .
git commit -m "feat: production-ready Lendora"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lendora.git
git push -u origin main
```

> If git push asks for a password, use a **GitHub Personal Access Token** (not your password).
> Create one at: github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → check **repo** scope.

---

## PHASE 3 — Set Up Railway Database + API (20 minutes)

### Step 3.1 — Create Railway Project

1. In Railway dashboard → click **New Project**
2. Select **Empty Project**
3. Name it: `lendora`

### Step 3.2 — Add MySQL Database

1. Inside your Railway project → click **+ Add Service**
2. Select **Database** → **MySQL**
3. Railway creates a MySQL instance automatically (takes ~1 minute)
4. Click on the MySQL service → click the **Variables** tab
5. You will see `MYSQL_URL` — click the copy icon. It looks like:
   ```
   mysql://root:PASSWORD@monorail.proxy.rlwy.net:PORT/railway
   mysql:/root:cRongrxQqrHfVNwVhoQIjWCvhEXnkHQe@mysql.railway.internal:3306/railway
   ```
6. **Write this down** — this is your `DATABASE_URL`

### Step 3.3 — Run Database Migration (from your computer)

Update `c:\xampp\htdocs\lendora\packages\database\.env` with your Railway MySQL URL:

```env
DATABASE_URL="mysql://root:PASSWORD@monorail.proxy.rlwy.net:PORT/railway"
DATABASE_DIRECT_URL="mysql://root:PASSWORD@monorail.proxy.rlwy.net:PORT/railway"
```

Now open a terminal in `c:\xampp\htdocs\lendora` and run:

```bash
pnpm --filter @lendora/database run db:generate
pnpm --filter @lendora/database run db:migrate
pnpm --filter @lendora/database run db:seed
```

You should see:
```
🌱 LENDORA — Database Seed
  ✓ Categories seeded
  ✓ 5 users + 2 vendor profiles
  ✓ 8 products seeded
✅ Seed complete
```

This creates all 15 database tables and the demo accounts.

### Step 3.4 — Deploy API on Railway

1. Inside your Railway project → click **+ Add Service**
2. Select **GitHub Repo** → select your `lendora` repository
3. Railway auto-detects the `railway.toml` file and sets build/start commands

4. Click the service → go to **Settings** tab:
   - **Service Name**: `lendora-api`
   - Confirm **Root Directory** is empty (uses repo root)

5. Go to **Variables** tab → click **+ Add Variable** for each:

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `API_PORT` | `4000` |
| `DATABASE_URL` | *(your Railway MySQL URL from Step 3.2)* |
| `DATABASE_DIRECT_URL` | *(same MySQL URL)* |
| `APP_URL` | `https://lendora-xxx.vercel.app` *(fill after Phase 4)* |
| `SERVER_URL` | `https://lendora-api.up.railway.app` *(your Railway URL — see below)* |
| `FRONTEND_URL` | `https://lendora-xxx.vercel.app` *(fill after Phase 4)* |
| `JWT_ACCESS_SECRET` | *(generate — see tip below)* |
| `JWT_REFRESH_SECRET` | *(generate — different value)* |
| `COOKIE_SECRET` | *(generate — different value)* |
| `CLOUDINARY_CLOUD_NAME` | *(from Step 1.1)* |
| `CLOUDINARY_API_KEY` | *(from Step 1.1)* |
| `CLOUDINARY_API_SECRET` | *(from Step 1.1)* |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `buisnessmailpro@gmail.com` |
| `SMTP_PASS` | *(Gmail App Password — see below)* |
| `SMTP_FROM` | `Lendora <buisnessmailpro@gmail.com>` |
| `LOG_LEVEL` | `info` |

**How to generate JWT secrets** — run this in any terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run it 3 times to get 3 different secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`.

**How to get Gmail App Password:**
1. Go to **myaccount.google.com** → Security
2. Enable **2-Step Verification** if not already on
3. Go to **App Passwords** (search for it in the search bar)
4. Select **Mail** → device **Other** → type `Lendora` → click Generate
5. Copy the 16-character password → paste as `SMTP_PASS`

6. Go to **Settings** → **Networking** → **Generate Domain**
   - Copy the public URL — it looks like: `lendora-api.up.railway.app`
   - Put this URL as your `SERVER_URL` variable value

7. Railway will automatically deploy (~3-5 minutes)

8. **Test the API** — open in your browser:
   ```
   https://lendora-api.up.railway.app/health
   ```
   You should see: `{"status":"ok","uptime":...}`

---

## PHASE 4 — Deploy Frontend on Vercel (10 minutes)

### Step 4.1 — Deploy

1. Go to **https://vercel.com/dashboard** → click **Add New** → **Project**
2. Click **Import** next to your `lendora` GitHub repository
3. Configure the project:

   | Setting | Value |
   |---------|-------|
   | **Project Name** | `lendora` |
   | **Framework Preset** | Next.js *(auto-detected)* |
   | **Root Directory** | `frontend` ← **important!** |
   | **Node.js Version** | `20.x` |

4. Expand **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://lendora-api.up.railway.app/api/v1` |
   | `NEXT_PUBLIC_API_HOST` | `lendora-api.up.railway.app` |

5. Click **Deploy**
6. Wait ~3 minutes for the build to finish
7. Vercel gives you a URL like: `https://lendora-abc.vercel.app`

### Step 4.2 — Update Railway with Your Vercel URL

1. Go back to **Railway** → your `lendora-api` service → **Variables**
2. Update these two variables:
   - `APP_URL` → `https://lendora-abc.vercel.app`
   - `FRONTEND_URL` → `https://lendora-abc.vercel.app`
3. Railway automatically redeploys when you save variables

---

## PHASE 5 — Test Everything (5 minutes)

Open your Vercel URL in a browser and test:

### Test 1 — Home page loads
Visit `https://lendora-abc.vercel.app` — you should see the Lendora marketplace homepage with products.

### Test 2 — Login as Admin
- Email: `admin@lendora.com.bd`
- Password: `Password123!`
- Should redirect to the admin dashboard

### Test 3 — Login as Seller
- Email: `rahul.photo@gmail.com`
- Password: `Password123!`
- Should show the vendor dashboard with products listed

### Test 4 — Login as Customer
- Email: `karim.renter@gmail.com`
- Password: `Password123!`
- Should show the customer dashboard

### Test 5 — Browse and rent
- Log in as Customer → browse products → click a product → click Rent

---

## Demo Accounts for Project Defense

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Admin** | `admin@lendora.com.bd` | `Password123!` | Full admin panel access |
| **Seller (Vendor) 1** | `rahul.photo@gmail.com` | `Password123!` | Rahul Ahmed — Photography Studio, 127 rentals |
| **Seller (Vendor) 2** | `fatema.events@gmail.com` | `Password123!` | Fatema Begum — Event Solutions, 89 rentals |
| **Customer 1** | `karim.renter@gmail.com` | `Password123!` | Abdul Karim |
| **Customer 2** | `nadia.renter@gmail.com` | `Password123!` | Nadia Islam |

---

## Your Public URLs (fill after deployment)

```
Frontend:  https://_____________________________.vercel.app
API:       https://_____________________________.up.railway.app
API Health: https://_____________________________.up.railway.app/health
```

---

## Troubleshooting

### "Application failed to respond" on Railway
→ Check **Logs** tab in Railway. Most common causes:
- `DATABASE_URL` is wrong — double-check the MySQL URL
- Missing env variable — check all variables are set

### Products page is empty
→ The database seed didn't run. Re-run from your computer:
```bash
pnpm --filter @lendora/database run db:seed
```

### "CORS error" in the browser console
→ `APP_URL` in Railway must exactly match your Vercel URL — no trailing slash.
Correct: `https://lendora-abc.vercel.app`
Wrong: `https://lendora-abc.vercel.app/`

### Login fails / "Invalid credentials"
→ JWT secrets may not be set. Check `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are both at least 32 characters.

### Images not uploading
→ Check Cloudinary variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
Visit Railway → your service → **Logs** and look for Cloudinary errors.

### Vercel build fails
→ Most likely cause: `Root Directory` is not set to `frontend`.
Go to Vercel → Project → Settings → General → Root Directory → set to `frontend`.

### Railway $5 credit runs out
→ The $5 credit lasts approximately 30 days for a small project. For your university defense, this is more than enough. If you need more time, you can add a credit card for continued hosting ($5/month for the API service + $0 for the MySQL database which has a free tier).

---

## Quick Checklist Before Defense

- [ ] `https://your-app.vercel.app` opens without errors
- [ ] Admin login works → admin dashboard visible
- [ ] Seller login works → products listed in vendor dashboard
- [ ] Customer login works → can browse and view products
- [ ] Rental flow works → Customer can request a rental
- [ ] Admin can approve vendors and manage the platform
- [ ] Product images load correctly (served from Cloudinary)
- [ ] Share your Vercel URL with evaluators — no installation needed
