/**
 * VOCASTREAM JavaScript Implementation
 * 
 * Comprehensive JavaScript file that integrates:
 * - Web Speech API for browser-native speech synthesis
 * - Natural Voice API integration (endpoint to be provided)
 * - OCR for handwritten text extraction using Tesseract.js
 */

// Configuration Constants
// Production: Uses window.API_BASE_URL (set by Vercel env) or relative /api (proxied to backend)
// Development: Uses localhost:7860
const API_URL = window.API_BASE_URL || (window.location.protocol + '//' + window.location.host + '/api');


const CONFIG = {
  // Use configured API URL
  API_BASE_URL: API_URL,
  API_KEY: '',      // Will be set after authentication
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff'],
  SUPPORTED_DOCUMENT_FORMATS: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  REQUEST_TIMEOUT: 30000, // 30 seconds
};

// State Management
const state = {
  currentEngine: 'webapi', // 'natural' or 'webapi'
  currentInputType: 'tts', // 'tts', 'upload', 'link'
  selectedVoice: null,
  audioSettings: {
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0
  },
  isProcessing: false,
  apiEndpoint: '',
  apiKey: '',
  currentAudio: null,
  isPlaying: false,
  // Authentication state
  isAuthenticated: false,
  user: null,
  token: null
};

// DOM Element References
const elements = {
  // Engine Selection
  engineNatural: document.getElementById('engine-natural'),
  engineWebApi: document.getElementById('engine-webapi'),
  
  // Input Type Tabs
  tabTts: document.getElementById('tab-tts'),
  tabUpload: document.getElementById('tab-upload'),
  tabLink: document.getElementById('tab-link'),
  
  // Text Input
  textArea: document.getElementById('script-input'),
  generateButton: document.getElementById('generate-speech-btn'),
  resetButton: document.getElementById('reset-studio-btn'),
  
  // Voice/Language Selection
  voiceSelect: document.getElementById('voice-select'),
  personaSelect: document.getElementById('persona-select'),
  languageSelect: document.getElementById('language-select'),
  
  // Audio Settings
  speedSlider: document.getElementById('speed-slider'),
  pitchSlider: document.getElementById('pitch-slider'),
  gainSlider: document.getElementById('gain-slider'),
  
  // Audio Settings Display
  speedValue: document.getElementById('speed-value'),
  pitchValue: document.getElementById('pitch-value'),
  gainValue: document.getElementById('gain-value'),
  
  // File Upload
  fileInput: document.getElementById('file-upload-input'),
  dropZone: document.getElementById('drop-zone'),
  filePreview: document.getElementById('file-preview'),
  fileName: document.getElementById('file-name'),
  fileSize: document.getElementById('file-size'),
  removeFile: document.getElementById('remove-file'),
  
  // Link/Paste
  urlInput: document.getElementById('url-input'),
  fetchUrlBtn: document.getElementById('fetch-url-btn'),
  
  // Audio Preview
  playButton: document.getElementById('play-audio-btn'),
  downloadButton: document.getElementById('download-audio-btn'),
  
  // Input Sections
  uploadSection: document.getElementById('upload-section'),
  linkSection: document.getElementById('link-section'),
  
  // Status indicators
  statusIndicator: null // Will be created dynamically
};

// Initialize the application
function init() {
  console.log('VOCASTREAM: Initializing application...');
  
  // Create dynamic elements if they don't exist
  createDynamicElements();
  
  // Bind event listeners
  bindEventListeners();
  
  // Initialize UI state
  initializeUIState();
  
  // Check for Web Speech API support
  checkWebSpeechSupport();
  
  console.log('VOCASTREAM: Application initialized successfully');
}

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem('vocastream_token');
  const user = localStorage.getItem('vocastream_user');
  
  if (token && user) {
    state.isAuthenticated = true;
    state.token = token;
    state.user = JSON.parse(user);
    CONFIG.API_KEY = token;
    return true;
  }
  return false;
}

