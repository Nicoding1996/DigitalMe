# DigitalMe Deployment Guide

## Architecture
- **Frontend:** DigitalOcean App Platform (React SPA)
- **Backend:** DigitalOcean App Platform (Express API)

---

## DigitalOcean Deployment (Recommended)

### Why DigitalOcean?
- **$200 free credit for 60 days** (new accounts)
- Deploy both frontend + backend from same repo
- No cold starts (always-on services)
- Professional infrastructure
- Perfect for hackathon timeline (Nov 16 - Jan 28)

---

## Backend Deployment (DigitalOcean App Platform)

### Step 1: Create DigitalOcean Account
1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up with email or GitHub
3. Add credit card (required for $200 credit)
4. Verify email and account

### Step 2: Create New App
1. Click "Create" → "Apps"
2. Select "GitHub" as source
3. Authorize DigitalOcean to access your repos
4. Select your DigitalMe repository
5. Click "Next"

### Step 3: Configure Backend Service
1. DigitalOcean auto-detects your app structure
2. Click "Edit" on the detected service
3. Configure:
   - **Name:** digitalme-backend
   - **Source Directory:** `/backend`
   - **Environment:** Node.js
   - **Build Command:** `npm install`
   - **Run Command:** `node server.js`
   - **HTTP Port:** 3001
   - **Instance Size:** Basic ($5/month - covered by credit)

### Step 4: Add Environment Variables
Click "Environment Variables" and add:
```
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
FRONTEND_URL=https://your-app.ondigitalocean.app
GEMINI_MODEL=gemini-2.0-flash-exp
NODE_ENV=production
```

### Step 5: Configure Gmail OAuth (Optional)
If using Gmail integration:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update OAuth redirect URIs to include:
   ```
   https://digitalme-backend-xxxxx.ondigitalocean.app/api/gmail/callback
   ```
3. Add to DigitalOcean environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=https://digitalme-backend-xxxxx.ondigitalocean.app/api/gmail/callback
   TOKEN_ENCRYPTION_KEY=generate_random_32_char_string
   ```

### Step 6: Deploy Backend
1. Click "Next" to review
2. Click "Create Resources"
3. DigitalOcean builds and deploys (2-3 minutes)
4. Copy your backend URL (e.g., `https://digitalme-backend-xxxxx.ondigitalocean.app`)

---

## Frontend Deployment (DigitalOcean App Platform)

### Step 1: Add Frontend to Same App
1. In your DigitalOcean App dashboard, click "Create" → "Component"
2. Select "Static Site"
3. Configure:
   - **Name:** digitalme-frontend
   - **Source Directory:** `/` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### Step 2: Add Frontend Environment Variable
1. Click "Environment Variables"
2. Add:
   ```
   REACT_APP_BACKEND_URL=https://digitalme-backend-xxxxx.ondigitalocean.app
   ```
3. Use your actual backend URL from previous step

### Step 3: Deploy Frontend
1. Click "Save"
2. DigitalOcean builds and deploys (2-3 minutes)
3. You'll get a URL like: `https://digitalme-xxxxx.ondigitalocean.app`

### Step 4: Update Backend CORS
1. Go to backend component settings
2. Update `FRONTEND_URL` environment variable to your frontend URL
3. Click "Save" - backend will redeploy automatically

---

## Post-Deployment Checklist

### Test Basic Functionality
- [ ] Frontend loads without errors
- [ ] Backend connection indicator shows "Connected"
- [ ] Text sample analysis works
- [ ] AI responses generate correctly

### Test Gmail Integration (if configured)
- [ ] Gmail connect button appears
- [ ] OAuth flow redirects correctly
- [ ] Email analysis completes successfully
- [ ] Tokens are encrypted and stored

### Test Other Integrations
- [ ] Blog scraping works with public URLs
- [ ] GitHub analysis works with public repos

### Security Verification
- [ ] API keys not exposed in frontend code
- [ ] CORS configured correctly (only your frontend URL)
- [ ] Rate limiting active on backend
- [ ] OAuth tokens encrypted

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. Go to Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., `digitalme.com`)
4. Update DNS records as instructed
5. Vercel auto-provisions SSL certificate

