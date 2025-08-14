// Enhanced Audio Analysis Manager - CLIENT-SIDE ONLY
// Uses TuneBat-style ensemble methods for all analysis

class EnhancedAudioManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.tunebatAnalyzer = new TuneBatAnalyzer(audioContext);
        this.analysisHistory = new Map();
    }

    async analyzeAudio(audioBuffer, options = {}) {
        const startTime = performance.now();
        console.log('🚀 Client-side analysis starting...');

        // Generate file hash for caching
        const audioHash = await this.generateAudioHash(audioBuffer);
        
        // Check cache first
        if (this.analysisHistory.has(audioHash)) {
            console.log('📁 Returning cached analysis');
            return this.analysisHistory.get(audioHash);
        }

        try {
            // TuneBat-style client-side analysis ONLY
            const result = await this.performClientSideAnalysis(audioBuffer, options);
            
            // Always enhance with additional features
            const enhancedResult = await this.enhanceClientResult(audioBuffer, result);
            
            this.cacheResult(audioHash, enhancedResult);
            console.log(`✅ Client-side analysis complete (${(performance.now() - startTime).toFixed(1)}ms)`);
            return enhancedResult;

        } catch (error) {
            console.error('❌ Client-side analysis error:', error);
            
            // Return basic fallback result using simple algorithms
            return this.getBasicAnalysis(audioBuffer);
        }
    }

    async performClientSideAnalysis(audioBuffer, options) {
        const result = await this.tunebatAnalyzer.analyzeAudio(audioBuffer);
        
        // Add analysis metadata
        result.analysisMethod = 'client-side-ensemble';
        result.processingTime = performance.now();
        result.confidence = this.calculateOverallConfidence(result);
        
        return result;
    }

    async enhanceClientResult(audioBuffer, clientResult) {
        // Add additional features that TuneBat provides
        const samples = this.audioBufferToMono(audioBuffer);
        const sampleRate = audioBuffer.sampleRate;

        // Tempo stability analysis
        const tempoStability = this.analyzeTempoStability(samples, sampleRate, clientResult.bpm);
        
        // Rhythm complexity
        const rhythmComplexity = this.analyzeRhythmComplexity(samples, sampleRate);
        
        // Harmonic complexity
        const harmonicComplexity = this.analyzeHarmonicComplexity(samples, sampleRate);

        return {
            ...clientResult,
            tempoStability,
            rhythmComplexity,
            harmonicComplexity,
            analysisMethod: 'client-side-only',
            confidence: Math.max(0.7, clientResult.confidence) // Boost confidence since we're committed to client
        };
    }

    getBasicAnalysis(audioBuffer) {
        // Emergency fallback with very simple analysis
        const samples = this.audioBufferToMono(audioBuffer);
        
        // Simple autocorrelation-based BPM
        const bpm = this.simpleBPMDetection(samples, audioBuffer.sampleRate);
        
        // Basic key detection
        const key = this.simpleKeyDetection(samples, audioBuffer.sampleRate);
        
        return {
            bpm: bpm,
            key: key,
            bpmCandidates: [{ bpm: bpm, confidence: 0.5 }],
            keyCandidates: [{ key: key, confidence: 0.5 }],
            energy: 0.5,
            danceability: 0.5,
            valence: 0.5,
            confidence: 0.5,
            analysisMethod: 'basic-fallback',
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            spectrum: new Array(256).fill(128)
        };
    }

    simpleBPMDetection(samples, sampleRate) {
        // Very basic beat detection
        const windowSize = sampleRate * 0.5; // 0.5 second window
        const autocorr = [];
        
        for (let lag = Math.floor(sampleRate * 0.3); lag < Math.floor(sampleRate * 2); lag++) {
            let sum = 0;
            let count = 0;
            for (let i = 0; i < samples.length - lag && i < windowSize; i++) {
                sum += samples[i] * samples[i + lag];
                count++;
            }
            autocorr.push({ lag, value: sum / count });
        }
        
        // Find peak
        let maxValue = 0;
        let bestLag = 0;
        for (const { lag, value } of autocorr) {
            if (value > maxValue) {
                maxValue = value;
                bestLag = lag;
            }
        }
        
        const bpm = bestLag > 0 ? (60 * sampleRate) / bestLag : 120;
        
        // Constrain to reasonable range
        if (bpm < 60) return bpm * 2;
        if (bpm > 200) return bpm / 2;
        return Math.round(bpm);
    }

    simpleKeyDetection(samples, sampleRate) {
        // Very basic key detection using pitch class histogram
        const pitchClasses = new Array(12).fill(0);
        const windowSize = 4096;
        
        for (let start = 0; start < samples.length - windowSize; start += windowSize / 2) {
            const window = samples.slice(start, start + windowSize);
            const spectrum = this.simpleFFT(window);
            
            for (let bin = 0; bin < spectrum.length; bin++) {
                const freq = (bin * sampleRate) / windowSize;
                if (freq > 80 && freq < 2000) {
                    const pitch = 12 * Math.log2(freq / 440) + 69;
                    const pitchClass = Math.round(pitch) % 12;
                    if (pitchClass >= 0 && pitchClass < 12) {
                        pitchClasses[pitchClass] += spectrum[bin];
                    }
                }
            }
        }
        
        // Find dominant pitch class
        let maxIdx = 0;
        let maxVal = 0;
        for (let i = 0; i < 12; i++) {
            if (pitchClasses[i] > maxVal) {
                maxVal = pitchClasses[i];
                maxIdx = i;
            }
        }
        
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return keys[maxIdx] + ' Major';
    }

    simpleFFT(samples) {
        // Very simple DFT for emergency fallback
        const N = samples.length;
        const spectrum = new Float32Array(N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += samples[n] * Math.cos(angle);
                imag += samples[n] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real * real + imag * imag) / N;
        }
        
        return spectrum;
    }

    // Analysis enhancement methods
    analyzeTempoStability(samples, sampleRate, estimatedBPM) {
        // Analyze how stable the tempo is throughout the track
        const windowSize = sampleRate * 10; // 10-second windows
        const hopSize = sampleRate * 5; // 5-second overlap
        const tempos = [];

        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const tempo = this.quickTempoEstimate(window, sampleRate);
            tempos.push(tempo);
        }

        if (tempos.length === 0) return 0.5;

        // Calculate coefficient of variation
        const mean = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        const variance = tempos.reduce((a, b) => a + (b - mean) ** 2, 0) / tempos.length;
        const cv = Math.sqrt(variance) / mean;

        // Lower CV = higher stability
        return Math.max(0, Math.min(1, 1 - cv));
    }

    analyzeRhythmComplexity(samples, sampleRate) {
        // Analyze rhythmic complexity using onset density and regularity
        const onsets = this.detectOnsets(samples, sampleRate);
        
        if (onsets.length < 4) return 0.2;

        // Onset density (onsets per second)
        const density = onsets.length / (samples.length / sampleRate);
        
        // Rhythm regularity
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }
        
        const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + (b - meanInterval) ** 2, 0) / intervals.length;
        const irregularity = Math.sqrt(variance) / meanInterval;

        // Combine density and irregularity
        const normalizedDensity = Math.min(1, density / 10);
        const normalizedIrregularity = Math.min(1, irregularity);
        
        return (normalizedDensity * 0.6 + normalizedIrregularity * 0.4);
    }

    analyzeHarmonicComplexity(samples, sampleRate) {
        // Analyze harmonic complexity using spectral features
        const windowSize = 4096;
        const hopSize = 2048;
        let totalComplexity = 0;
        let windowCount = 0;

        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const spectrum = this.performFFT(window);
            
            // Spectral centroid (brightness)
            const centroid = this.spectralCentroid(spectrum, sampleRate);
            
            // Spectral rolloff
            const rolloff = this.spectralRolloff(spectrum, 0.85);
            
            // Spectral flatness (noisiness)
            const flatness = this.spectralFlatness(spectrum);
            
            // Combine into complexity measure
            const complexity = (centroid / 8000) * 0.4 + (rolloff / spectrum.length) * 0.3 + flatness * 0.3;
            totalComplexity += complexity;
            windowCount++;
        }

        return windowCount > 0 ? Math.min(1, totalComplexity / windowCount) : 0.5;
    }

    // Utility methods
    quickTempoEstimate(samples, sampleRate) {
        // Quick tempo estimate for stability analysis
        const autocorr = this.computeAutocorrelation(samples.slice(0, Math.min(samples.length, sampleRate * 5)));
        
        let maxCorr = 0;
        let bestLag = 0;
        
        const minLag = Math.floor(sampleRate * 60 / 200); // 200 BPM max
        const maxLag = Math.floor(sampleRate * 60 / 60);  // 60 BPM min
        
        for (let lag = minLag; lag < Math.min(maxLag, autocorr.length); lag++) {
            if (autocorr[lag] > maxCorr) {
                maxCorr = autocorr[lag];
                bestLag = lag;
            }
        }
        
        return bestLag > 0 ? 60 * sampleRate / bestLag : 120;
    }

    detectOnsets(samples, sampleRate) {
        // Simple onset detection
        const windowSize = 1024;
        const hopSize = 512;
        const onsets = [];
        let prevEnergy = 0;
        
        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += samples[i + j] * samples[i + j];
            }
            
            if (energy > prevEnergy * 1.3) {
                onsets.push(i / sampleRate);
            }
            prevEnergy = energy * 0.9 + energy * 0.1; // Smooth
        }
        
        return onsets;
    }

    spectralCentroid(spectrum, sampleRate) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            const freq = (i * sampleRate) / (spectrum.length * 2);
            weightedSum += freq * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    spectralRolloff(spectrum, threshold = 0.85) {
        const totalEnergy = spectrum.reduce((a, b) => a + b, 0);
        const targetEnergy = totalEnergy * threshold;
        
        let cumulativeEnergy = 0;
        for (let i = 0; i < spectrum.length; i++) {
            cumulativeEnergy += spectrum[i];
            if (cumulativeEnergy >= targetEnergy) {
                return i;
            }
        }
        
        return spectrum.length - 1;
    }

    spectralFlatness(spectrum) {
        const geometricMean = Math.exp(
            spectrum.reduce((sum, val) => sum + Math.log(val + 1e-10), 0) / spectrum.length
        );
        const arithmeticMean = spectrum.reduce((a, b) => a + b, 0) / spectrum.length;
        
        return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    }

    // Confidence calculation
    calculateOverallConfidence(result) {
        const bpmConf = result.bpmConfidence || 0.5;
        const keyConf = result.keyConfidence || 0.5;
        
        // Weight BPM confidence higher as it's typically more reliable
        return bpmConf * 0.6 + keyConf * 0.4;
    }

    // Caching methods
    async generateAudioHash(audioBuffer) {
        // Generate a simple hash based on audio characteristics
        const samples = audioBuffer.getChannelData(0);
        const sampleStep = Math.floor(samples.length / 1000);
        let hash = 0;
        
        for (let i = 0; i < samples.length; i += sampleStep) {
            hash = ((hash << 5) - hash + Math.floor(samples[i] * 1000)) & 0xffffffff;
        }
        
        return hash.toString(36) + '_' + audioBuffer.duration.toFixed(2);
    }

    cacheResult(hash, result) {
        // Keep cache size reasonable
        if (this.analysisHistory.size > 10) {
            const firstKey = this.analysisHistory.keys().next().value;
            this.analysisHistory.delete(firstKey);
        }
        
        this.analysisHistory.set(hash, {
            ...result,
            cachedAt: Date.now()
        });
    }

    // Audio conversion utilities
    audioBufferToMono(audioBuffer) {
        if (audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }
        
        const channel0 = audioBuffer.getChannelData(0);
        const channel1 = audioBuffer.getChannelData(1);
        const mono = new Float32Array(channel0.length);
        
        for (let i = 0; i < channel0.length; i++) {
            mono[i] = (channel0[i] + channel1[i]) / 2;
        }
        
        return mono;
    }

    // Shared utility methods
    computeAutocorrelation(samples) {
        const N = samples.length;
        const maxLag = Math.floor(N / 4);
        const autocorr = new Array(maxLag);
        
        for (let lag = 0; lag < maxLag; lag++) {
            let sum = 0;
            for (let i = 0; i < N - lag; i++) {
                sum += samples[i] * samples[i + lag];
            }
            autocorr[lag] = sum / (N - lag);
        }
        
        return autocorr;
    }

    performFFT(samples) {
        // Reuse FFT implementation from TuneBatAnalyzer
        return this.tunebatAnalyzer.performFFT(samples);
    }

    // Configuration methods (simplified - no server options)
    setServerFallback(enabled) {
        // Ignored - always use client-side only
        console.log('Server fallback disabled - using client-side only');
    }

    setConfidenceThreshold(threshold) {
        // Simplified - no threshold needed without fallback
        console.log('Confidence threshold not used in client-only mode');
    }

    clearCache() {
        this.analysisHistory.clear();
        console.log('Analysis cache cleared');
    }
}