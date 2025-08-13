// Audio Processing Engine for Studio Buddy Web
// Implements Matchering-style mastering algorithm in JavaScript

class AudioProcessor {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.sampleRate = audioContext.sampleRate;
    }

    async matcheringMaster(sourceBuffer, referenceBuffer, settings) {
        console.log('🎯 Starting Matchering-style mastering...');
        
        try {
            // Step 1: Analyze reference track
            const referenceAnalysis = await this.analyzeReference(referenceBuffer);
            console.log('📊 Reference analysis complete');
            
            // Step 2: Apply iterative Matchering correction
            const masteredBuffer = await this.applyIterativeMatchering(
                sourceBuffer, 
                referenceAnalysis, 
                settings
            );
            
            console.log('✅ Matchering mastering complete');
            return masteredBuffer;
        } catch (error) {
            console.error('Error in Matchering mastering:', error);
            throw error;
        }
    }

    async intelligentMaster(sourceBuffer, settings) {
        console.log('🧠 Starting intelligent mastering...');
        
        try {
            // Create target reference based on intelligent analysis
            const sourceAnalysis = await this.analyzeSource(sourceBuffer);
            const targetReference = this.createIntelligentTarget(sourceAnalysis);
            
            // Apply mastering using the intelligent target
            const masteredBuffer = await this.applyIterativeMatchering(
                sourceBuffer,
                targetReference,
                settings
            );
            
            console.log('✅ Intelligent mastering complete');
            return masteredBuffer;
        } catch (error) {
            console.error('Error in intelligent mastering:', error);
            throw error;
        }
    }

    async analyzeReference(referenceBuffer) {
        console.log('🔍 Analyzing reference track...');
        
        const channelData = referenceBuffer.getChannelData(0);
        const analysis = {
            rms: this.calculateRMS(channelData),
            peak: this.calculatePeak(channelData),
            lufs: this.calculateLUFS(channelData),
            frequencyResponse: await this.analyzeFrequencyResponse(referenceBuffer),
            psychoacousticProfile: this.calculatePsychoacousticProfile(channelData),
            dynamicRange: this.calculateDynamicRange(channelData),
            stereoWidth: referenceBuffer.numberOfChannels > 1 ? 
                this.calculateStereoWidth(referenceBuffer) : 1.0
        };
        
        console.log(`📊 Reference RMS: ${analysis.rms.toFixed(4)}, Peak: ${analysis.peak.toFixed(4)}, LUFS: ${analysis.lufs.toFixed(1)}`);
        return analysis;
    }

    async analyzeSource(sourceBuffer) {
        const channelData = sourceBuffer.getChannelData(0);
        return {
            rms: this.calculateRMS(channelData),
            peak: this.calculatePeak(channelData),
            lufs: this.calculateLUFS(channelData),
            frequencyResponse: await this.analyzeFrequencyResponse(sourceBuffer),
            dynamicRange: this.calculateDynamicRange(channelData),
            stereoWidth: sourceBuffer.numberOfChannels > 1 ? 
                this.calculateStereoWidth(sourceBuffer) : 1.0
        };
    }

    createIntelligentTarget(sourceAnalysis) {
        // Create intelligent mastering target based on source characteristics
        const targetLUFS = -14; // Industry standard
        const targetRMS = 0.3; // Professional level
        
        return {
            rms: targetRMS,
            peak: 0.95, // Safe headroom
            lufs: targetLUFS,
            frequencyResponse: this.createBalancedFrequencyTarget(sourceAnalysis.frequencyResponse),
            psychoacousticProfile: this.createOptimalPsychoacousticProfile(),
            dynamicRange: Math.max(sourceAnalysis.dynamicRange * 0.8, 6), // Preserve some dynamics
            stereoWidth: Math.min(sourceAnalysis.stereoWidth * 1.1, 1.4) // Slight widening
        };
    }

    async applyIterativeMatchering(sourceBuffer, referenceAnalysis, settings) {
        console.log('🔄 Applying iterative Matchering correction...');
        
        // Create output buffer
        const outputBuffer = this.audioContext.createBuffer(
            sourceBuffer.numberOfChannels,
            sourceBuffer.length,
            sourceBuffer.sampleRate
        );

        // Process each channel
        for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
            const sourceData = sourceBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            
            // Copy source data to output
            outputData.set(sourceData);
            
            // Apply iterative processing (3 gentle passes)
            for (let iteration = 1; iteration <= 3; iteration++) {
                console.log(`🔄 Iteration ${iteration}/3`);
                
                await this.applyIterationPass(
                    outputData,
                    referenceAnalysis,
                    settings,
                    iteration
                );
            }
        }

        // Final limiting and normalization
        await this.applyFinalProcessing(outputBuffer, referenceAnalysis, settings);
        
        return outputBuffer;
    }

    async applyIterationPass(audioData, referenceAnalysis, settings, iteration) {
        const frameLength = 1024;
        const overlap = frameLength / 2;
        
        // Calculate current metrics
        const currentRMS = this.calculateRMS(audioData);
        const targetRMS = referenceAnalysis.rms * Math.pow(10, settings.outputLevel / 20);
        
        console.log(`📊 Iteration ${iteration} - Current RMS: ${currentRMS.toFixed(4)}, Target: ${targetRMS.toFixed(4)}`);
        
        // Step 1: Gentle RMS matching
        if (iteration === 1) {
            const initialGain = Math.min(targetRMS / currentRMS, 2.0);
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] *= initialGain;
            }
        }
        
        // Step 2: Frequency response matching
        await this.applyFrequencyMatching(audioData, referenceAnalysis, settings, iteration);
        
        // Step 3: Psychoacoustic processing
        if (settings.psychoacousticProcessing) {
            await this.applyPsychoacousticProcessing(audioData, referenceAnalysis, iteration);
        }
        
        // Step 4: Dynamic range adjustment
        await this.applyDynamicProcessing(audioData, referenceAnalysis, settings, iteration);
        
        // Step 5: Gentle correction
        const newRMS = this.calculateRMS(audioData);
        const correctionRatio = targetRMS / newRMS;
        const gentleCorrection = 1.0 + (correctionRatio - 1.0) * 0.3; // 30% per iteration
        
        for (let i = 0; i < audioData.length; i++) {
            const corrected = audioData[i] * gentleCorrection;
            // Soft saturation to prevent harsh clipping
            audioData[i] = Math.tanh(corrected * 0.9) * 1.1;
        }
    }

    async applyFrequencyMatching(audioData, referenceAnalysis, settings, iteration) {
        if (!referenceAnalysis.frequencyResponse || settings.eqIntensity === 0) {
            return;
        }
        
        console.log(`🎛️ Applying frequency matching (iteration ${iteration})...`);
        
        // Define frequency bands (in Hz)
        const bands = [
            { freq: 60, q: 0.7 },    // Sub bass
            { freq: 120, q: 0.8 },   // Bass
            { freq: 250, q: 0.9 },   // Low mid
            { freq: 500, q: 1.0 },   // Mid
            { freq: 1000, q: 1.0 },  // Upper mid
            { freq: 2000, q: 0.9 },  // Presence
            { freq: 4000, q: 0.8 },  // High presence
            { freq: 8000, q: 0.7 },  // Brilliance
            { freq: 12000, q: 0.6 }  // Air
        ];
        
        const intensity = settings.eqIntensity * (0.3 / iteration); // Gentle per iteration
        
        for (const band of bands) {
            const targetResponse = referenceAnalysis.frequencyResponse[band.freq] || 1.0;
            let gain = 1.0 + (targetResponse - 1.0) * intensity;
            
            // Limit gain to prevent harshness
            gain = Math.max(0.5, Math.min(gain, 2.0));
            
            this.applyBandEQ(audioData, band.freq, gain, band.q, this.sampleRate);
        }
    }

    async applyPsychoacousticProcessing(audioData, referenceAnalysis, iteration) {
        console.log(`🧠 Applying psychoacoustic processing (iteration ${iteration})...`);
        
        // Calculate perceptual weights based on human hearing sensitivity
        const perceptualWeights = this.calculatePerceptualWeights();
        
        const frameSize = 2048;
        const hopSize = frameSize / 2;
        
        for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
            const frame = audioData.slice(i, i + frameSize);
            const spectrum = this.performFFT(frame);
            
            // Apply perceptual weighting
            for (let bin = 0; bin < spectrum.length / 2; bin++) {
                const frequency = (bin * this.sampleRate) / frameSize;
                const weight = this.getPerceptualWeight(frequency, perceptualWeights);
                
                // Apply gentle perceptual enhancement
                const enhancement = 1.0 + (weight - 1.0) * (0.1 / iteration);
                spectrum[bin] *= enhancement;
            }
            
            // Convert back to time domain (simplified IFFT)
            const processedFrame = this.performIFFT(spectrum);
            
            // Overlap-add
            for (let j = 0; j < Math.min(processedFrame.length, audioData.length - i); j++) {
                audioData[i + j] = processedFrame[j];
            }
        }
    }

    async applyDynamicProcessing(audioData, referenceAnalysis, settings, iteration) {
        console.log(`🎚️ Applying dynamic processing (iteration ${iteration})...`);
        
        const compressionRatio = 1 + (settings.compression - 1) * (0.3 / iteration);
        const threshold = -12; // dB
        const attack = 0.003; // 3ms
        const release = 0.1; // 100ms
        
        let envelope = 0;
        const attackCoeff = Math.exp(-1 / (attack * this.sampleRate));
        const releaseCoeff = Math.exp(-1 / (release * this.sampleRate));
        
        for (let i = 0; i < audioData.length; i++) {
            const inputLevel = Math.abs(audioData[i]);
            const inputLevelDb = 20 * Math.log10(inputLevel + 1e-10);
            
            // Envelope follower
            if (inputLevel > envelope) {
                envelope = attackCoeff * envelope + (1 - attackCoeff) * inputLevel;
            } else {
                envelope = releaseCoeff * envelope + (1 - releaseCoeff) * inputLevel;
            }
            
            const envelopeDb = 20 * Math.log10(envelope + 1e-10);
            
            // Compression
            let gainReduction = 0;
            if (envelopeDb > threshold) {
                const overThreshold = envelopeDb - threshold;
                gainReduction = overThreshold * (1 - 1/compressionRatio);
            }
            
            const gain = Math.pow(10, -gainReduction / 20);
            audioData[i] *= gain;
        }
    }

    async applyFinalProcessing(outputBuffer, referenceAnalysis, settings) {
        console.log('🔧 Applying final processing...');
        
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            const audioData = outputBuffer.getChannelData(channel);
            
            // Final RMS matching
            const currentRMS = this.calculateRMS(audioData);
            const targetRMS = referenceAnalysis.rms * Math.pow(10, settings.outputLevel / 20);
            const finalGain = targetRMS / currentRMS;
            
            for (let i = 0; i < audioData.length; i++) {
                audioData[i] *= finalGain;
            }
            
            // Brickwall limiting (if enabled)
            if (settings.enableLimiting) {
                this.applyBrickwallLimiter(audioData, 0.95);
            }
            
            // Auto-normalize (if enabled)
            if (settings.autoNormalize) {
                const peak = this.calculatePeak(audioData);
                if (peak > 0.95) {
                    const normalizeGain = 0.95 / peak;
                    for (let i = 0; i < audioData.length; i++) {
                        audioData[i] *= normalizeGain;
                    }
                }
            }
        }
        
        // Stereo width adjustment
        if (outputBuffer.numberOfChannels === 2 && settings.stereoWidth !== 1.0) {
            this.applyStereoWidth(outputBuffer, settings.stereoWidth);
        }
    }

    // Utility methods
    calculateRMS(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    calculatePeak(audioData) {
        let peak = 0;
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i]);
            if (abs > peak) peak = abs;
        }
        return peak;
    }

    calculateLUFS(audioData) {
        // Simplified LUFS calculation
        const rms = this.calculateRMS(audioData);
        return -23 + 20 * Math.log10(rms + 1e-10);
    }

    calculateDynamicRange(audioData) {
        const blockSize = Math.floor(this.sampleRate * 0.1); // 100ms blocks
        const rmsValues = [];
        
        for (let i = 0; i < audioData.length - blockSize; i += blockSize) {
            const block = audioData.slice(i, i + blockSize);
            rmsValues.push(this.calculateRMS(block));
        }
        
        rmsValues.sort((a, b) => b - a);
        const top10Percent = rmsValues.slice(0, Math.floor(rmsValues.length * 0.1));
        const average = top10Percent.reduce((sum, val) => sum + val, 0) / top10Percent.length;
        
        return 20 * Math.log10(average + 1e-10);
    }

    calculateStereoWidth(audioBuffer) {
        if (audioBuffer.numberOfChannels < 2) return 1.0;
        
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        
        let correlation = 0;
        for (let i = 0; i < left.length; i++) {
            correlation += left[i] * right[i];
        }
        correlation /= left.length;
        
        return 1.0 - correlation; // Higher value = wider stereo
    }

    async analyzeFrequencyResponse(audioBuffer) {
        const audioData = audioBuffer.getChannelData(0);
        const frameSize = 4096;
        const response = {};
        
        // Analyze different frequency regions
        const frequencies = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000];
        
        for (const freq of frequencies) {
            const magnitude = this.getMagnitudeAtFrequency(audioData, freq, frameSize);
            response[freq] = magnitude;
        }
        
        return response;
    }

    getMagnitudeAtFrequency(audioData, targetFreq, frameSize) {
        const frame = audioData.slice(0, Math.min(frameSize, audioData.length));
        const spectrum = this.performFFT(frame);
        const bin = Math.round((targetFreq * frameSize) / this.sampleRate);
        
        if (bin < spectrum.length / 2) {
            return spectrum[bin];
        }
        return 0;
    }

    calculatePsychoacousticProfile(audioData) {
        // Simplified psychoacoustic model
        const profile = {};
        const frequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
        
        for (const freq of frequencies) {
            const magnitude = this.getMagnitudeAtFrequency(audioData, freq, 2048);
            const threshold = this.getHearingThreshold(freq);
            profile[freq] = Math.max(0, 20 * Math.log10(magnitude + 1e-10) - threshold);
        }
        
        return profile;
    }

    getHearingThreshold(frequency) {
        // ISO 226 hearing threshold approximation
        if (frequency < 100) return 40;
        if (frequency < 1000) return 10 - 20 * Math.log10(frequency / 100);
        if (frequency < 4000) return 10 - 10 * Math.log10(frequency / 1000);
        return 10 + 20 * Math.log10(frequency / 4000);
    }

    calculatePerceptualWeights() {
        const weights = {};
        const frequencies = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000];
        
        for (const freq of frequencies) {
            // A-weighting inspired perceptual curve
            if (freq < 1000) {
                weights[freq] = 0.5 + 0.5 * (freq / 1000);
            } else if (freq < 4000) {
                weights[freq] = 1.0;
            } else {
                weights[freq] = 1.0 - 0.3 * Math.log10(freq / 4000);
            }
        }
        
        return weights;
    }

    getPerceptualWeight(frequency, weights) {
        // Linear interpolation between defined weights
        const frequencies = Object.keys(weights).map(Number).sort((a, b) => a - b);
        
        if (frequency <= frequencies[0]) return weights[frequencies[0]];
        if (frequency >= frequencies[frequencies.length - 1]) return weights[frequencies[frequencies.length - 1]];
        
        for (let i = 0; i < frequencies.length - 1; i++) {
            if (frequency >= frequencies[i] && frequency <= frequencies[i + 1]) {
                const ratio = (frequency - frequencies[i]) / (frequencies[i + 1] - frequencies[i]);
                return weights[frequencies[i]] + ratio * (weights[frequencies[i + 1]] - weights[frequencies[i]]);
            }
        }
        
        return 1.0;
    }

    createBalancedFrequencyTarget(sourceResponse) {
        const target = {};
        for (const freq in sourceResponse) {
            // Create a balanced target based on source characteristics
            let targetGain = 1.0;
            
            const frequency = parseInt(freq);
            if (frequency < 100) {
                targetGain = Math.min(sourceResponse[freq] * 1.2, 1.5); // Boost bass moderately
            } else if (frequency < 500) {
                targetGain = sourceResponse[freq]; // Keep low-mid natural
            } else if (frequency < 2000) {
                targetGain = Math.min(sourceResponse[freq] * 1.1, 1.3); // Slight mid boost
            } else if (frequency < 8000) {
                targetGain = Math.min(sourceResponse[freq] * 1.15, 1.4); // Presence boost
            } else {
                targetGain = Math.min(sourceResponse[freq] * 1.1, 1.2); // Gentle air
            }
            
            target[freq] = targetGain;
        }
        return target;
    }

    createOptimalPsychoacousticProfile() {
        // Create an optimal psychoacoustic profile for mastering
        return {
            125: 60,   // Sub bass presence
            250: 65,   // Bass fullness
            500: 70,   // Midrange clarity
            1000: 75,  // Vocal presence
            2000: 80,  // Articulation
            4000: 75,  // Brightness
            8000: 70   // Air and sparkle
        };
    }

    applyBandEQ(audioData, centerFreq, gain, q, sampleRate) {
        // Simple biquad filter implementation
        const omega = 2 * Math.PI * centerFreq / sampleRate;
        const sin = Math.sin(omega);
        const cos = Math.cos(omega);
        const alpha = sin / (2 * q);
        const A = Math.sqrt(gain);
        
        // Peaking EQ coefficients
        const b0 = 1 + alpha * A;
        const b1 = -2 * cos;
        const b2 = 1 - alpha * A;
        const a0 = 1 + alpha / A;
        const a1 = -2 * cos;
        const a2 = 1 - alpha / A;
        
        // Normalize
        const norm = 1 / a0;
        const b0n = b0 * norm;
        const b1n = b1 * norm;
        const b2n = b2 * norm;
        const a1n = a1 * norm;
        const a2n = a2 * norm;
        
        // Apply filter
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        
        for (let i = 0; i < audioData.length; i++) {
            const x0 = audioData[i];
            const y0 = b0n * x0 + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2;
            
            audioData[i] = y0;
            
            x2 = x1; x1 = x0;
            y2 = y1; y1 = y0;
        }
    }

    applyBrickwallLimiter(audioData, threshold) {
        for (let i = 0; i < audioData.length; i++) {
            if (audioData[i] > threshold) {
                audioData[i] = threshold;
            } else if (audioData[i] < -threshold) {
                audioData[i] = -threshold;
            }
        }
    }

    applyStereoWidth(audioBuffer, width) {
        if (audioBuffer.numberOfChannels < 2) return;
        
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        
        for (let i = 0; i < left.length; i++) {
            const mid = (left[i] + right[i]) * 0.5;
            const side = (left[i] - right[i]) * 0.5 * width;
            
            left[i] = mid + side;
            right[i] = mid - side;
        }
    }

    performFFT(samples) {
        // Simplified FFT for basic spectrum analysis
        const N = samples.length;
        const spectrum = new Float32Array(N);
        
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

    performIFFT(spectrum) {
        // Simplified IFFT
        const N = spectrum.length * 2;
        const samples = new Float32Array(N);
        
        for (let n = 0; n < N; n++) {
            let sum = 0;
            for (let k = 0; k < spectrum.length; k++) {
                const angle = 2 * Math.PI * k * n / N;
                sum += spectrum[k] * Math.cos(angle);
            }
            samples[n] = sum / spectrum.length;
        }
        
        return samples;
    }
}