### Railway Custom Domain
1. Go to Railway project settings
2. Click "Settings" → "Domains"
3. Add custom domain
4. Update DNS CNAME record
5. SSL auto-configured

---

## Monitoring & Logs

### Railway
- View logs: Project → "Deployments" → Click deployment
- Metrics: CPU, memory, network usage
- Alerts: Set up in project settings

### Vercel
- View logs: Project → "Deployments" → Click deployment
- Analytics: Built-in web analytics
- Error tracking: Automatic error detection

### Render
- View logs: Service → "Logs" tab
- Metrics: Dashboard shows CPU, memory
- Alerts: Email notifications for failures

---

## Troubleshooting

### Frontend Can't Connect to Backend
- Check `REACT_APP_BACKEND_URL` in Vercel environment variables
- Verify backend is running (visit backend URL directly)
- Check browser console for CORS errors

### Backend CORS Errors
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Include protocol (https://) in URL
- Redeploy backend after changing environment variables

### Gmail OAuth Not Working
- Verify redirect URI in Google Cloud Console matches backend URL
- Check `GOOGLE_REDIRECT_URI` environment variable
- Ensure `TOKEN_ENCRYPTION_KEY` is set (32+ characters)

### Rate Limiting Issues
- Default: 100 requests per 15 minutes per IP
- Adjust in `backend/middleware/rateLimiter.js` if needed
- Consider upgrading to paid tier for higher limits

---

## Cost Estimates

### Free Tier (Hobby Projects)
- **Vercel:** Free (unlimited bandwidth, 100 GB-hours)
- **Railway:** $5 credit/month (usually enough for low traffic)
- **Render:** 750 hours/month free (one service always-on)
- **Total:** $0-5/month

### Paid Tier (Production)
- **Vercel Pro:** $20/month (team features, analytics)
- **Railway Pro:** $5/month + usage (~$10-20/month)
- **Render Starter:** $7/month per service
- **Total:** ~$30-50/month

---

## Scaling Considerations

### When to Upgrade
- **Traffic:** >10,000 requests/day
- **Users:** >100 concurrent users
- **Storage:** Need persistent database
- **Features:** Need custom domains, team collaboration

### Optimization Tips
- Enable Vercel Edge Caching for static assets
- Use Railway's autoscaling for backend
- Implement Redis for session management
- Add CDN for global performance

---

## Alternative Platforms

### Netlify (Frontend Alternative)
- Similar to Vercel
- Great for static sites
- Built-in form handling
- Free tier: 100 GB bandwidth

### Heroku (Backend Alternative)
- Classic PaaS platform
- Easy Node.js deployment
- Free tier discontinued (paid only)
- $7/month minimum

### DigitalOcean App Platform
- Full-stack deployment
- $5/month for basic apps
- More control than PaaS
- Good for scaling

---

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Rotate API keys regularly
- Use different keys for dev/prod
- Enable 2FA on all platforms

### OAuth Security
- Use strong encryption keys (32+ chars)
- Implement token refresh logic
- Set appropriate OAuth scopes
- Monitor for suspicious activity

### Rate Limiting
- Keep default limits for public APIs
- Implement per-user limits for authenticated routes
- Log rate limit violations
- Consider IP whitelisting for admin routes

---

## Backup & Recovery

### Code Backup
- GitHub is your source of truth
- Tag releases: `git tag v1.0.0`
- Keep deployment configs in repo

### Data Backup
- Export user profiles regularly
- Store in secure cloud storage
- Test restore procedures
- Document recovery steps

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Google Cloud Console:** https://console.cloud.google.com
- **Gemini API Docs:** https://ai.google.dev/docs

---

## Quick Deploy Commands

### Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Test Production Build Locally
```bash
# Frontend
npm run build
npx serve -s build

# Backend
cd backend
npm start
```

### Generate Encryption Key
```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Mac/Linux
openssl rand -base64 32
```

---

**You're ready to deploy!** Start with Railway for backend, then Vercel for frontend. The whole process takes about 15 minutes.
