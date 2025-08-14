// TuneBat-style Audio Analysis Engine
// Multi-algorithm ensemble approach for enhanced accuracy

class TuneBatAnalyzer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.algorithms = {
            onset: new OnsetBasedDetector(),
            autocorr: new AutocorrelationDetector(), 
            comb: new CombFilterDetector(),
            spectral: new SpectralDetector()
        };
        this.mlWeights = {
            onset: 0.3,
            autocorr: 0.35,
            comb: 0.2,
            spectral: 0.15
        };
    }

    async analyzeAudio(audioBuffer) {
        try {
            console.log('🎯 TuneBat-style analysis starting...');
            
            // Run multiple algorithms in parallel
            const results = await Promise.all([
                this.detectBPMEnsemble(audioBuffer),
                this.detectKeyEnsemble(audioBuffer),
                this.analyzeMoodFeatures(audioBuffer),
                this.generateSpectrum(audioBuffer)
            ]);

            const [bpmData, keyData, moodData, spectrum] = results;

            return {
                bpm: bpmData.bpm,
                bpmCandidates: bpmData.candidates,
                bpmConfidence: bpmData.confidence,
                key: keyData.key,
                keyCandidates: keyData.candidates,
                keyConfidence: keyData.confidence,
                energy: moodData.energy,
                danceability: moodData.danceability,
                valence: moodData.valence,
                spectrum: spectrum,
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                analysisMethod: 'tunebat-ensemble'
            };
        } catch (error) {
            console.error('TuneBat analysis error:', error);
            throw error;
        }
    }

    async detectBPMEnsemble(audioBuffer) {
        console.log('🥁 Running ensemble BPM detection...');
        
        // Convert to mono
        const samples = this.audioBufferToMono(audioBuffer);
        const sampleRate = audioBuffer.sampleRate;
        
        // Run all algorithms
        const results = await Promise.all([
            this.algorithms.onset.detect(samples, sampleRate),
            this.algorithms.autocorr.detect(samples, sampleRate),
            this.algorithms.comb.detect(samples, sampleRate),
            this.algorithms.spectral.detect(samples, sampleRate)
        ]);

        // Combine results using weighted voting
        const candidates = this.combineTempoEstimates(results);
        const finalBPM = this.selectBestTempo(candidates);
        
        return {
            bpm: finalBPM.bpm,
            confidence: finalBPM.confidence,
            candidates: candidates.slice(0, 5)
        };
    }

    async detectKeyEnsemble(audioBuffer) {
        console.log('🎼 Running ensemble key detection...');
        
        const samples = this.audioBufferToMono(audioBuffer);
        const sampleRate = audioBuffer.sampleRate;
        
        // Multiple chroma analysis methods
        const chromaCQT = this.computeChromaCQT(samples, sampleRate);
        const chromaCENS = this.computeChromaCENS(samples, sampleRate);
        const chromaSTFT = this.computeChromaSTFT(samples, sampleRate);
        
        // Weight and combine
        const combinedChroma = this.combineChromaVectors([
            { chroma: chromaCQT, weight: 0.4 },
            { chroma: chromaCENS, weight: 0.35 },
            { chroma: chromaSTFT, weight: 0.25 }
        ]);
        
        const keyResults = this.matchToAllKeys(combinedChroma);
        
        return {
            key: keyResults[0].key,
            confidence: keyResults[0].confidence,
            candidates: keyResults.slice(0, 5)
        };
    }

    async analyzeMoodFeatures(audioBuffer) {
        console.log('🎭 Analyzing mood features...');
        
        const samples = this.audioBufferToMono(audioBuffer);
        const sampleRate = audioBuffer.sampleRate;
        
        // Energy: RMS energy with dynamics
        const energy = this.computeEnergyFeature(samples);
        
        // Danceability: Rhythm regularity + tempo suitability
        const danceability = this.computeDanceability(samples, sampleRate);
        
        // Valence: Harmonic content analysis
        const valence = this.computeValence(samples, sampleRate);
        
        return { energy, danceability, valence };
    }

    // Algorithm implementations
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

    combineTempoEstimates(results) {
        const allCandidates = [];
        
        // Collect all candidates with algorithm weights
        results.forEach((result, index) => {
            const algorithmNames = ['onset', 'autocorr', 'comb', 'spectral'];
            const weight = this.mlWeights[algorithmNames[index]];
            
            result.candidates.forEach(candidate => {
                allCandidates.push({
                    bpm: candidate.bpm,
                    confidence: candidate.confidence * weight,
                    algorithm: algorithmNames[index]
                });
            });
        });
        
        // Group similar BPMs and aggregate confidence
        const grouped = this.groupSimilarTempos(allCandidates);
        
        // Sort by aggregated confidence
        return grouped.sort((a, b) => b.confidence - a.confidence);
    }

    groupSimilarTempos(candidates, tolerance = 3) {
        const groups = [];
        
        candidates.forEach(candidate => {
            let found = false;
            
            for (let group of groups) {
                if (Math.abs(group.bpm - candidate.bpm) <= tolerance) {
                    // Add to existing group
                    group.confidence += candidate.confidence;
                    group.count++;
                    group.bpm = (group.bpm * (group.count - 1) + candidate.bpm) / group.count;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                groups.push({
                    bpm: candidate.bpm,
                    confidence: candidate.confidence,
                    count: 1
                });
            }
        });
        
        return groups;
    }

    selectBestTempo(candidates) {
        if (candidates.length === 0) {
            return { bpm: 120, confidence: 0.1 };
        }
        
        // Apply genre-aware scoring
        let best = candidates[0];
        
        candidates.forEach(candidate => {
            // Boost common dance music tempos
            let bonus = 0;
            if (candidate.bpm >= 120 && candidate.bpm <= 140) bonus += 0.1;
            if (candidate.bpm >= 128 && candidate.bpm <= 132) bonus += 0.05;
            
            const adjustedConfidence = candidate.confidence + bonus;
            
            if (adjustedConfidence > best.confidence) {
                best = { ...candidate, confidence: adjustedConfidence };
            }
        });
        
        return best;
    }

    // Chroma computation methods
    computeChromaCQT(samples, sampleRate) {
        // Constant-Q Transform based chroma
        return this.computeChromaGeneric(samples, sampleRate, 'cqt');
    }

    computeChromaCENS(samples, sampleRate) {
        // Chroma Energy Normalized Statistics
        return this.computeChromaGeneric(samples, sampleRate, 'cens');
    }

    computeChromaSTFT(samples, sampleRate) {
        // Short-time Fourier Transform chroma
        return this.computeChromaGeneric(samples, sampleRate, 'stft');
    }

    computeChromaGeneric(samples, sampleRate, method = 'stft') {
        const windowSize = method === 'cqt' ? 8192 : 4096;
        const hopSize = windowSize / 4;
        const chromaVector = new Array(12).fill(0);
        let frameCount = 0;

        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const magnitudes = this.performFFT(window);
            
            // Apply method-specific processing
            const processedMags = this.applyChromaMethod(magnitudes, method, sampleRate);
            
            // Map to chroma bins
            for (let j = 0; j < processedMags.length; j++) {
                const frequency = (j * sampleRate) / windowSize;
                if (frequency > 80 && frequency < 4000) {
                    const pitch = this.frequencyToPitch(frequency);
                    const pitchClass = Math.round(pitch) % 12;
                    if (pitchClass >= 0 && pitchClass < 12) {
                        chromaVector[pitchClass] += processedMags[j];
                    }
                }
            }
            frameCount++;
        }

        // Normalize
        const sum = chromaVector.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            for (let i = 0; i < 12; i++) {
                chromaVector[i] /= sum;
            }
        }

        return chromaVector;
    }

    applyChromaMethod(magnitudes, method, sampleRate) {
        switch (method) {
            case 'cens':
                // Apply smoothing and energy normalization
                return this.applyCENSProcessing(magnitudes);
            case 'cqt':
                // Apply constant-Q scaling
                return this.applyCQTScaling(magnitudes, sampleRate);
            default:
                return magnitudes;
        }
    }

    applyCENSProcessing(magnitudes) {
        // Simple CENS-like processing: median filtering + normalization
        const smoothed = new Float32Array(magnitudes.length);
        const windowSize = 5;
        
        for (let i = 0; i < magnitudes.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(magnitudes.length, i + Math.floor(windowSize / 2) + 1);
            const window = Array.from(magnitudes.slice(start, end)).sort((a, b) => a - b);
            smoothed[i] = window[Math.floor(window.length / 2)];
        }
        
        return smoothed;
    }

    applyCQTScaling(magnitudes, sampleRate) {
        // Approximate constant-Q scaling
        const scaled = new Float32Array(magnitudes.length);
        
        for (let i = 0; i < magnitudes.length; i++) {
            const frequency = (i * sampleRate) / magnitudes.length;
            const qFactor = frequency > 0 ? frequency / 50 : 1; // Approximate Q scaling
            scaled[i] = magnitudes[i] * Math.sqrt(qFactor);
        }
        
        return scaled;
    }

    combineChromaVectors(chromaData) {
        const combined = new Array(12).fill(0);
        let totalWeight = 0;
        
        chromaData.forEach(({ chroma, weight }) => {
            for (let i = 0; i < 12; i++) {
                combined[i] += chroma[i] * weight;
            }
            totalWeight += weight;
        });
        
        // Normalize by total weight
        if (totalWeight > 0) {
            for (let i = 0; i < 12; i++) {
                combined[i] /= totalWeight;
            }
        }
        
        return combined;
    }

    matchToAllKeys(chroma) {
        // Enhanced Krumhansl-Schmuckler profiles
        const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        
        // Additional temperley profiles for better accuracy
        const temperleyMajor = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];
        const temperleyMinor = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0];
        
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const results = [];
        
        for (let i = 0; i < 12; i++) {
            // Rotate profiles
            const rotatedKS_maj = this.rotateArray(majorProfile, i);
            const rotatedKS_min = this.rotateArray(minorProfile, i);
            const rotatedT_maj = this.rotateArray(temperleyMajor, i);
            const rotatedT_min = this.rotateArray(temperleyMinor, i);
            
            // Calculate correlations
            const ks_major = this.correlation(chroma, rotatedKS_maj);
            const ks_minor = this.correlation(chroma, rotatedKS_min);
            const t_major = this.correlation(chroma, rotatedT_maj);
            const t_minor = this.correlation(chroma, rotatedT_min);
            
            // Combine profile results
            const majorScore = (ks_major * 0.6 + t_major * 0.4);
            const minorScore = (ks_minor * 0.6 + t_minor * 0.4);
            
            results.push({
                key: `${keys[i]} Major`,
                confidence: Math.max(0, majorScore)
            });
            
            results.push({
                key: `${keys[i]} Minor`,
                confidence: Math.max(0, minorScore)
            });
        }
        
        return results.sort((a, b) => b.confidence - a.confidence);
    }

    // Mood feature computation
    computeEnergyFeature(samples) {
        // RMS energy with dynamic range consideration
        let sum = 0;
        const windowSize = 2048;
        const energies = [];
        
        for (let i = 0; i < samples.length - windowSize; i += windowSize) {
            let rms = 0;
            for (let j = 0; j < windowSize; j++) {
                rms += samples[i + j] * samples[i + j];
            }
            energies.push(Math.sqrt(rms / windowSize));
        }
        
        // Normalize to 0-1 based on dynamic range
        const maxEnergy = Math.max(...energies);
        const minEnergy = Math.min(...energies);
        const range = maxEnergy - minEnergy;
        
        if (range > 0) {
            const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
            return Math.min(1, (avgEnergy - minEnergy) / range + 0.1);
        }
        
        return 0.5;
    }

    computeDanceability(samples, sampleRate) {
        // Rhythm regularity + tempo range suitability
        const beats = this.detectBeats(samples, sampleRate);
        
        if (beats.length < 4) return 0.2;
        
        // Beat regularity (inverse of coefficient of variation)
        const intervals = [];
        for (let i = 1; i < beats.length; i++) {
            intervals.push(beats[i] - beats[i-1]);
        }
        
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
        const cv = Math.sqrt(variance) / mean;
        
        const regularity = Math.max(0, 1 - cv);
        
        // Tempo suitability for dancing
        const bpm = 60 / (mean / sampleRate);
        let tempoSuit = 0;
        if (bpm >= 100 && bpm <= 140) tempoSuit = 1;
        else if (bpm >= 80 && bpm <= 160) tempoSuit = 0.7;
        else if (bpm >= 60 && bpm <= 180) tempoSuit = 0.4;
        else tempoSuit = 0.1;
        
        return (regularity * 0.6 + tempoSuit * 0.4);
    }

    computeValence(samples, sampleRate) {
        // Harmonic content analysis for mood
        const chroma = this.computeChromaSTFT(samples, sampleRate);
        
        // Major vs minor content
        const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        
        let maxMajor = -1, maxMinor = -1;
        
        for (let i = 0; i < 12; i++) {
            const rotMajor = this.rotateArray(majorProfile, i);
            const rotMinor = this.rotateArray(minorProfile, i);
            
            maxMajor = Math.max(maxMajor, this.correlation(chroma, rotMajor));
            maxMinor = Math.max(maxMinor, this.correlation(chroma, rotMinor));
        }
        
        // Higher values for major tendency
        return Math.max(0, Math.min(1, (maxMajor - maxMinor + 1) / 2));
    }

    // Utility methods
    detectBeats(samples, sampleRate) {
        // Simple beat detection for danceability analysis
        const windowSize = 1024;
        const hopSize = 512;
        const beats = [];
        
        // Onset detection
        let prevEnergy = 0;
        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            let energy = 0;
            for (let j = 0; j < windowSize; j++) {
                energy += samples[i + j] * samples[i + j];
            }
            
            if (energy > prevEnergy * 1.5) {
                beats.push(i / sampleRate);
            }
            prevEnergy = energy;
        }
        
        return beats;
    }

    rotateArray(arr, positions) {
        const result = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            result[i] = arr[(i + positions) % arr.length];
        }
        return result;
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

    frequencyToPitch(frequency) {
        return 69.0 + 12.0 * Math.log2(frequency / 440.0);
    }

    performFFT(samples) {
        // Use existing FFT from AudioAnalyzer or implement DFT
        const N = samples.length;
        const magnitudes = new Float32Array(N / 2);
        
        // Apply Hanning window
        const windowed = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const windowValue = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
            windowed[i] = samples[i] * windowValue;
        }
        
        // DFT
        for (let k = 0; k < N / 2; k++) {
            let real = 0, imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += windowed[n] * Math.cos(angle);
                imag += windowed[n] * Math.sin(angle);
            }
            
            magnitudes[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return magnitudes;
    }

    async generateSpectrum(audioBuffer) {
        // Reuse existing spectrum generation
        const samples = audioBuffer.getChannelData(0);
        const windowSize = 2048;
        const fftData = this.performFFT(samples.slice(0, windowSize));
        
        const spectrum = new Array(256);
        for (let i = 0; i < spectrum.length; i++) {
            const magnitude = fftData[i] || 0;
            const db = 20 * Math.log10(magnitude + 1e-10);
            spectrum[i] = Math.max(0, Math.min(255, (db + 100) * 2.55));
        }
        
        return spectrum;
    }
}

