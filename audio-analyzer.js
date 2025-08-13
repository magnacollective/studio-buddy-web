// Audio Analysis Engine for Studio Buddy Web
// Ported from Swift AudioAnalyzer to JavaScript

class AudioAnalyzer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.hopSize = 512;
    }

    async analyzeAudio(audioBuffer) {
        try {
            console.log('🎯 Starting audio analysis...');
            
            const bpm = await this.detectBPM(audioBuffer);
            const keyData = await this.detectKey(audioBuffer);
            const spectrum = await this.generateSpectrum(audioBuffer);
            
            return {
                bpm: bpm,
                key: keyData.key,
                chroma: keyData.chroma,
                spectrum: spectrum,
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate
            };
        } catch (error) {
            console.error('Error in audio analysis:', error);
            throw error;
        }
    }

    async detectBPM(audioBuffer) {
        console.log('🥁 Detecting BPM...');
        
        try {
            // Convert to mono if stereo
            let samples;
            if (audioBuffer.numberOfChannels > 1) {
                const channel0 = audioBuffer.getChannelData(0);
                const channel1 = audioBuffer.getChannelData(1);
                samples = new Float32Array(channel0.length);
                for (let i = 0; i < channel0.length; i++) {
                    samples[i] = (channel0[i] + channel1[i]) / 2;
                }
            } else {
                samples = audioBuffer.getChannelData(0);
            }

            // Compute novelty curve using spectral flux
            const novelty = this.computeNoveltyCurve(samples, audioBuffer.sampleRate);
            
            // Estimate tempo from novelty curve
            const bpm = this.estimateTempoFromNovelty(novelty, audioBuffer.sampleRate);
            
            console.log(`🥁 Estimated BPM: ${bpm}`);
            return bpm;
        } catch (error) {
            console.error('Error detecting BPM:', error);
            return 120; // Default fallback
        }
    }

    computeNoveltyCurve(samples, sampleRate) {
        const windowSize = 2048;
        const hopSize = this.hopSize;
        const novelty = [];
        let previousMagnitudes = new Float32Array(windowSize / 2);

        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const magnitudes = this.performFFT(window);
            
            // Half-wave rectified spectral flux
            let flux = 0;
            for (let j = 0; j < magnitudes.length; j++) {
                const diff = magnitudes[j] - previousMagnitudes[j];
                flux += Math.max(diff, 0);
            }
            novelty.push(flux);
            
            previousMagnitudes = new Float32Array(magnitudes);
        }

        // Normalize novelty curve
        const maxNovelty = Math.max(...novelty);
        if (maxNovelty > 0) {
            for (let i = 0; i < novelty.length; i++) {
                novelty[i] /= maxNovelty;
            }
        }

        return novelty;
    }

    estimateTempoFromNovelty(novelty, sampleRate) {
        if (novelty.length === 0) {
            console.log('Empty novelty curve, returning default 120 BPM');
            return 120;
        }

        // Compute autocorrelation of novelty curve
        const maxLag = Math.floor(sampleRate * 4 / 60); // Max 4 seconds (for 15 BPM min)
        const n = novelty.length;
        const autocorrelation = new Array(maxLag).fill(0);

        for (let lag = 1; lag < maxLag; lag++) {
            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += novelty[i] * novelty[i + lag];
            }
            autocorrelation[lag] = sum / (n - lag);
        }

        // Apply tempo preference window (Gaussian around 120 BPM, broader for higher tempos)
        const preferredBPM = 120;
        const sigma = 50; // Increased to allow higher tempos like 155
        for (let lag = 1; lag < maxLag; lag++) {
            const periodTime = (lag * this.hopSize) / sampleRate;
            const bpm = 60 / periodTime;
            const weight = Math.exp(-Math.pow(bpm - preferredBPM, 2) / (2 * Math.pow(sigma, 2)));
            autocorrelation[lag] *= weight;
        }

        // Find prominent peaks with lower threshold
        const peaks = [];
        for (let i = 1; i < autocorrelation.length - 1; i++) {
            const prominence = autocorrelation[i] - Math.max(autocorrelation[i-1], autocorrelation[i+1]);
            if (prominence > 0.05 && autocorrelation[i] > 0.05) {
                peaks.push(i);
            }
        }

        if (peaks.length === 0) {
            return 120;
        }

        // Find the most prominent period
        let bestPeriod = peaks[0];
        let bestStrength = autocorrelation[bestPeriod];
        for (const peak of peaks) {
            if (autocorrelation[peak] > bestStrength) {
                bestStrength = autocorrelation[peak];
                bestPeriod = peak;
            }
        }

        // Convert period (in hops) to BPM
        const hopTime = this.hopSize / sampleRate;
        const periodTime = bestPeriod * hopTime;
        const bpm = 60.0 / periodTime;

        // Test candidate BPMs (including subdivisions and multipliers)
        const candidateBPMs = [bpm / 4, bpm / 3, bpm / 2, bpm, bpm * 2, bpm * 3, bpm * 4]
            .filter(candidate => candidate >= 60 && candidate <= 200);

        // Score candidates with harmonic reinforcement
        let bestScore = 0;
        let bestBPM = 120;
        for (const cand of candidateBPMs) {
            const candPeriod = 60.0 / cand / hopTime;
            const score = this.getAutocorrelationValue(Math.round(candPeriod), autocorrelation) +
                         this.getAutocorrelationValue(Math.round(candPeriod * 2), autocorrelation) +
                         this.getAutocorrelationValue(Math.round(candPeriod * 3), autocorrelation) +
                         this.getAutocorrelationValue(Math.round(candPeriod / 2), autocorrelation) +
                         this.getAutocorrelationValue(Math.round(candPeriod / 3), autocorrelation);
            
            if (score > bestScore) {
                bestScore = score;
                bestBPM = cand;
            }
        }

        return Math.round(bestBPM);
    }

    getAutocorrelationValue(lag, autocorrelation) {
        if (lag >= 0 && lag < autocorrelation.length) {
            return autocorrelation[lag];
        }
        return 0;
    }

    async detectKey(audioBuffer) {
        console.log('🎼 Detecting musical key...');
        
        try {
            // Use first channel for key detection
            const samples = audioBuffer.getChannelData(0);
            
            // Calculate chroma vector
            const chroma = this.calculateChromaVector(samples, audioBuffer.sampleRate);
            
            // Match to key profiles
            const key = this.matchToKey(chroma);
            
            console.log(`🎼 Detected key: ${key}`);
            return { key, chroma };
        } catch (error) {
            console.error('Error detecting key:', error);
            return { key: 'C Major', chroma: new Array(12).fill(0) };
        }
    }

    calculateChromaVector(samples, sampleRate) {
        const windowSize = 4096;
        const hopSize = windowSize / 2;
        const chromaVector = new Array(12).fill(0);
        let windowCount = 0;

        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const magnitudes = this.performFFT(window);
            
            // Map frequency bins to pitch classes
            for (let index = 0; index < magnitudes.length; index++) {
                const frequency = (index * sampleRate) / windowSize;
                if (frequency > 80 && frequency < 2000) { // Focus on musical range
                    const pitch = this.frequencyToPitch(frequency);
                    const pitchClass = Math.round(pitch) % 12;
                    chromaVector[pitchClass] += magnitudes[index];
                }
            }
            windowCount++;
        }

        // Normalize
        const sum = chromaVector.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            for (let i = 0; i < chromaVector.length; i++) {
                chromaVector[i] /= sum;
            }
        }

        return chromaVector;
    }

    frequencyToPitch(frequency) {
        // MIDI pitch = 69 + 12 * log2(f/440)
        return 69.0 + 12.0 * Math.log2(frequency / 440.0);
    }

    matchToKey(chroma) {
        // Krumhansl-Schmuckler key profiles
        const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let bestKey = 'C Major';
        let bestCorrelation = -1;

        for (let i = 0; i < 12; i++) {
            // Rotate profiles
            const rotatedMajor = [...majorProfile.slice(i), ...majorProfile.slice(0, i)];
            const rotatedMinor = [...minorProfile.slice(i), ...minorProfile.slice(0, i)];
            
            // Calculate correlation
            const majorCorr = this.correlation(chroma, rotatedMajor);
            const minorCorr = this.correlation(chroma, rotatedMinor);
            
            if (majorCorr > bestCorrelation) {
                bestCorrelation = majorCorr;
                bestKey = `${keys[i]} Major`;
            }
            
            if (minorCorr > bestCorrelation) {
                bestCorrelation = minorCorr;
                bestKey = `${keys[i]} Minor`;
            }
        }

        return bestKey;
    }

    correlation(a, b) {
        if (a.length !== b.length) return 0;
        
        const n = a.length;
        const sumA = a.reduce((sum, val) => sum + val, 0);
        const sumB = b.reduce((sum, val) => sum + val, 0);
        const sumAB = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const sumA2 = a.reduce((sum, val) => sum + val * val, 0);
        const sumB2 = b.reduce((sum, val) => sum + val * val, 0);
        
        const numerator = n * sumAB - sumA * sumB;
        const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
        
        return denominator !== 0 ? numerator / denominator : 0;
    }

    async generateSpectrum(audioBuffer) {
        // Generate frequency spectrum for visualization
        const samples = audioBuffer.getChannelData(0);
        const windowSize = 2048;
        const fftData = this.performFFT(samples.slice(0, windowSize));
        
        // Convert to dB scale and normalize for visualization
        const spectrum = new Array(256);
        for (let i = 0; i < spectrum.length; i++) {
            const magnitude = fftData[i] || 0;
            const db = 20 * Math.log10(magnitude + 1e-10);
            spectrum[i] = Math.max(0, Math.min(255, (db + 100) * 2.55)); // Normalize to 0-255
        }
        
        return spectrum;
    }

    performFFT(samples) {
        // Simple FFT implementation using Web Audio API's AnalyserNode
        // For production, consider using a more robust FFT library like FFT.js
        
        const windowSize = samples.length;
        const log2n = Math.log2(windowSize);
        
        if (log2n !== Math.floor(log2n)) {
            // Pad to next power of 2
            const nextPowerOf2 = Math.pow(2, Math.ceil(log2n));
            const paddedSamples = new Float32Array(nextPowerOf2);
            paddedSamples.set(samples);
            return this.simpleFFT(paddedSamples);
        }
        
        return this.simpleFFT(samples);
    }

    simpleFFT(samples) {
        // Basic FFT implementation for magnitude spectrum
        const N = samples.length;
        const magnitudes = new Float32Array(N / 2);
        
        // Apply Hanning window
        const windowed = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const windowValue = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
            windowed[i] = samples[i] * windowValue;
        }
        
        // Compute magnitude spectrum using DFT (simplified for demo)
        for (let k = 0; k < N / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += windowed[n] * Math.cos(angle);
                imag += windowed[n] * Math.sin(angle);
            }
            
            magnitudes[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return magnitudes;
    }
}