// Save authentication data
function saveAuth(token, user) {
  localStorage.setItem('vocastream_token', token);
  localStorage.setItem('vocastream_user', JSON.stringify(user));
  state.isAuthenticated = true;
  state.token = token;
  state.user = user;
  CONFIG.API_KEY = token;
}

// Clear authentication data
function clearAuth() {
  localStorage.removeItem('vocastream_token');
  localStorage.removeItem('vocastream_user');
  state.isAuthenticated = false;
  state.token = null;
  state.user = null;
  CONFIG.API_KEY = '';
}

// Logout function
function logout() {
  clearAuth();
  showStatus('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'sign-in.html';
  }, 1000);
}

// Create dynamic elements that might not be in HTML
function createDynamicElements() {
  // Create status indicator
  if (!document.getElementById('status-indicator')) {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status-indicator';
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      background: #333;
      color: white;
      border-radius: 4px;
      z-index: 10000;
      display: none;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(statusDiv);
    elements.statusIndicator = statusDiv;
  }
}

// Bind all event listeners
function bindEventListeners() {
  // Engine selection
  if (elements.engineNatural) {
    elements.engineNatural.addEventListener('click', () => switchEngine('natural'));
  }
  if (elements.engineWebApi) {
    elements.engineWebApi.addEventListener('click', () => switchEngine('webapi'));
  }
  
  // Input type tabs
  if (elements.tabTts) {
    elements.tabTts.addEventListener('click', () => switchInputType('tts'));
  }
  if (elements.tabUpload) {
    elements.tabUpload.addEventListener('click', () => switchInputType('upload'));
  }
  if (elements.tabLink) {
    elements.tabLink.addEventListener('click', () => switchInputType('link'));
  }
  
  // Generate button
  if (elements.generateButton) {
    elements.generateButton.addEventListener('click', handleGenerateSpeech);
  }
  
  // Reset button
  if (elements.resetButton) {
    elements.resetButton.addEventListener('click', resetStudio);
  }
  
  // Audio setting sliders
  if (elements.speedSlider) {
    elements.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      state.audioSettings.speed = value;
      if (elements.speedValue) {
        elements.speedValue.textContent = `${value.toFixed(1)}x`;
      }
    });
  }
  
  if (elements.pitchSlider) {
    elements.pitchSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      state.audioSettings.pitch = value;
      if (elements.pitchValue) {
        elements.pitchValue.textContent = getPitchLabel(value);
      }
    });
  }
  
  if (elements.gainSlider) {
    elements.gainSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      state.audioSettings.volume = value;
      if (elements.gainValue) {
        elements.gainValue.textContent = `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
      }
    });
  }
  
  // File input change
  if (elements.fileInput) {
    elements.fileInput.addEventListener('change', handleFileUpload);
  }
  
  // Drop zone
  if (elements.dropZone) {
    elements.dropZone.addEventListener('click', () => {
      if (elements.fileInput) {
        elements.fileInput.click();
      }
    });
    
    elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('border-primary-container', 'bg-primary-container/10');
    });
    
    elements.dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('border-primary-container', 'bg-primary-container/10');
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('border-primary-container', 'bg-primary-container/10');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload({ target: { files: files } });
      }
    });
  }
  
  // Remove file button
  if (elements.removeFile) {
    elements.removeFile.addEventListener('click', () => {
      if (elements.fileInput) {
        elements.fileInput.value = '';
      }
      if (elements.filePreview) {
        elements.filePreview.classList.add('hidden');
      }
      if (elements.dropZone) {
        elements.dropZone.classList.remove('hidden');
      }
    });
  }
  
  // Fetch URL button
  if (elements.fetchUrlBtn) {
    elements.fetchUrlBtn.addEventListener('click', handleFetchUrl);
  }
  
  // Play button
  if (elements.playButton) {
    elements.playButton.addEventListener('click', toggleAudioPlayback);
  }
  
  // Hero play button (index page)
  const heroPlayBtn = document.getElementById('hero-play-btn');
  if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
      const heroInput = document.getElementById('hero-text-input');
      if (heroInput && heroInput.value.trim()) {
        // Store the text and redirect to studio
        localStorage.setItem('vocastream_hero_text', heroInput.value);
        window.location.href = 'studio.html';
      } else {
        showStatus('Please enter some text first');
      }
    });
  }
  
  // Download button
  if (elements.downloadButton) {
    elements.downloadButton.addEventListener('click', downloadAudio);
  }
  
  // Text area character counter
  if (elements.textArea) {
    elements.textArea.addEventListener('input', updateCharacterCount);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

// Initialize UI state
function initializeUIState() {
  // Set initial active states
  setActiveEngine(state.currentEngine);
  setActiveInputTab(state.currentInputType);
  
  // Initialize slider values
  if (elements.speedSlider) {
    elements.speedSlider.value = state.audioSettings.speed;
    if (elements.speedValue) {
      elements.speedValue.textContent = `${state.audioSettings.speed.toFixed(1)}x`;
    }
  }
  
  if (elements.pitchSlider) {
    elements.pitchSlider.value = state.audioSettings.pitch;
    if (elements.pitchValue) {
      elements.pitchValue.textContent = getPitchLabel(state.audioSettings.pitch);
    }
  }
  
  if (elements.gainSlider) {
    elements.gainSlider.value = state.audioSettings.volume;
    if (elements.gainValue) {
      elements.gainValue.textContent = `${state.audioSettings.volume > 0 ? '+' : ''}${state.audioSettings.volume.toFixed(1)} dB`;
    }
  }
  
  // Initialize character count
  updateCharacterCount();
  
  // Show TTS section by default
  showInputSection('tts');
  
  // Load hero text if redirected from index page
  const heroText = localStorage.getItem('vocastream_hero_text');
  if (heroText && elements.textArea) {
    elements.textArea.value = heroText;
    updateCharacterCount();
    localStorage.removeItem('vocastream_hero_text');
    showStatus('Text loaded from homepage', 'success');
  }
}

// Switch between Natural Voice and Web Speech API engines
function switchEngine(engineType) {
  if (!['natural', 'webapi'].includes(engineType)) {
    showError('Invalid engine type selected');
    return;
  }
  
  state.currentEngine = engineType;
  setActiveEngine(engineType);
  
  // Update UI to reflect the change
  showStatus(`Switched to ${engineType === 'natural' ? 'Natural Voice' : 'Web Speech API'} engine`);
}

// Set active engine in UI
function setActiveEngine(engineType) {
  if (elements.engineNatural) {
    if (engineType === 'natural') {
      elements.engineNatural.classList.add('bg-primary-container', 'text-on-primary-container');
      elements.engineNatural.classList.remove('text-outline', 'opacity-60');
      if (elements.engineWebApi) {
        elements.engineWebApi.classList.remove('bg-primary-container', 'text-on-primary-container');
        elements.engineWebApi.classList.add('text-outline', 'opacity-60');
      }
    } else {
      if (elements.engineWebApi) {
        elements.engineWebApi.classList.add('bg-primary-container', 'text-on-primary-container');
        elements.engineWebApi.classList.remove('text-outline', 'opacity-60');
      }
      elements.engineNatural.classList.remove('bg-primary-container', 'text-on-primary-container');
      elements.engineNatural.classList.add('text-outline', 'opacity-60');
    }
  }
}

// Switch between input types (TTS, Upload, Link)
function switchInputType(inputType) {
  if (!['tts', 'upload', 'link'].includes(inputType)) {
    showError('Invalid input type selected');
    return;
  }
  
  state.currentInputType = inputType;
  setActiveInputTab(inputType);
  
  // Show/hide appropriate sections based on input type
  showInputSection(inputType);
}

// Set active input tab in UI
function setActiveInputTab(inputType) {
  const tabs = {
    tts: elements.tabTts,
    upload: elements.tabUpload,
    link: elements.tabLink
  };
  
  Object.keys(tabs).forEach(type => {
    const tab = tabs[type];
    if (tab) {
      if (type === inputType) {
        tab.classList.add('active-tab', 'bg-surface-container-high', 'border-b-2', 'border-primary-container', 'text-primary');
        tab.classList.remove('bg-surface-container', 'text-outline', 'opacity-70');
      } else {
        tab.classList.remove('active-tab', 'bg-surface-container-high', 'border-b-2', 'border-primary-container', 'text-primary');
        tab.classList.add('bg-surface-container', 'text-outline', 'opacity-70');
      }
    }
  });
}

// Show appropriate input section based on current input type
function showInputSection(inputType) {
  // Hide all sections first
  if (elements.uploadSection) {
    elements.uploadSection.classList.add('hidden');
  }
  if (elements.linkSection) {
    elements.linkSection.classList.add('hidden');
  }
  
  // Show the appropriate section
  switch (inputType) {
    case 'tts':
      // Text input is always visible, just show status
      showStatus('Text to Speech mode activated');
      break;
    case 'upload':
      if (elements.uploadSection) {
        elements.uploadSection.classList.remove('hidden');
      }
      showStatus('File Upload mode activated. Select a file to process.');
      break;
    case 'link':
      if (elements.linkSection) {
        elements.linkSection.classList.remove('hidden');
      }
      showStatus('Link/Paste mode activated. Paste your content or provide a link.');
      break;
  }
}

// Handle the generate speech action
async function handleGenerateSpeech() {
  if (state.isProcessing) {
    showStatus('Already processing, please wait...');
    return;
  }
  
  const inputText = getInputText();
  
  if (!inputText || inputText.trim().length === 0) {
    showError('Please enter some text to convert to speech');
    return;
  }
  
  if (inputText.length > 5000) {
    showError('Text exceeds maximum length of 5000 characters');
    return;
  }
  
  state.isProcessing = true;
  showStatus(`Generating speech using ${state.currentEngine === 'natural' ? 'Natural Voice' : 'Web Speech API'}...`);
  
  try {
    if (state.currentEngine === 'webapi') {
      await generateWithWebSpeechAPI(inputText);
    } else {
      await generateWithNaturalVoiceAPI(inputText);
    }
    
    showStatus('Speech generated successfully!', 'success');
  } catch (error) {
    console.error('Error generating speech:', error);
    showError(`Failed to generate speech: ${error.message}`);
  } finally {
    state.isProcessing = false;
  }
}

// Get input text based on current input type
function getInputText() {
  switch (state.currentInputType) {
    case 'tts':
      return elements.textArea ? elements.textArea.value : '';
    case 'link':
      // In a real implementation, this would fetch content from a link
      // or return pasted text
      return elements.textArea ? elements.textArea.value : '';
    case 'upload':
      // This would be populated after OCR processing
      return elements.textArea ? elements.textArea.value : '';
    default:
      return '';
  }
}

// Generate speech using Web Speech API
function generateWithWebSpeechAPI(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Web Speech API not supported in this browser'));
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply audio settings
    utterance.rate = state.audioSettings.speed;
    utterance.pitch = state.audioSettings.pitch;
    utterance.volume = state.audioSettings.volume;
    
    // Select voice if available
    if (state.selectedVoice) {
      utterance.voice = state.selectedVoice;
    } else {
      // Use default voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }
    }
    
    utterance.onend = () => {
      resolve();
    };
    
    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };
    
    window.speechSynthesis.speak(utterance);
  });
}

// Generate speech using Natural Voice API
async function generateWithNaturalVoiceAPI(text) {
  if (!CONFIG.API_BASE_URL) {
    throw new Error('Natural Voice API endpoint not configured');
  }
  
  // Check authentication
  if (!state.isAuthenticated || !state.token) {
    throw new Error('Please sign in to use Natural Voice API');
  }
  
  // Sanitize input text
  const sanitizedText = sanitizeInput(text);
  
  const requestBody = {
    text: sanitizedText,
    lang: getSelectedLanguage()
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/content/tts-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        clearAuth();
        throw new Error('Session expired. Please sign in again.');
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
    }
    
    const audioBlob = await response.blob();
    
    // Create audio element and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    state.currentAudio = audio;
    
    // Play the audio
    await audio.play();
    state.isPlaying = true;
    
    // Clean up object URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      state.isPlaying = false;
      state.currentAudio = null;
    };
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// Handle file upload for OCR processing
async function handleFileUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file
  if (!validateFile(file)) {
    return;
  }
  
  // Show file preview
  if (elements.filePreview) {
    elements.filePreview.classList.remove('hidden');
  }
  if (elements.fileName) {
    elements.fileName.textContent = file.name;
  }
  if (elements.fileSize) {
    elements.fileSize.textContent = formatFileSize(file.size);
  }
  if (elements.dropZone) {
    elements.dropZone.classList.add('hidden');
  }
  
  state.isProcessing = true;
  showStatus('Processing file with OCR...');
  
  try {
    let extractedText;
    const isDocument = CONFIG.SUPPORTED_DOCUMENT_FORMATS.includes(file.type);
    
    if (isDocument) {
      extractedText = await extractDocument(file);
    } else {
      extractedText = await performOCR(file);
    }
    
    // Update the text area with extracted text
    if (elements.textArea) {
      elements.textArea.value = extractedText;
      updateCharacterCount();
    }
    
    showStatus('Text extraction completed successfully. Click "Generate Speech" to convert to audio.', 'success');
  } catch (error) {
    console.error('Text extraction error:', error);
    showError(`Text extraction failed: ${error.message}`);
  } finally {
    state.isProcessing = false;
    // Reset file input
    if (elements.fileInput) {
      elements.fileInput.value = '';
    }
  }
}

// Validate uploaded file
function validateFile(file) {
  // Check file size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    showError(`File size exceeds maximum limit of ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    return false;
  }
  
  // Check file type
  const supportedTypes = [...CONFIG.SUPPORTED_IMAGE_FORMATS, ...CONFIG.SUPPORTED_DOCUMENT_FORMATS];
  if (!supportedTypes.includes(file.type)) {
    showError(`Unsupported file type. Supported formats: ${[...CONFIG.SUPPORTED_IMAGE_FORMATS, ...CONFIG.SUPPORTED_DOCUMENT_FORMATS].join(', ')}`);
    return false;
  }
  
  return true;
}