// Individual algorithm classes
class OnsetBasedDetector {
    async detect(samples, sampleRate) {
        // Onset-based tempo detection
        const onsets = this.detectOnsets(samples, sampleRate);
        const intervals = this.computeIntervals(onsets);
        const candidates = this.estimateTempoFromIntervals(intervals);
        
        return {
            candidates: candidates.map(bpm => ({ bpm, confidence: 0.7 }))
        };
    }

    detectOnsets(samples, sampleRate) {
        const windowSize = 1024;
        const hopSize = 512;
        const onsets = [];
        let prevSpectrum = null;
        
        for (let i = 0; i < samples.length - windowSize; i += hopSize) {
            const window = samples.slice(i, i + windowSize);
            const spectrum = this.computeSpectrum(window);
            
            if (prevSpectrum) {
                let flux = 0;
                for (let j = 0; j < spectrum.length; j++) {
                    flux += Math.max(0, spectrum[j] - prevSpectrum[j]);
                }
                
                if (flux > 0.1) { // Threshold
                    onsets.push(i / sampleRate);
                }
            }
            prevSpectrum = spectrum;
        }
        
        return onsets;
    }

    computeSpectrum(samples) {
        // Simple magnitude spectrum
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

    computeIntervals(onsets) {
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }
        return intervals;
    }

