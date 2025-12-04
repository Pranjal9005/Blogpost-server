# Vercel Deployment Guide

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Environment variables configured in Vercel dashboard

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables in Vercel Dashboard

Go to your project settings in Vercel dashboard and add these environment variables:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
  ```
  postgresql://neondb_owner:npg_eSLgD74VvXCH@ep-patient-voice-ahh56urj-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

- `JWT_SECRET` - Your JWT secret key
  ```
  your-super-secret-jwt-key-change-this-in-production
  ```

**Optional:**
- `NODE_ENV` - Set to `production`
- `PORT` - Usually not needed (Vercel handles this)

### 4. Deploy to Vercel

**First deployment:**
```bash
vercel
```

**Production deployment:**
```bash
vercel --prod
```

### 5. Update Environment Variables (if needed)

After deployment, you can update environment variables:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

Or use the Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add/Edit variables
4. Redeploy after changes

## Important Notes

### File Uploads on Vercel

⚠️ **Important:** Vercel has a read-only filesystem except for `/tmp`. Files uploaded to `/tmp` are:
- Temporary (deleted after function execution)
- Not accessible via static URLs
- Not persistent across deployments

**Recommended Solutions:**

1. **Use Cloud Storage (Recommended for Production):**
   - AWS S3
   - Cloudinary
   - Google Cloud Storage
   - Azure Blob Storage

2. **For Development/Testing:**
   - Current setup uses `/tmp` directory
   - Files will be lost after function execution
   - Not suitable for production

### Database Connection

- Ensure your Neon PostgreSQL database allows connections from Vercel's IP addresses
- Connection pooling is recommended for serverless functions
- The current setup uses connection pooling which works well with Vercel

### Static File Serving

- The `/uploads` static route is disabled on Vercel
- You'll need to implement cloud storage for persistent file storage
- Consider using a CDN for serving images

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors:**
   - Ensure all dependencies are in `dependencies` (not `devDependencies`)
   - Run `npm install` before deploying

2. **Database connection errors:**
   - Check `DATABASE_URL` is set correctly in Vercel dashboard
   - Verify database allows external connections
   - Check SSL settings match your connection string

3. **JWT_SECRET errors:**
   - Ensure `JWT_SECRET` is set in Vercel environment variables
   - Redeploy after adding environment variables

4. **File upload errors:**
   - Files in `/tmp` are temporary
   - Consider implementing cloud storage

5. **Function timeout:**
   - Vercel free tier: 10 seconds
   - Pro tier: 60 seconds
   - Optimize database queries if needed

### Check Deployment Logs

```bash
vercel logs
```

Or check in Vercel dashboard:
1. Go to your project
2. Click on a deployment
3. View "Functions" tab for logs

## Project Structure for Vercel

```
Blogpost-server/
├── api/
│   └── index.js          # Vercel serverless function entry point
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── routes/
│   ├── auth.js
│   ├── posts.js
│   └── user.js
├── index.js              # Main Express app
├── vercel.json           # Vercel configuration
├── package.json
└── .vercelignore
```

## Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - JWT secret key
- [ ] `NODE_ENV` - Set to `production` (optional)

## Post-Deployment

1. Test your API endpoints:
   ```bash
   curl https://your-app.vercel.app/health
   ```

2. Test authentication:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@gmail.com","password":"asdfasdf"}'
   ```

3. Monitor logs for any errors

## Next Steps

1. **Implement Cloud Storage for Images:**
   - Set up AWS S3, Cloudinary, or similar
   - Update upload middleware to use cloud storage
   - Update image URLs in responses

2. **Set up Custom Domain:**
   - Add domain in Vercel dashboard
   - Configure DNS settings

3. **Enable CORS for Frontend:**
   - Update CORS settings if needed
   - Add your frontend domain to allowed origins

4. **Set up Monitoring:**
   - Use Vercel Analytics
   - Set up error tracking (Sentry, etc.)

## Support

For Vercel-specific issues:
- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

For application issues, check server logs in Vercel dashboard.

