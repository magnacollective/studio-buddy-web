// Railway API Manager - Server-Side Analysis Only
// Replaces all client-side analysis with Railway API calls

class RailwayAPIManager {
    constructor() {
        // Railway production API endpoint
        this.baseURL = 'https://vocal-remover-production-1bbc.up.railway.app';
        this.requestTimeout = 60000; // 60 seconds for analysis
        this.maxRetries = 2;
    }

    async analyzeAudio(audioBuffer, options = {}) {
        const startTime = performance.now();
        console.log('🚀 Railway API analysis starting...');

        try {
            // Convert AudioBuffer to File/Blob for upload
            const audioFile = await this.audioBufferToFile(audioBuffer);
            
            // Call Railway API for analysis
            const result = await this.callAnalyzeEndpoint(audioFile, options);
            
            console.log(`✅ Railway API analysis complete (${(performance.now() - startTime).toFixed(1)}ms)`);
            return result;

        } catch (error) {
            console.error('❌ Railway API analysis error:', error);
            throw new Error(`Railway API analysis failed: ${error.message}`);
        }
    }

    async separateStems(audioBuffer, stemType = 'instrumental') {
        const startTime = performance.now();
        console.log(`🎵 Railway API stem separation starting (${stemType})...`);

        try {
            // Convert AudioBuffer to File/Blob for upload
            const audioFile = await this.audioBufferToFile(audioBuffer);
            
            // Call Railway API for stem separation
            const result = await this.callSeparateEndpoint(audioFile, stemType);
            
            console.log(`✅ Railway API stem separation complete (${(performance.now() - startTime).toFixed(1)}ms)`);
            return result;

        } catch (error) {
            console.error('❌ Railway API stem separation error:', error);
            throw new Error(`Railway API stem separation failed: ${error.message}`);
        }
    }

    async callAnalyzeEndpoint(audioFile, options = {}) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // Add analysis options
        if (options.window_sec) formData.append('window_sec', options.window_sec);
        if (options.prefer_min_bpm) formData.append('prefer_min_bpm', options.prefer_min_bpm);
        if (options.prefer_max_bpm) formData.append('prefer_max_bpm', options.prefer_max_bpm);
        if (options.genre) formData.append('genre', options.genre);
        if (options.profile) formData.append('profile', options.profile);
        if (options.backend) formData.append('backend', options.backend);

        const response = await this.makeRequest(`${this.baseURL}/analyze`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Analysis request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Transform to expected format
        return {
            bpm: result.bpm,
            key: result.key,
            duration: result.duration,
            sampleRate: result.sample_rate,
            bpmCandidates: result.bpm_candidates || [],
            keyCandidates: result.key_candidates || [],
            analysisMethod: 'railway-api',
            confidence: this.calculateConfidenceFromCandidates(result)
        };
    }

    async callSeparateEndpoint(audioFile, stemType) {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await this.makeRequest(`${this.baseURL}/separate?stem_type=${encodeURIComponent(stemType)}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Separation request failed: ${response.status} ${response.statusText}`);
        }

        // Return the audio blob for playback/download
        const audioBlob = await response.blob();
        return {
            audioBlob: audioBlob,
            stemType: stemType,
            analysisMethod: 'railway-api'
        };
    }

    async makeRequest(url, options, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...options.headers,
                    // Don't set Content-Type for FormData - browser will set it with boundary
                }
            });

            clearTimeout(timeoutId);
            return response;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.requestTimeout / 1000}s`);
            }

            // Retry logic
            if (retryCount < this.maxRetries && this.isRetryableError(error)) {
                console.warn(`Request failed, retrying... (${retryCount + 1}/${this.maxRetries})`);
                await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                return this.makeRequest(url, options, retryCount + 1);
            }

            throw error;
        }
    }

    async audioBufferToFile(audioBuffer) {
        // Convert AudioBuffer to WAV file
        const wavBlob = this.audioBufferToWav(audioBuffer);
        
        // Create File object with proper name
        return new File([wavBlob], 'audio.wav', { 
            type: 'audio/wav',
            lastModified: Date.now()
        });
    }

    audioBufferToWav(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length * numChannels * 2; // 16-bit samples
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // PCM format
        view.setUint16(20, 1, true); // Format code
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true); // Bits per sample
        writeString(36, 'data');
        view.setUint32(40, length, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    calculateConfidenceFromCandidates(result) {
        // Calculate overall confidence from BPM and key candidates
        const bpmConf = result.bpm_candidates?.[0]?.confidence || 0.5;
        const keyConf = result.key_candidates?.[0]?.confidence || 0.5;
        return (bpmConf + keyConf) / 2;
    }

    isRetryableError(error) {
        // Retry on network errors, not on 4xx client errors
        return !error.message.includes('400') && 
               !error.message.includes('401') && 
               !error.message.includes('403') && 
               !error.message.includes('404');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health check
    async checkHealth() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/health`, {
                method: 'GET'
            });
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    // Get API version info
    async getVersion() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/version`, {
                method: 'GET'
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Version check failed:', error);
        }
        return null;
    }
}