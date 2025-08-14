# Railway API Integration

This web client has been updated to use **Railway API only** for audio analysis and stem separation, removing all client-side analysis fallbacks.

## 🚀 What Changed

### ✅ **ADDED - Railway API Integration**
- `railway-api-manager.js` - Complete Railway API integration
- Server-side HTDemucs AI vocal separation 
- Advanced BPM/key analysis using professional algorithms
- No client-side processing fallback

### ❌ **REMOVED - Client-Side Analysis**
- `audio-analyzer.js` - Basic client-side BPM detection 
- `tunebat-analyzer.js` - TuneBat-style analysis
- `enhanced-audio-manager.js` - Client-side ensemble methods
- All local audio processing fallbacks

## 🎯 Features

### Audio Analysis (Railway API)
- **BPM Detection**: HTDemucs + advanced autocorrelation
- **Key Detection**: Dual chroma analysis with confidence scoring  
- **Professional Quality**: Uses same algorithms as professional DAWs
- **Fast Processing**: Optimized for web delivery
- **Multiple Backends**: Librosa + Madmom RNN/DBN options

### Stem Separation (Railway API)
- **AI-Powered**: HTDemucs Hybrid Transformer neural network
- **4-Stem Output**: Vocals, Instrumental, Drums, Bass
- **High Quality**: Professional studio separation quality
- **Auto-Download**: Separated stems delivered as WAV files

## 🔧 API Endpoints

### Base URL
```
https://vocal-remover-production.up.railway.app
```

### Analysis Endpoint
```http
POST /analyze
Content-Type: multipart/form-data

Parameters:
- audio: Audio file (WAV, MP3, M4A, etc.)
- window_sec: Analysis window (15-180s, default: 75)
- prefer_min_bpm: Minimum BPM (40-200, default: 90)  
- prefer_max_bpm: Maximum BPM (60-240, default: 180)
- genre: Genre hint (edm, hiphop, pop, house, techno, trap)
- profile: Analysis profile (fast, accurate)
- backend: Analysis backend (librosa, pro)

Response:
{
  "bpm": 128.5,
  "key": "A Minor", 
  "duration": "3:45",
  "sample_rate": "44100 Hz",
  "bpm_candidates": [{"bpm": 128.5, "confidence": 0.95}],
  "key_candidates": [{"key": "A Minor", "confidence": 0.87}]
}
```

### Stem Separation Endpoint  
```http
POST /separate?stem_type={vocals|instrumental|drums|bass}
Content-Type: multipart/form-data

Parameters:
- audio: Audio file
- stem_type: Type of stem to extract

Response: WAV audio file (binary)
```

### Health Check
```http
GET /health
Response: {"status": "healthy"}
```

### Version Info
```http
GET /version  
Response: {"commit": "abc123", "build_time": "2024-01-01T00:00:00Z"}
```

## 🧪 Testing

Open `railway-api-test.html` in a browser to test:

1. **API Health Check** - Verify connection to Railway API
2. **Audio Analysis** - Upload audio file and get BPM/key analysis
3. **Stem Separation** - Extract vocals, instrumental, drums, bass

## 🔧 Configuration

The Railway API manager includes:
- **Auto-retry logic** with exponential backoff
- **Request timeout** (60 seconds for analysis)
- **Error handling** with detailed error messages  
- **File format conversion** (AudioBuffer → WAV)
- **Progress tracking** and user notifications

## 📝 Error Handling

The system handles common error scenarios:
- **Network timeouts** - Retries with backoff
- **API unavailable** - Clear error messages
- **Invalid audio files** - Format validation
- **Large files** - Progress indication
- **Rate limits** - Graceful degradation

## 🚦 No Fallback Policy

This implementation has **NO CLIENT-SIDE FALLBACK**:
- All analysis happens on Railway API servers
- No local processing if API is unavailable  
- Clear error messages guide users to try again
- Better user experience with professional quality results

## 📱 Browser Support

Requires modern browsers with:
- Web Audio API
- Fetch API  
- File API
- Promise support

Tested on:
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

## 🔒 Security

- No audio data stored on client
- All processing happens server-side
- Secure HTTPS connections
- No API keys exposed to client