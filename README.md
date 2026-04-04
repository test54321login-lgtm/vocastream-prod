# VOCASTREAM 🗣️
> Architecting Sound. A production-ready text-to-speech platform with Natural Voice AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com)

## ✨ Features

- **Web Speech API** - Browser-native speech synthesis (no API key required)
- **Natural Voice AI** - Premium AI-powered voice generation using Facebook's MMS-TTS models
- **User Authentication** - Secure JWT-based auth with MongoDB
- **Voice Customization** - Adjust speed, pitch, and volume
- **Production Ready** - Reverse proxy configured for single-port deployment
- **OCR Support** - Extract text from images using Tesseract.js

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Kaggle account (for Natural Voice AI)

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vocastream.git
cd vocastream

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start development servers (runs both frontend & backend)
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production

```bash
# Set environment variables
cp backend/.env.example backend/.env
# Edit .env with your configuration

# Run in production mode
npm run production
```

The frontend and backend will be served from the same origin (port 3001).

## 📋 Environment Variables

See [`.env.example`](backend/.env.example) for required configuration.

### Key Variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `KAGGLE_URL` | Your Kaggle AI endpoint |
| `INTERNAL_SECRET` | Secret for Kaggle API |

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Text-to-Speech

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/tts-voice` | Generate voice (Natural AI) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API health |

## 🏗️ Architecture

```
vocastream/
├── backend/          # Express.js API server
│   ├── middleware/  # Auth, rate limiting, validation
│   ├── server.js   # Main server entry
│   └── .env       # Environment config
├── frontend/        # Static HTML/JS frontend
│   ├── app.js     # Main frontend logic
│   ├── index.html # Landing page
│   ├── studio.html # TTS studio
│   └── sign-in.html # Authentication
└── package.json   # Root scripts
```

## 🐳 Deployment

### Docker

```bash
docker build -t vocastream .
docker run -p 3001:3001 --env-file backend/.env vocastream
```

### Render.com (Free)

1. Connect GitHub repository
2. Build command: `npm install:all`
3. Start command: `npm run production`

### Railway (Free)

1. Connect GitHub repository
2. Add environment variables
3. Deploy

## 🔧 Natural Voice AI Setup

Your Kaggle notebook should expose an endpoint using ngrok:

```python
# In your Kaggle notebook
from pyngrok import ngrok
ngrok.connect(5000).public_url
```

Keep the notebook running to use Natural Voice features.

## �� License

MIT License - feel free to use for personal and commercial projects.

## 🙏 Acknowledgments

- [Facebook MMS-TTS](https://github.com/facebookresearch/fairseq) - Natural Voice AI
- [Flask-CORS](https://github.com/corydolphin/flask-cors) - CORS support
- [Tesseract.js](https://tesseract.projectnaptha.com) - OCR

## 🔐 Security

- Passwords are hashed with bcrypt
- JWT tokens with expiration
- Rate limiting on auth endpoints
- CORS configured per origin
- Input validation on all endpoints

---

<p align="center">Built with ❤️ for the community</p>