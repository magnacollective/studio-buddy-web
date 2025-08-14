// Enhanced Audio Analysis Manager
// Combines TuneBat-style ensemble methods with fallback to server-side processing

class EnhancedAudioManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.tunebatAnalyzer = new TuneBatAnalyzer(audioContext);
        this.fallbackAnalyzer = new AudioAnalyzer(audioContext);
        this.useServerFallback = false;
        this.analysisHistory = new Map();
        this.confidence_threshold = 0.7;
    }

    async analyzeAudio(audioBuffer, options = {}) {
        const startTime = performance.now();
        console.log('🚀 Enhanced analysis starting...');

        // Generate file hash for caching
        const audioHash = await this.generateAudioHash(audioBuffer);
        
        // Check cache first
        if (this.analysisHistory.has(audioHash)) {
            console.log('📁 Returning cached analysis');
            return this.analysisHistory.get(audioHash);
        }

        try {
            // Primary: TuneBat-style client-side analysis
            const clientResult = await this.performClientSideAnalysis(audioBuffer, options);
            
            // Validate confidence levels
            if (this.isHighConfidence(clientResult)) {
                console.log(`✅ High confidence client-side analysis (${(performance.now() - startTime).toFixed(1)}ms)`);
                this.cacheResult(audioHash, clientResult);
                return clientResult;
            }

            // Secondary: Hybrid approach (client + server validation)
            console.log('🔄 Running hybrid analysis for validation...');
            const hybridResult = await this.performHybridAnalysis(audioBuffer, clientResult, options);
            
            this.cacheResult(audioHash, hybridResult);
            console.log(`✅ Hybrid analysis complete (${(performance.now() - startTime).toFixed(1)}ms)`);
            return hybridResult;

        } catch (error) {
            console.error('❌ Enhanced analysis failed:', error);
            
            // Fallback to original analyzer
            console.log('🔄 Falling back to original analyzer...');
            const fallbackResult = await this.fallbackAnalyzer.analyzeAudio(audioBuffer);
            
            // Enhance fallback result with TuneBat-style features
            const enhancedFallback = await this.enhanceFallbackResult(audioBuffer, fallbackResult);
            
            this.cacheResult(audioHash, enhancedFallback);
            return enhancedFallback;
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

    async performHybridAnalysis(audioBuffer, clientResult, options) {
        // If server fallback is enabled and client confidence is low
        if (this.useServerFallback && clientResult.confidence < this.confidence_threshold) {
            try {
                const serverResult = await this.getServerAnalysis(audioBuffer);
                return this.combineClientServerResults(clientResult, serverResult);
            } catch (serverError) {
                console.warn('Server analysis failed, using client result:', serverError);
                return clientResult;
            }
        }
        
        // For now, enhance client result with additional processing
        return await this.enhanceClientResult(audioBuffer, clientResult);
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
            analysisMethod: 'enhanced-client-side',
            confidence: Math.min(1.0, clientResult.confidence + 0.1)
        };
    }

    async getServerAnalysis(audioBuffer) {
        // Convert audio buffer to WAV blob
        const wavBlob = this.audioBufferToWav(audioBuffer);
        
        // Send to server API (Railway or local)
        const formData = new FormData();
        formData.append('audio', wavBlob, 'analysis.wav');
        formData.append('profile', 'accurate');
        formData.append('backend', 'pro');

        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server analysis failed: ${response.status}`);
        }

        return await response.json();
    }

    combineClientServerResults(clientResult, serverResult) {
        // Weighted combination of client and server results
        const clientWeight = clientResult.confidence || 0.5;
        const serverWeight = 0.8; // Assume server has good accuracy
        
        const totalWeight = clientWeight + serverWeight;
        const normalizedClientWeight = clientWeight / totalWeight;
        const normalizedServerWeight = serverWeight / totalWeight;

        return {
            // BPM: weighted average if close, server if far apart
            bpm: Math.abs(clientResult.bpm - serverResult.bpm) <= 5 
                ? (clientResult.bpm * normalizedClientWeight + serverResult.bpm * normalizedServerWeight)
                : serverResult.bpm,
            
            // Key: prefer server if client confidence is low
            key: clientResult.keyConfidence > 0.7 ? clientResult.key : serverResult.key,
            
            // Keep client-side mood features
            energy: clientResult.energy,
            danceability: clientResult.danceability,
            valence: clientResult.valence,
            
            // Combine candidates
            bpmCandidates: this.mergeCandidates(clientResult.bpmCandidates, serverResult.bpm_candidates),
            keyCandidates: this.mergeCandidates(clientResult.keyCandidates, serverResult.key_candidates),
            
            // Metadata
            confidence: Math.max(clientResult.confidence, 0.85),
            analysisMethod: 'hybrid-client-server',
            duration: clientResult.duration,
            sampleRate: clientResult.sampleRate,
            spectrum: clientResult.spectrum
        };
    }

    async enhanceFallbackResult(audioBuffer, fallbackResult) {
        // Add TuneBat-style features to original analyzer result
        const samples = this.audioBufferToMono(audioBuffer);
        const sampleRate = audioBuffer.sampleRate;

        // Compute mood features
        const energy = this.computeEnergyFeature(samples);
        const danceability = this.computeDanceability(samples, sampleRate);
        const valence = this.computeValence(samples, sampleRate);

        return {
            ...fallbackResult,
            energy,
            danceability,
            valence,
            bpmCandidates: [{ bpm: fallbackResult.bpm, confidence: 0.6 }],
            keyCandidates: [{ key: fallbackResult.key, confidence: 0.6 }],
            bpmConfidence: 0.6,
            keyConfidence: 0.6,
            confidence: 0.6,
            analysisMethod: 'enhanced-fallback'
        };
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
        const normalizedDensity = Math.min(1, density / 10); // Normalize to typical range
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

    // Confidence and validation methods
    isHighConfidence(result) {
        const bpmConfidence = result.bpmConfidence || 0;
        const keyConfidence = result.keyConfidence || 0;
        const overallConfidence = result.confidence || 0;
        
        return (bpmConfidence > this.confidence_threshold && 
                keyConfidence > this.confidence_threshold) ||
               overallConfidence > this.confidence_threshold;
    }

    calculateOverallConfidence(result) {
        const bpmConf = result.bpmConfidence || 0.5;
        const keyConf = result.keyConfidence || 0.5;
        
        // Weight BPM confidence higher as it's typically more reliable
        return bpmConf * 0.6 + keyConf * 0.4;
    }

    mergeCandidates(clientCandidates, serverCandidates) {
        if (!serverCandidates) return clientCandidates || [];
        if (!clientCandidates) return serverCandidates.map(c => ({ 
            bpm: c.bpm || c.key, 
            confidence: c.confidence 
        }));

        // Combine and deduplicate
        const combined = [...clientCandidates];
        
        serverCandidates.forEach(serverCand => {
            const value = serverCand.bpm || serverCand.key;
            const exists = combined.find(c => 
                Math.abs((c.bpm || 0) - (value || 0)) < 2 || c.key === value
            );
            
            if (!exists) {
                combined.push({ 
                    bpm: serverCand.bpm || undefined,
                    key: serverCand.key || undefined,
                    confidence: serverCand.confidence 
                });
            }
        });

        return combined.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }

    // Caching methods
    async generateAudioHash(audioBuffer) {
        // Generate a simple hash based on audio characteristics
        const samples = audioBuffer.getChannelData(0);
        const sampleStep = Math.floor(samples.length / 1000); // Sample 1000 points
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

    audioBufferToWav(audioBuffer) {
        // Convert AudioBuffer to WAV blob for server upload
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = audioBuffer.length * blockAlign;
        const bufferSize = 44 + dataSize;
        
        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = audioBuffer.getChannelData(channel)[i];
                const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
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

    computeEnergyFeature(samples) {
        return this.tunebatAnalyzer.computeEnergyFeature(samples);
    }

    computeDanceability(samples, sampleRate) {
        return this.tunebatAnalyzer.computeDanceability(samples, sampleRate);
    }

    computeValence(samples, sampleRate) {
        return this.tunebatAnalyzer.computeValence(samples, sampleRate);
    }

    // Configuration methods
    setServerFallback(enabled) {
        this.useServerFallback = enabled;
        console.log(`Server fallback ${enabled ? 'enabled' : 'disabled'}`);
    }

    setConfidenceThreshold(threshold) {
        this.confidence_threshold = Math.max(0.1, Math.min(0.9, threshold));
        console.log(`Confidence threshold set to ${this.confidence_threshold}`);
    }

    clearCache() {
        this.analysisHistory.clear();
        console.log('Analysis cache cleared');
    }
}