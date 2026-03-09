# Railway API Deployment Guide

## Quick Setup (5 minutes)

### 1. Go to [railway.app](https://railway.app)
- Sign up/login
- Click **"New Project"**
- Click **"Deploy from GitHub repo"**
- Select your HRMS repository
- Set **Root Directory** to `apps/api`
- Click **"Add Variables"**

### 2. Add Environment Variables in Railway
```bash
# Database (use Railway PostgreSQL add-on)
DATABASE_URL=postgresql://postgres:password@localhost:5432/railway

# MongoDB Atlas (create free cluster)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hrms

# Redis (use Railway Redis add-on)
REDIS_URL=redis://default:password@host:port

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-app.vercel.app

# VAPID (generate new ones)
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=admin@yourdomain.com
```

### 3. Add Railway Services
In your Railway project:
- Click **"+ New"** → **PostgreSQL** (for main HRMS data)
- Click **"+ New"** → **Redis** (for caching)

### 4. Deploy
- Railway will auto-deploy
- Wait for build to complete
- Copy your Railway URL (e.g., `your-api.railway.app`)

### 5. Run Database Migrations
```bash
# Open Railway shell
railway shell

# Run migrations
pnpm db:migrate
pnpm db:seed
```

### 6. Update Vercel Frontend
Go to your Vercel project → **Settings** → **Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### 7. Test API
```bash
curl https://your-api.railway.app/api/health
```

## Done! 🎉
Your API is now running on Railway and frontend can connect to it.
