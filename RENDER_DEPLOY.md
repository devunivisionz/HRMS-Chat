# Render API Deployment Guide

## Quick Setup (5 minutes)

### 1. Go to [render.com](https://render.com)
- Sign up/login
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository
- Configure as follows:

### 2. Web Service Configuration
```
Name: hrms-api
Root Directory: apps/api
Runtime: Node
Build Command: pnpm install && pnpm build
Start Command: pnpm start
Instance Type: Free
```

### 3. Add Database Services
In your Render dashboard:
- Click **"New +"** → **"PostgreSQL"**
  - Name: `hrms-postgres`
  - Database Name: `hrms_dev`
  - User: `hrms_user`

- Click **"New +"** → **"Redis"**
  - Name: `hrms-redis`

### 4. Environment Variables
In your web service settings → **Environment**:

```bash
# Database (Render provides auto)
DATABASE_URL=postgresql://hrms_user:password@host:5432/hrms_dev
REDIS_URL=redis://default:password@host:port

# MongoDB Atlas (create free cluster first)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hrms

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

# JWT Secret
JWT_SECRET=your-jwt-secret-key
```

### 5. Deploy
- Click **"Create Web Service"**
- Wait for build to complete
- Copy your Render URL (e.g., `hrms-api.onrender.com`)

### 6. Run Database Migrations
After deployment:
1. Go to your service → **"Shell"**
2. Run:
```bash
cd apps/api
pnpm db:migrate
pnpm db:seed
```

### 7. Update Vercel Frontend
Go to your Vercel project → **Settings** → **Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://hrms-api.onrender.com
```

### 8. Test API
```bash
curl https://hrms-api.onrender.com/api/health
```

## Important Notes

### Render Free Tier Limits
- Auto-sleeps after 15 minutes of inactivity
- Wakes up on next request (may take 30 seconds)
- Limited to 750 hours/month

### MongoDB Setup (Required)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to Render environment variables

### VAPID Keys Generation
```bash
# Generate locally
node -e "
const crypto = require('crypto');
const keyPair = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log('Public:', keyPair.publicKey);
console.log('Private:', keyPair.privateKey);
"
```

## Done! 🎉
Your API is now running on Render with:
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ Automatic HTTPS
- ✅ Zero-downtime deploys

Next: Update Vercel frontend with your Render API URL.
