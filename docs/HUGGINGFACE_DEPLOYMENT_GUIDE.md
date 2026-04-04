# Triple Threat Deployment Guide

This guide walks you through deploying VOCASTREAM using the Triple Threat stack:
- **Vercel** (Frontend)
- **Hugging Face** (Backend with Docker)
- **Kaggle** (AI Engine with GPU)

---

## Prerequisites

1. GitHub repository with your code
2. Hugging Face account
3. Vercel account
4. Kaggle account (for TTS GPU)

---

## Step 1: Deploy Backend to Hugging Face

### 1.1 Create New Space
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in details:
   - **Owner**: Your username
   - **Space name**: `vocastream-backend` (or your preferred name)
   - **SDK**: Select **"Docker"**
   - **Template**: Choose **"Blank"**
   - **Visibility**: "Public" (we have JWT protection, but you can make it Private if preferred)

### 1.2 Set Environment Variables
In your Space's **Settings** → **Variables and secrets**, add:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A strong random string (e.g., `vocastream-jwt-secret-2024-xyz`) |
| `INTERNAL_SECRET` | `SELLSHOUT_INTERNAL_SECRET_99` (keep this secret!) |
| `KAGGLE_URL` | Your Ngrok URL from Kaggle (see Step 2) |
| `FRONTEND_URL` | Your Vercel URL (e.g., `https://vocastream.vercel.app`) |
| `NODE_ENV` | `production` |
| `PORT` | `7860` |

### 1.3 Push Code
1. In your Space, go to **"Files"** tab
2. Add these files:
   - `Dockerfile.huggingface` (content from this repo)
   - `backend/package.json` 
   - `backend/server.js`
   - `backend/.env.example` (rename your .env to .env.example, remove actual secrets!)

3. Click **"Commit changes"**

### 1.4 Verify Deployment
- Wait 2-3 minutes for Docker to build
- Check the **"Logs"** tab for any errors
- Visit: `https://your-space-name.hf.space/api/health`
- Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

---

## Step 2: Configure Kaggle AI Engine

### 2.1 Run Your TTS Notebook
1. Open your Kaggle notebook with TTS model
2. Make sure it has Ngrok running
3. Get the Ngrok URL (e.g., `https://abc123.ngrok-free.dev`)

### 2.2 Update Hugging Face
1. Go to your Hugging Face Space **Settings**
2. Update `KAGGLE_URL` variable:
   - Original: `https://catrina-scorpionic-dadaistically.ngrok-free.dev/generate-internal`
   - New: `https://YOUR-NGROK-URL.ngrok-free.dev/generate-internal`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository
1. Go to [Vercel](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: "Other" (or "Create React App" if using React)
   - **Build Command**: Leave empty or `npm run build`
   - **Output Directory**: Leave empty

### 3.2 Set Environment Variables
Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `API_BASE_URL` | `https://your-space-name.hf.space/api` |
| `VITE_API_URL` | `https://your-space-name.hf.space/api` |

### 3.3 Deploy
- Click **"Deploy"**
- Wait for build to complete
- Visit your Vercel URL

---

## Step 4: Test the Full Stack

### 4.1 Test Authentication
1. Open your Vercel frontend URL
2. Try **Register** → should succeed
3. Try **Login** → should return JWT token

### 4.2 Test TTS
1. Login to the dashboard
2. Enter some text (e.g., "Hello world")
3. Click **"Generate Voice"**
4. Should receive audio file

### 4.3 Check Logs
- **Hugging Face**: Check Space logs for any errors
- **Kaggle**: Check notebook output for requests

---

## Troubleshooting

### CORS Errors
If you see CORS errors in browser console:
1. Check `FRONTEND_URL` in Hugging Face secrets matches your Vercel URL exactly
2. Verify `http://` vs `https://` - must match exactly

### 502 Bad Gateway
- Check Hugging Face logs - likely MongoDB connection failed
- Verify `MONGO_URI` is correct

### TTS Not Working
1. Verify Kaggle notebook is running
2. Check Ngrok URL is correct in Hugging Face secrets
3. Test manually: `curl -X POST https://YOUR-NGROK-URL.ngrok-free.dev/generate-internal -d "text=hello"`

### Token Issues
- Clear browser localStorage and try again
- Check JWT_SECRET is same in both Hugging Face and what you used for testing

---

## Architecture Summary

```
┌─────────────┐     HTTPS      ┌─────────────────┐
│   Vercel    │ ──────────────→│  Hugging Face  │
│  (Frontend) │                │    (Backend)   │
└─────────────┘                └────────┬────────┘
                                         │
                                    MongoDB
                                         │
                                    ┌─────▼─────┐
                                    │  Kaggle   │
                                    │   (GPU)   │
                                    └───────────┘
```

---

## Security Notes

1. **Never commit `.env` file** - it's in `.gitignore`
2. **Keep `INTERNAL_SECRET` private** - this protects your Kaggle bridge
3. **Use strong JWT_SECRET** - at least 32 random characters
4. **CORS is configured** to only allow your specific Vercel URL
5. **All routes except health check** require valid JWT token

---

## Quick Commands for Testing

```bash
# Test health endpoint
curl https://your-space.hf.space/api/health

# Test registration
curl -X POST https://your-space.hf.space/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test login
curl -X POST https://your-space.hf.space/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Files Modified for Deployment

| File | Change |
|------|--------|
| `Dockerfile.huggingface` | NEW - Docker config for Hugging Face |
| `backend/server.js` | Port changed to 7860, bind to 0.0.0.0 |
| `frontend/app.js` | Added documentation for production API URL |

---

Happy Deploying! 🎉