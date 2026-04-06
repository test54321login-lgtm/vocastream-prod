# VocaStream Documentation

## Project Overview

VocaStream is a web application that allows users to create, manage, and convert text content into audio (text-to-speech). It consists of a Node.js/Express backend and a vanilla JavaScript frontend.

## Features

- User authentication (sign up, sign in)
- Text content creation and management
- Text-to-speech conversion
- URL content extraction
- PDF/DOCX document extraction and conversion
- Audio playback and download

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: Vanilla JavaScript, HTML, CSS (Tailwind)
- **Authentication**: JWT-based
- **Deployment**: Vercel (frontend), Railway/Render (backend)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Content
- `GET /api/content` - List user's content
- `POST /api/content` - Create new content
- `GET /api/content/:id` - Get specific content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### TTS Conversion
- `POST /api/tts/convert` - Convert text to speech

### URL Proxy
- `POST /api/content/fetch-url` - Fetch and extract content from URL (with SSRF protection)

### Document Extraction
- `POST /api/content/extract-pdf` - Extract text from PDF
- `POST /api/content/extract-docx` - Extract text from DOCX

## Security Features

- JWT authentication middleware
- Rate limiting on sensitive endpoints
- SSRF protection for URL fetching
- Input validation and sanitization
- CORS configuration

## Deployment

See DEPLOYMENT.md for detailed deployment instructions.