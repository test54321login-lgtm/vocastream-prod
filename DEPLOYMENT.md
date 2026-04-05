# VOCASTREAM Deployment Guide

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Vercel (Frontend) │────────▶│  Render/Railway     │
│   :3000             │  Proxy  │  (Backend) :3001    │
│   vercel.app        │         │  render.app         │
└─────────────────────┘         └─────────────────────┘
        │                               │
        │                               │
        ▼                               ▼
   Static Files                    MongoDB Atlas
   (HTML/CSS/JS)                  (Database)
```

## Environment Variables

### Vercel (Frontend)

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | (not needed) | Using proxy |
| `BACKEND_URL` | `https://your-backend.render.com` | Backend URL |
| `API_BASE_URL` | `/api` | Relative path for proxy |

### Render/Railway (Backend)

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `3001` | Render assigns this |
| `NODE_ENV` | `production` | |
| `MONGO_URI` | MongoDB Atlas connection string | |
| `JWT_SECRET` | Random 32+ char string | |
| `FRONTEND_URL` | `https://your-vercel-app.vercel.app` | For CORS |
| `KAGGLE_URL` | Kaggle endpoint URL | AI Voice |
| `INTERNAL_SECRET` | Secret key | AI Voice |
| `SERVE_FRONTEND` | `false` | API only mode |

## Deployment Steps

### 1. Deploy Backend to Render/Railway

```bash
# Connect GitHub repo to Render/Railway
# Set environment variables in dashboard
# Backend runs on port from process.env.PORT
```

### 2. Deploy Frontend to Vercel

```bash
# Import GitHub repo to Vercel
# Set environment variables:
# - BACKEND_URL=https://your-backend.render.com
# Build command: npm run build
# Output directory: .
```

### 3. Verify

- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-backend.render.com/api/health`
- Sign up: `https://your-project.vercel.app/sign-up.html`

## Local Development

```bash
# Terminal 1 - Backend
cd vocastream-prod/backend
npm run dev

# Terminal 2 - Frontend
cd vocastream-prod/frontend
npm run dev
```

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
- Include `https://` protocol

### "Failed to fetch"
- Check backend is running
- Verify proxy routes in vercel.json
- Check browser console for specific error

### Natural Voice API not working
- Ensure `KAGGLE_URL` and `INTERNAL_SECRET` are set in backend
- The Kaggle notebook must be running
