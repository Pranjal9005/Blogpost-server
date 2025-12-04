# Vercel Deployment Fixes Applied

## Changes Made

### 1. Created `vercel.json` Configuration
- Configured Vercel to use the Express app as a serverless function
- Set up routing to handle all requests through the API handler

### 2. Created `api/index.js`
- Serverless function entry point for Vercel
- Exports the Express app for serverless execution

### 3. Updated `index.js`
- Modified to detect Vercel environment (`VERCEL=1`)
- Database initialization happens on module load for Vercel
- Server only starts listening in non-Vercel environments

### 4. Updated `middleware/upload.js`
- Uses `/tmp` directory on Vercel (writable filesystem)
- Uses `uploads/` directory in local development
- **Note:** Files in `/tmp` are temporary and not accessible via static URLs

### 5. Updated Static File Serving
- Disabled static file serving for `/uploads` on Vercel
- Files uploaded to `/tmp` won't be accessible via URLs

## Important: File Upload Limitation

⚠️ **Critical:** Vercel's serverless functions have a read-only filesystem except `/tmp`. Files in `/tmp` are:
- Temporary (deleted after function execution)
- Not accessible via static URLs
- Not persistent

### Solution: Use Cloud Storage

For production, you need to implement cloud storage. Here are options:

1. **Cloudinary** (Easiest)
2. **AWS S3**
3. **Google Cloud Storage**
4. **Azure Blob Storage**

## Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

Go to: Project Settings → Environment Variables

Add these:
```
DATABASE_URL=postgresql://neondb_owner:npg_eSLgD74VvXCH@ep-patient-voice-ahh56urj-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Deploy

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### 3. Test Deployment

```bash
# Health check
curl https://your-app.vercel.app/health

# Test login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"asdfasdf"}'
```

## Common Errors and Solutions

### Error: "Cannot find module"
**Solution:** Ensure all dependencies are in `dependencies` (not `devDependencies`)

### Error: "DATABASE_URL is not set"
**Solution:** Add `DATABASE_URL` in Vercel dashboard → Environment Variables

### Error: "JWT_SECRET is not set"
**Solution:** Add `JWT_SECRET` in Vercel dashboard → Environment Variables

### Error: Database connection timeout
**Solution:** 
- Check your Neon database allows external connections
- Verify connection string is correct
- Check SSL settings

### Error: Function timeout
**Solution:** 
- Optimize database queries
- Vercel free tier: 10s limit
- Pro tier: 60s limit

## Next Steps

1. ✅ Deploy to Vercel
2. ⚠️ Implement cloud storage for file uploads (required for production)
3. ✅ Test all endpoints
4. ✅ Set up custom domain (optional)
5. ✅ Configure CORS for frontend (if needed)

## File Upload Fix (Future)

To properly handle file uploads on Vercel, you'll need to:

1. Sign up for cloud storage (Cloudinary recommended)
2. Update `middleware/upload.js` to upload to cloud storage
3. Store cloud storage URLs in database instead of local paths
4. Update image serving logic

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

