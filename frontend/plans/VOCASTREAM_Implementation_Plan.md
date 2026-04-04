# VOCASTREAM JavaScript Implementation Plan

## Overview
Create a comprehensive JavaScript file (`app.js`) that integrates:
- Web Speech API for browser-native speech synthesis
- Natural Voice API integration (endpoint to be provided)
- OCR for handwritten text extraction using Tesseract.js

## Architecture

### 1. Engine Selection System
- Toggle between "Natural Voice Engine" and "Web Speech API"
- UI Elements: `#engine-natural`, `#engine-webapi`
- Store current engine selection in state

### 2. Input Type System
- Three modes: Text to Speech, File Upload, Link/Paste
- Tabs: `#tab-tts`, `#tab-upload`, `#tab-link`
- Dynamic content switching based on selected tab

### 3. Web Speech API Integration
- Use `window.speechSynthesis` for text-to-speech
- Support voice selection based on language preference
- Handle browser compatibility and fallbacks

### 4. Natural Voice API Integration
- HTTP POST requests to user-provided endpoint
- Configurable API URL and authentication
- Request/Response handling with proper error management

### 5. OCR Integration (File Upload)
- Use Tesseract.js for handwritten text recognition
- Support image files (JPG, PNG, BMP)
- Progress tracking during OCR processing

## UI Elements to Connect

### Buttons & Controls
- `#engine-natural` - Natural voice engine toggle
- `#engine-webapi` - Web Speech API toggle
- `#tab-tts` - Text to Speech tab
- `#tab-upload` - File upload tab
- `#tab-link` - Link/Paste tab
- `button:contains("Generate Speech")` - Generate button
- `button:contains("Reset Studio")` - Reset button

### Inputs
- `textarea` - Script input (min 320px height)
- `select` elements - Voice/language/persona selection
- `input[type="range"]` - Speed, Pitch, Gain controls

### State Management
- Current engine mode (natural/webapi)
- Current input type (text/upload/link)
- Selected voice/language
- Audio settings (speed, pitch, volume)

## Implementation Details

### Security Best Practices
1. Input sanitization before API calls
2. HTTPS-only API calls (enforce in production)
3. API key validation
4. CORS handling
5. Error boundary handling
6. Request timeout handling

### File Structure
```
app.js
├── Configuration Constants
├── State Management
├── DOM Element References
├── Event Listeners Initialization
├── Engine Selection Logic
│   ├── Web Speech API Module
│   └── Natural Voice API Module
├── OCR Processing Module
├── Audio Controls Module
└── Utility Functions
```

### API Endpoints (User to provide)
- `API_BASE_URL` - Base URL for Natural Voice API
- `API_KEY` - Authentication token
- Request format: JSON
- Response format: Audio blob/URL

### Error Handling
- Network errors
- API authentication failures
- OCR processing failures
- Browser compatibility issues
- Empty input validation

## Acceptance Criteria

1. ✅ Engine toggle switches between Natural Voice and Web Speech API
2. ✅ Text input processes through selected engine
3. ✅ File upload triggers OCR for handwritten text
4. ✅ API calls follow security best practices
5. ✅ UI provides feedback during processing
6. ✅ Error states are handled gracefully
7. ✅ Audio playback works with preview controls