// Format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Extract text from PDF or DOCX using backend API
async function extractDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  let endpoint;
  if (file.type === 'application/pdf') {
    endpoint = '/api/content/extract-pdf';
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    endpoint = '/api/content/extract-docx';
  } else {
    throw new Error('Unsupported document type');
  }
  
  const response = await fetch(CONFIG.API_BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract document text');
  }
  
  const data = await response.json();
  return data.text;
}

// Perform OCR on the uploaded file using Tesseract.js
async function performOCR(file) {
  // Dynamically import Tesseract.js if not already loaded
  if (typeof Tesseract === 'undefined') {
    // Load Tesseract.js script dynamically
    await loadScript('https://unpkg.com/tesseract.js@v4.1.1/dist/tesseract.min.js');
  }
  
  return new Promise((resolve, reject) => {
    Tesseract.recognize(
      file,
      'eng', // Language - could be made configurable
      {
        logger: (progress) => {
          showStatus(`OCR in progress: ${Math.round(progress.progress * 100)}%`);
        }
      }
    ).then((result) => {
      resolve(result.data.text);
    }).catch((error) => {
      reject(error);
    });
  });
}

// Load external script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Handle fetch URL
async function handleFetchUrl() {
  const url = elements.urlInput ? elements.urlInput.value.trim() : '';
  
  if (!url) {
    showError('Please enter a URL');
    return;
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    showError('Please enter a valid URL');
    return;
  }
  
  state.isProcessing = true;
  showStatus('Fetching content from URL...');
  
  try {
    const response = await fetch(CONFIG.API_BASE_URL + '/api/content/fetch-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch URL');
    }
    
    const data = await response.json();
    const text = data.text;
    
    // Update the text area with fetched content
    if (elements.textArea) {
      // Extract text content from HTML (basic implementation)
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const bodyText = doc.body ? doc.body.textContent || doc.body.innerText : text;
      elements.textArea.value = bodyText.trim().substring(0, 5000); // Limit to 5000 chars
      updateCharacterCount();
    }
    
    showStatus('Content fetched successfully!', 'success');
  } catch (error) {
    console.error('Fetch URL error:', error);
    showError(`Failed to fetch URL: ${error.message}. Note: CORS restrictions may prevent fetching some URLs.`);
  } finally {
    state.isProcessing = false;
  }
}