    estimateTempoFromIntervals(intervals) {
        if (intervals.length === 0) return [120];
        
        const histogram = {};
        intervals.forEach(interval => {
            const bpm = Math.round(60 / interval);
            if (bpm >= 60 && bpm <= 200) {
                histogram[bpm] = (histogram[bpm] || 0) + 1;
            }
        });
        
        return Object.keys(histogram)
            .map(bpm => parseInt(bpm))
            .sort((a, b) => histogram[b] - histogram[a])
            .slice(0, 3);
    }
}

class AutocorrelationDetector {
    async detect(samples, sampleRate) {
        const autocorr = this.computeAutocorrelation(samples);
        const candidates = this.findPeaks(autocorr, sampleRate);
        
        return {
            candidates: candidates.map(bpm => ({ bpm, confidence: 0.8 }))
        };
    }

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

    findPeaks(autocorr, sampleRate) {
        const peaks = [];
        
        for (let i = 1; i < autocorr.length - 1; i++) {
            if (autocorr[i] > autocorr[i-1] && autocorr[i] > autocorr[i+1]) {
                const bpm = Math.round(60 * sampleRate / (i * 512)); // Assuming hop size 512
                if (bpm >= 60 && bpm <= 200) {
                    peaks.push(bpm);
                }
            }
        }
        
        return peaks.slice(0, 3);
    }
}

