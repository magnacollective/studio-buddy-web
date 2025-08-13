# Studio Buddy Web - Audio Mastering Professional

A web-based version of the Studio Buddy iOS app, featuring Windows 95 themed UI and professional audio mastering capabilities.

## Features

### 🎵 Audio Mastering
- **Matchering-style Reference Mastering**: Upload a reference track for intelligent matching
- **Intelligent Mastering**: AI-powered mastering without reference tracks
- **Real-time Processing**: Advanced psychoacoustic processing and iterative correction
- **Professional Controls**: Output level, compression, EQ intensity, stereo width

### 📊 Audio Analysis  
- **BPM Detection**: Accurate tempo detection using spectral flux and autocorrelation
- **Key Detection**: Musical key identification using Krumhansl-Schmuckler profiles
- **Frequency Analysis**: Real-time spectrum visualization
- **Audio Metrics**: Duration, sample rate, and format information

### 🎨 Windows 95 Interface
- **Authentic Design**: Pixel-perfect Windows 95 UI elements
- **Desktop Icons**: Clickable desktop shortcuts
- **Multiple Windows**: Draggable, resizable windows with taskbar
- **Matrix Background**: Animated Matrix-style background effect

## Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- Audio files in common formats (MP3, WAV, OGG, M4A)

### Installation
1. Clone or download the project files
2. Open `index.html` in a web browser
3. No server required - runs completely client-side

### Usage

#### Audio Mastering
1. Click the "Studio Buddy" desktop icon
2. Upload your source audio file
3. Optionally upload a reference track for Matchering-style processing
4. Adjust settings (output level, compression, EQ intensity, stereo width)
5. Click "Master Audio" to process
6. Listen to the result and download when satisfied

#### Audio Analysis  
1. Click the "Key/BPM Analyzer" desktop icon
2. Upload an audio file for analysis
3. Click "Analyze" to detect BPM, key, and view frequency spectrum
4. Results display tempo, musical key, and audio characteristics

#### Settings
1. Click the "Settings" desktop icon  
2. Configure audio processing options:
   - Auto-normalize output
   - Enable brickwall limiting
   - Psychoacoustic processing
   - Buffer size and quality settings

## Technical Implementation

### Audio Processing Engine
The app implements a sophisticated audio processing pipeline:

- **Iterative Matchering Algorithm**: 3-pass gentle correction system
- **Psychoacoustic Processing**: Frequency-aware processing based on human hearing
- **Dynamic Range Management**: Intelligent compression and limiting
- **Frequency Response Matching**: Multi-band EQ with perceptual weighting

### Audio Analysis
- **BPM Detection**: Spectral flux novelty curve + autocorrelation analysis
- **Key Detection**: Chroma vector analysis with Krumhansl-Schmuckler key profiles  
- **FFT Analysis**: Real-time frequency domain processing

### Web Audio API
- Client-side audio processing using Web Audio API
- No server required - all processing happens in browser
- Support for multiple audio formats via HTML5 Audio

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 66+
- ✅ Firefox 60+  
- ✅ Safari 14+
- ✅ Edge 79+

### Required Features
- Web Audio API
- FileReader API
- Canvas API (for visualizations)
- ES6+ JavaScript support

## File Structure

```
web/
├── index.html              # Main HTML structure
├── styles.css              # Windows 95 themed CSS
├── script.js               # Main application logic
├── audio-processor.js      # Audio mastering engine
├── audio-analyzer.js       # BPM/key detection engine
└── README.md              # This file
```

## Differences from iOS Version

### Advantages
- ✅ Cross-platform compatibility
- ✅ No app store installation required
- ✅ Immediate updates without app store approval
- ✅ Desktop-class UI with multiple windows

### Limitations  
- ⚠️ Processing is limited by browser performance
- ⚠️ File size limits based on browser memory
- ⚠️ No offline processing without internet connection
- ⚠️ Limited to Web Audio API capabilities

## Performance Notes

### Optimization Tips
- Use smaller files (< 50MB) for best performance
- Enable hardware acceleration in browser settings  
- Close other browser tabs during processing
- Use "Draft" quality for faster processing on slower devices

### Processing Times
- **Draft Quality**: ~30 seconds for 3-minute track
- **Standard Quality**: ~1-2 minutes for 3-minute track  
- **High Quality**: ~2-3 minutes for 3-minute track
- **Ultimate Quality**: ~3-5 minutes for 3-minute track

## Troubleshooting

### Common Issues

**Audio won't play**
- Ensure browser supports the audio format
- Check that audio context is resumed (click play after loading)

**Processing is slow**
- Reduce quality setting in Settings
- Use smaller audio files
- Close other browser tabs

**UI elements not displaying correctly**
- Ensure CSS is loaded properly
- Check browser compatibility
- Try hard refresh (Ctrl+F5)

## Credits

### Original iOS App
- Based on Studio Buddy iOS app
- Ported to web by preserving core mastering algorithms
- Maintains professional audio quality standards

### Technologies Used
- Web Audio API for audio processing
- HTML5 Canvas for visualizations
- CSS3 for Windows 95 UI recreation
- Vanilla JavaScript (no frameworks required)

### Audio Algorithms
- Matchering algorithm inspired by https://github.com/sergree/matchering
- Krumhansl-Schmuckler key detection profiles
- Psychoacoustic processing based on ISO 226 hearing model

## License

This web version maintains the same licensing as the original iOS Studio Buddy app.

---

**Studio Buddy Web** - Professional audio mastering in your browser with authentic Windows 95 style! 🎵✨