// Toggle audio playback
function toggleAudioPlayback() {
  if (state.currentAudio) {
    if (state.isPlaying) {
      state.currentAudio.pause();
      state.isPlaying = false;
      showStatus('Audio paused');
    } else {
      state.currentAudio.play();
      state.isPlaying = true;
      showStatus('Audio playing');
    }
  } else {
    showStatus('No audio to play. Generate speech first.');
  }
}

// Download generated audio
function downloadAudio() {
  if (state.currentAudio && state.currentAudio.src) {
    const link = document.createElement('a');
    link.href = state.currentAudio.src;
    link.download = `vocastream_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('Audio download started', 'success');
  } else {
    showError('No audio to download. Generate speech first.');
  }
}

// Reset studio to initial state
function resetStudio() {
  if (elements.textArea) {
    elements.textArea.value = '';
    updateCharacterCount();
  }
  
  // Reset to default engine
  switchEngine('webapi');
  
  // Reset to default input type
  switchInputType('tts');
  
  // Reset audio settings to defaults
  state.audioSettings = {
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0
  };
  
  if (elements.speedSlider) {
    elements.speedSlider.value = state.audioSettings.speed;
    if (elements.speedValue) {
      elements.speedValue.textContent = `${state.audioSettings.speed.toFixed(1)}x`;
    }
  }
  
  if (elements.pitchSlider) {
    elements.pitchSlider.value = state.audioSettings.pitch;
    if (elements.pitchValue) {
      elements.pitchValue.textContent = getPitchLabel(state.audioSettings.pitch);
    }
  }
  
  if (elements.gainSlider) {
    elements.gainSlider.value = state.audioSettings.volume;
    if (elements.gainValue) {
      elements.gainValue.textContent = `${state.audioSettings.volume > 0 ? '+' : ''}${state.audioSettings.volume.toFixed(1)} dB`;
    }
  }
  
  // Reset file upload
  if (elements.fileInput) {
    elements.fileInput.value = '';
  }
  if (elements.filePreview) {
    elements.filePreview.classList.add('hidden');
  }
  if (elements.dropZone) {
    elements.dropZone.classList.remove('hidden');
  }
  
  // Reset URL input
  if (elements.urlInput) {
    elements.urlInput.value = '';
  }
  
  // Stop any playing audio
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
    state.isPlaying = false;
  }
  
  showStatus('Studio reset to default state', 'success');
}

// Update character count display
function updateCharacterCount() {
  if (elements.textArea) {
    const count = elements.textArea.value.length;
    const counterElement = document.querySelector('span.text-outline.font-label');
    if (counterElement) {
      counterElement.textContent = `${count} / 5000 characters`;
    }
  }
}

// Get pitch label based on value
function getPitchLabel(pitchValue) {
  if (pitchValue < 0.7) return 'Very Low';
  if (pitchValue < 0.9) return 'Low';
  if (pitchValue <= 1.1) return 'Neutral';
  if (pitchValue <= 1.3) return 'High';
  return 'Very High';
}

// Get selected language
function getSelectedLanguage() {
  if (elements.languageSelect && elements.languageSelect.value) {
    return elements.languageSelect.value.split('(')[0].trim(); // Extract language from "English (US)"
  }
  return 'en-US'; // Default
}

// Sanitize input text
function sanitizeInput(text) {
  // Remove potentially dangerous characters/sequences
  // This is a basic sanitization - implement more thorough sanitization as needed
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Check Web Speech API support
function checkWebSpeechSupport() {
  if (!window.speechSynthesis) {
    showStatus('Warning: Web Speech API not supported in this browser. Natural Voice engine recommended.', 'warning');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  if (elements.statusIndicator) {
    elements.statusIndicator.textContent = message;
    elements.statusIndicator.style.display = 'block';
    
    // Set color based on type
    switch (type) {
      case 'error':
        elements.statusIndicator.style.background = '#dc2626';
        break;
      case 'warning':
        elements.statusIndicator.style.background = '#f59e0b';
        break;
      case 'success':
        elements.statusIndicator.style.background = '#16a34a';
        break;
      default:
        elements.statusIndicator.style.background = '#333';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      elements.statusIndicator.style.display = 'none';
    }, 5000);
  }
}

// Show error message
function showError(message) {
  showStatus(message, 'error');
  console.error('VOCASTREAM Error:', message);
}

// Set API configuration
function setAPIConfig(apiEndpoint, apiKey) {
  CONFIG.API_BASE_URL = apiEndpoint;
  CONFIG.API_KEY = apiKey;
  console.log('API configuration updated');
}

// Handle sign in form submission
async function handleSignIn(event) {
  event.preventDefault();
  
  const email = document.getElementById('signin-email').value.toLowerCase();
  const password = document.getElementById('signin-password').value;
  
  // Basic validation
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  try {
    showStatus('Signing in...', 'info');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    
    // Save authentication data
    saveAuth(data.token, data.user);
    
    showStatus('Sign in successful! Redirecting to studio...', 'success');
    
    // Redirect to studio page after a short delay
    setTimeout(() => {
      window.location.href = 'studio.html';
    }, 1500);
    
  } catch (error) {
    console.error('Sign in error:', error);
    showError(error.message || 'Failed to sign in. Please check your credentials.');
  }
}

// Handle sign up form submission
async function handleSignUp(event) {
  event.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value.toLowerCase();
  const password = document.getElementById('signup-password').value;
  
  // Basic validation
  if (!name || !email || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Password validation (minimum 8 characters with complexity)
  if (password.length < 8) {
    showError('Password must be at least 8 characters long');
    return;
  }
  
  // Check password complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const complexityCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  
  if (complexityCount < 3) {
    showError('Password must contain at least 3 of: uppercase, lowercase, number, special character');
    return;
  }
  
  try {
    showStatus('Creating account...', 'info');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Registration failed');
    }
    
    showStatus('Account created successfully! Please sign in.', 'success');
    
    // Redirect to sign-in page after a short delay
    setTimeout(() => {
      window.location.href = 'sign-in.html';
    }, 1500);
    
  } catch (error) {
    console.error('Sign up error:', error);
    showError(error.message || 'Failed to create account. Please try again.');
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication for studio page
  if (window.location.pathname.includes('studio.html')) {
    if (!checkAuth()) {
      showStatus('Please sign in to access the studio', 'warning');
      setTimeout(() => {
        window.location.href = 'sign-in.html';
      }, 2000);
      return;
    }
  }
  
  init();
});

// Export functions for external use if needed
if (typeof window !== 'undefined') {
  window.VOCASTREAM = {
    init,
    setAPIConfig,
    generateWithNaturalVoiceAPI,
    generateWithWebSpeechAPI
  };
}