class CombFilterDetector {
    async detect(samples, sampleRate) {
        const candidates = [];
        
        // Test different tempo hypotheses
        for (let bpm = 80; bpm <= 180; bpm += 2) {
            const score = this.testTempo(samples, sampleRate, bpm);
            candidates.push({ bpm, confidence: score });
        }
        
        candidates.sort((a, b) => b.confidence - a.confidence);
        
        return {
            candidates: candidates.slice(0, 5)
        };
    }

    testTempo(samples, sampleRate, bpm) {
        const period = 60 / bpm * sampleRate;
        const hopSize = 512;
        let score = 0;
        let count = 0;
        
        for (let i = 0; i < samples.length - period; i += hopSize) {
            const current = Math.abs(samples[i]);
            const delayed = Math.abs(samples[i + Math.floor(period)]);
            score += current * delayed;
            count++;
        }
        
        return count > 0 ? score / count : 0;
    }
}

class SpectralDetector {
    async detect(samples, sampleRate) {
        const spectrum = this.computePowerSpectrum(samples);
        const candidates = this.findSpectralPeaks(spectrum, sampleRate);
        
        return {
            candidates: candidates.map(bpm => ({ bpm, confidence: 0.6 }))
        };
    }

    computePowerSpectrum(samples) {
        // Simplified power spectrum
        const N = samples.length;
        const spectrum = new Float32Array(N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += samples[n] * Math.cos(angle);
                imag += samples[n] * Math.sin(angle);
            }
            spectrum[k] = (real * real + imag * imag) / (N * N);
        }
        
        return spectrum;
    }

    findSpectralPeaks(spectrum, sampleRate) {
        const peaks = [];
        const freqResolution = sampleRate / (spectrum.length * 2);
        
        for (let i = 1; i < spectrum.length - 1; i++) {
            if (spectrum[i] > spectrum[i-1] && spectrum[i] > spectrum[i+1]) {
                const freq = i * freqResolution;
                const bpm = Math.round(freq * 60);
                if (bpm >= 60 && bpm <= 200) {
                    peaks.push(bpm);
                }
            }
        }
        
        return peaks.slice(0, 3);
    }
}