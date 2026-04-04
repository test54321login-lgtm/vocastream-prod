# VOCASTREAM - Architecting Sound

A comprehensive text-to-speech platform with Web Speech API and Natural Voice API integration, featuring OCR for handwritten text extraction.

## Features

- **Text to Speech**: Convert text to speech using Web Speech API or Natural Voice API
- **File Upload**: Upload images (JPG, PNG, BMP, TIFF) for OCR text extraction
- **Link/Paste**: Import content from URLs or paste text directly
- **Voice Selection**: Choose from multiple voices and languages
- **Audio Controls**: Adjust speed, pitch, and volume
- **Audio Preview**: Play, pause, and download generated audio
- **User Authentication**: Sign in and sign up functionality

## Project Structure

```
vocastream/
├── index.html          # Landing page
├── studio.html         # Main application page
├── sign-in.html        # Sign in page
├── sign-up.html        # Sign up page
├── app.js              # Application logic
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. **Clone or download the project**
   ```bash
   cd vocastream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   This will:
   - Install all required dependencies
   - Start a local development server on port 3000
   - Open the application in your default browser

## Usage

### Landing Page (index.html)
- Enter text in the hero section input field
- Click the play button to be redirected to the studio with your text
- Navigate through features, how-to-use, and premium features sections

### Voice Studio (studio.html)
1. **Select Engine**: Choose between "Natural Voice Engine" or "Web Speech API"
2. **Input Type**: Select input method:
   - **Text to Speech**: Type or paste text directly
   - **File Upload**: Upload images for OCR text extraction
   - **Link/Paste**: Import content from URLs
3. **Configure Settings**:
   - Select voice/persona/language
   - Adjust speed, pitch, and gain/volume
4. **Generate Speech**: Click "Generate Speech" button
5. **Audio Controls**:
   - Play/pause audio preview
   - Download generated audio
6. **Reset**: Click "Reset Studio" to clear all inputs

### Authentication (sign-in.html / sign-up.html)
- Sign in with email and password
- Create new account with name, email, and password
- Form validation ensures proper input

## Configuration

### Natural Voice API Setup

To use the Natural Voice API, you need to configure the API endpoint and key in [`app.js`](app.js:11-17):

```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-api-endpoint.com', // Your API URL
  API_KEY: 'your-api-key-here',                  // Your API key
  // ... other config
};
```

Or use the exported function:
```javascript
window.VOCASTREAM.setAPIConfig('https://your-api-endpoint.com', 'your-api-key');
```

### Web Speech API

The Web Speech API is built into modern browsers and requires no configuration. The application will automatically detect browser support and fall back to Natural Voice API if unavailable.

## Browser Compatibility

| Browser | Web Speech API | File Upload | OCR |
|---------|---------------|-------------|-----|
| Chrome  | ✅ Full       | ✅ Full     | ✅ Full |
| Firefox | ✅ Full       | ✅ Full     | ✅ Full |
| Safari  | ✅ Full       | ✅ Full     | ✅ Full |
| Edge    | ✅ Full       | ✅ Full     | ✅ Full |

## Dependencies

### Production Dependencies
- **tesseract.js** (v4.1.1): OCR engine for text extraction from images

### Development Dependencies
- **live-server**: Local development server with live reload

## API Reference

### Web Speech API
Uses the browser's built-in `window.speechSynthesis` API for text-to-speech.

### Natural Voice API
Expected API format:
- **Endpoint**: POST `{API_BASE_URL}`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {API_KEY}`
  - `X-Requested-With: XMLHttpRequest`
- **Body**:
  ```json
  {
    "text": "Text to convert",
    "voice": "voice-name",
    "language": "en-US",
    "settings": {
      "speed": 1.0,
      "pitch": 1.0,
      "volume": 1.0
    }
  }
  ```
- **Response**: Audio blob (MP3/WAV)

## Troubleshooting

### Web Speech API Not Working
- Ensure you're using a supported browser
- Check browser permissions for audio playback
- Try switching to Natural Voice API engine

### OCR Not Working
- Ensure image is clear and text is legible
- Check file format is supported (JPG, PNG, BMP, TIFF)
- Verify file size is under 10MB

### Audio Not Playing
- Check browser audio permissions
- Ensure system volume is not muted
- Try a different browser

### CORS Errors (Link/Paste)
- Some websites block cross-origin requests
- Use a CORS proxy or backend server for production
- Copy and paste content directly instead

## Development

### Adding New Features
1. Update HTML files with new UI elements
2. Add corresponding IDs to elements
3. Update [`app.js`](app.js) with event listeners and logic
4. Test across all pages

### Code Structure
- **Configuration**: Lines 11-17 in [`app.js`](app.js:11-17)
- **State Management**: Lines 20-32 in [`app.js`](app.js:20-32)
- **DOM References**: Lines 35-69 in [`app.js`](app.js:35-69)
- **Initialization**: Lines 72-88 in [`app.js`](app.js:72-88)
- **Event Listeners**: Lines 124-198 in [`app.js`](app.js:124-198)

## Security Considerations

- API keys are stored in client-side JavaScript (not recommended for production)
- Use environment variables and backend proxy for production
- Input sanitization is basic; implement comprehensive sanitization for production
- CORS restrictions may affect URL fetching functionality

## Performance

- Tesseract.js is loaded dynamically on first OCR use (~2MB)
- Web Speech API has zero latency
- Natural Voice API depends on network speed and API response time
- Audio files are created as object URLs and cleaned up after playback

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review browser console for error messages
- Ensure all dependencies are installed correctly

## Changelog

### Version 1.0.0
- Initial release
- Web Speech API integration
- Natural Voice API integration
- OCR text extraction
- File upload support
- Link/Paste support
- User authentication UI
- Audio preview and download
