// Main application JavaScript for Studio Buddy Web

class StudioBuddyApp {
    constructor() {
        this.audioContext = null;
        this.sourceBuffer = null;
        this.referenceBuffer = null;
        this.masteredBuffer = null;
        this.currentlyPlaying = null;
        this.audioProcessor = null;
        this.audioAnalyzer = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioProcessor = new AudioProcessor(this.audioContext);
            this.audioAnalyzer = new AudioAnalyzer(this.audioContext);
            
            this.setupEventListeners();
            this.setupMatrixBackground();
            this.updateClock();
            
            console.log('Studio Buddy Web initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Studio Buddy:', error);
            alert('Failed to initialize audio system. Please check browser compatibility.');
        }
    }

    setupEventListeners() {
        // Desktop icon clicks
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                const windowId = e.currentTarget.dataset.window;
                console.log('Desktop icon clicked:', windowId);
                this.openWindow(windowId);
            });
        });

        // File inputs
        document.getElementById('source-file').addEventListener('change', (e) => {
            this.handleSourceFile(e.target.files[0]);
        });

        document.getElementById('reference-file').addEventListener('change', (e) => {
            this.handleReferenceFile(e.target.files[0]);
        });

        document.getElementById('analyze-file').addEventListener('change', (e) => {
            this.handleAnalyzeFile(e.target.files[0]);
        });

        // Control sliders
        this.setupSliderListeners();

        // Buttons
        document.getElementById('master-button').addEventListener('click', () => {
            this.masterAudio();
        });

        document.getElementById('analyze-button').addEventListener('click', () => {
            this.analyzeAudio();
        });

        // Playback controls
        document.getElementById('play-source').addEventListener('click', () => {
            this.playAudio('source');
        });

        document.getElementById('play-reference').addEventListener('click', () => {
            this.playAudio('reference');
        });

        document.getElementById('play-mastered').addEventListener('click', () => {
            this.playAudio('mastered');
        });

        document.getElementById('download-mastered').addEventListener('click', () => {
            this.downloadMastered();
        });

        // Start button
        document.querySelector('.start-button').addEventListener('click', () => {
            this.closeAllWindows();
        });

        // Desktop click to deselect
        document.getElementById('desktop').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.querySelectorAll('.desktop-icon').forEach(icon => {
                    icon.classList.remove('selected');
                });
            }
        });
    }

    setupSliderListeners() {
        const sliders = [
            { id: 'output-level', valueId: 'output-level-value', suffix: ' dB' },
            { id: 'compression', valueId: 'compression-value', suffix: '' },
            { id: 'eq-intensity', valueId: 'eq-intensity-value', suffix: '%' },
            { id: 'stereo-width', valueId: 'stereo-width-value', suffix: '%' }
        ];

        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            
            element.addEventListener('input', (e) => {
                valueElement.textContent = e.target.value + slider.suffix;
            });
        });
    }

    async handleSourceFile(file) {
        if (!file) return;

        try {
            this.showProgress('Loading source audio...');
            const arrayBuffer = await file.arrayBuffer();
            this.sourceBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            document.getElementById('source-info').textContent = 
                `${file.name} - ${this.formatDuration(this.sourceBuffer.duration)} - ${this.sourceBuffer.sampleRate}Hz`;
            
            document.getElementById('play-source').disabled = false;
            document.getElementById('master-button').disabled = false;
            
            this.hideProgress();
            this.drawWaveform(this.sourceBuffer);
        } catch (error) {
            console.error('Error loading source file:', error);
            alert('Error loading source file. Please check the file format.');
            this.hideProgress();
        }
    }

    async handleReferenceFile(file) {
        if (!file) return;

        try {
            this.showProgress('Loading reference audio...');
            const arrayBuffer = await file.arrayBuffer();
            this.referenceBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            document.getElementById('reference-info').textContent = 
                `${file.name} - ${this.formatDuration(this.referenceBuffer.duration)} - ${this.referenceBuffer.sampleRate}Hz`;
            
            document.getElementById('play-reference').disabled = false;
            this.hideProgress();
        } catch (error) {
            console.error('Error loading reference file:', error);
            alert('Error loading reference file. Please check the file format.');
            this.hideProgress();
        }
    }

    async handleAnalyzeFile(file) {
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            document.getElementById('analyze-button').disabled = false;
            this.analyzeBuffer = audioBuffer;
        } catch (error) {
            console.error('Error loading analyze file:', error);
            alert('Error loading file for analysis.');
        }
    }

    async masterAudio() {
        if (!this.sourceBuffer) {
            alert('Please load a source audio file first.');
            return;
        }

        try {
            this.showProgress('Mastering audio...');
            
            const settings = this.getProcessingSettings();
            
            // Use reference if available, otherwise use intelligent mastering
            if (this.referenceBuffer) {
                this.masteredBuffer = await this.audioProcessor.matcheringMaster(
                    this.sourceBuffer, 
                    this.referenceBuffer, 
                    settings
                );
            } else {
                this.masteredBuffer = await this.audioProcessor.intelligentMaster(
                    this.sourceBuffer, 
                    settings
                );
            }
            
            document.getElementById('play-mastered').disabled = false;
            document.getElementById('download-mastered').disabled = false;
            
            this.hideProgress();
            this.drawWaveform(this.masteredBuffer);
            
            alert('Audio mastering completed successfully!');
        } catch (error) {
            console.error('Error mastering audio:', error);
            alert('Error during audio mastering. Please try again.');
            this.hideProgress();
        }
    }

    async analyzeAudio() {
        if (!this.analyzeBuffer) {
            alert('Please load an audio file for analysis first.');
            return;
        }

        try {
            this.showProgress('Analyzing audio...');
            
            const analysis = await this.audioAnalyzer.analyzeAudio(this.analyzeBuffer);
            
            document.getElementById('bpm-result').textContent = Math.round(analysis.bpm) + ' BPM';
            document.getElementById('key-result').textContent = analysis.key;
            document.getElementById('duration-result').textContent = this.formatDuration(this.analyzeBuffer.duration);
            document.getElementById('samplerate-result').textContent = this.analyzeBuffer.sampleRate + ' Hz';
            
            this.drawSpectrum(analysis.spectrum);
            this.hideProgress();
        } catch (error) {
            console.error('Error analyzing audio:', error);
            alert('Error during audio analysis.');
            this.hideProgress();
        }
    }

    getProcessingSettings() {
        return {
            outputLevel: parseFloat(document.getElementById('output-level').value),
            compression: parseInt(document.getElementById('compression').value),
            eqIntensity: parseInt(document.getElementById('eq-intensity').value) / 100,
            stereoWidth: parseInt(document.getElementById('stereo-width').value) / 100,
            autoNormalize: document.getElementById('auto-normalize').checked,
            enableLimiting: document.getElementById('enable-limiting').checked,
            psychoacousticProcessing: document.getElementById('psychoacoustic-processing').checked,
            bufferSize: parseInt(document.getElementById('buffer-size').value),
            quality: document.getElementById('quality-setting').value
        };
    }

    async playAudio(type) {
        if (this.currentlyPlaying) {
            this.currentlyPlaying.stop();
            this.currentlyPlaying = null;
        }

        let buffer;
        switch (type) {
            case 'source':
                buffer = this.sourceBuffer;
                break;
            case 'reference':
                buffer = this.referenceBuffer;
                break;
            case 'mastered':
                buffer = this.masteredBuffer;
                break;
            default:
                return;
        }

        if (!buffer) return;

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start();
            
            this.currentlyPlaying = source;
            
            source.onended = () => {
                this.currentlyPlaying = null;
            };
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    downloadMastered() {
        if (!this.masteredBuffer) {
            alert('No mastered audio to download.');
            return;
        }

        try {
            const wav = this.audioBufferToWav(this.masteredBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mastered_audio.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error creating download file.');
        }
    }

    audioBufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    }

    drawWaveform(audioBuffer) {
        const canvas = document.getElementById('waveform-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (!audioBuffer) return;

        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.stroke();
    }

    drawSpectrum(spectrumData) {
        const canvas = document.getElementById('spectrum-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (!spectrumData || spectrumData.length === 0) return;

        const barWidth = width / spectrumData.length;
        ctx.fillStyle = '#00ff00';

        for (let i = 0; i < spectrumData.length; i++) {
            const barHeight = (spectrumData[i] / 255) * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
        }
    }

    openWindow(windowId) {
        console.log('Opening window:', windowId);
        const windowElement = document.getElementById(windowId + '-window');
        console.log('Window element found:', !!windowElement);
        if (windowElement) {
            windowElement.style.display = 'flex';
            this.addTaskButton(windowId);
            this.setActiveWindow(windowId);
        }
    }

    closeAllWindows() {
        document.querySelectorAll('.window').forEach(window => {
            window.style.display = 'none';
        });
        document.getElementById('task-buttons').innerHTML = '';
    }

    addTaskButton(windowId) {
        const taskButtons = document.getElementById('task-buttons');
        const existingButton = document.getElementById('task-' + windowId);
        
        if (existingButton) {
            this.setActiveTaskButton(windowId);
            return;
        }

        const button = document.createElement('button');
        button.className = 'task-button';
        button.id = 'task-' + windowId;
        
        const titles = {
            'studio-buddy': 'Studio Buddy',
            'analyzer': 'Key/BPM Analyzer',
            'settings': 'Settings'
        };
        
        button.textContent = titles[windowId] || windowId;
        button.addEventListener('click', () => {
            this.toggleWindow(windowId);
        });
        
        taskButtons.appendChild(button);
        this.setActiveTaskButton(windowId);
    }

    setActiveTaskButton(windowId) {
        document.querySelectorAll('.task-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.getElementById('task-' + windowId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    setActiveWindow(windowId) {
        document.querySelectorAll('.window').forEach(windowElement => {
            windowElement.style.zIndex = '10';
        });
        
        const windowElement = document.getElementById(windowId + '-window');
        if (windowElement) {
            windowElement.style.zIndex = '11';
            this.setActiveTaskButton(windowId);
        }
    }

    toggleWindow(windowId) {
        const windowElement = document.getElementById(windowId + '-window');
        if (windowElement.style.display === 'none') {
            windowElement.style.display = 'flex';
            this.setActiveWindow(windowId);
        } else {
            this.setActiveWindow(windowId);
        }
    }

    setupMatrixBackground() {
        const background = document.getElementById('matrix-background');
        const chars = '01アカサタナハマヤラワZΨΩαβγδελμπσφχψω';
        const columns = Math.floor(window.innerWidth / 20);
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = i * 20 + 'px';
            column.style.animationDuration = (Math.random() * 3 + 2) + 's';
            column.style.animationDelay = Math.random() * 2 + 's';
            
            let text = '';
            const length = Math.floor(Math.random() * 20) + 10;
            for (let j = 0; j < length; j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '\n';
            }
            column.textContent = text;
            
            background.appendChild(column);
        }
    }

    updateClock() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            document.getElementById('clock').textContent = timeString;
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    showProgress(text) {
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('progress-text').textContent = text;
        document.getElementById('progress-fill').style.width = '0%';
    }

    hideProgress() {
        document.getElementById('progress-container').style.display = 'none';
    }

    updateProgress(percent) {
        document.getElementById('progress-fill').style.width = percent + '%';
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Window control functions (global)
function closeWindow(windowId) {
    document.getElementById(windowId).style.display = 'none';
    const taskButtonId = 'task-' + windowId.replace('-window', '');
    const taskButton = document.getElementById(taskButtonId);
    if (taskButton) {
        taskButton.remove();
    }
}

function minimizeWindow(windowId) {
    document.getElementById(windowId).style.display = 'none';
}

function maximizeWindow(windowId) {
    const window = document.getElementById(windowId);
    window.classList.toggle('maximized');
}

// App initialization is now handled in index.html to ensure proper loading order