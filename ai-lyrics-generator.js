// AI-powered Lyrics Generator for Studio Buddy
// Connects to Railway-hosted AI model for advanced lyrics generation

class AILyricsGenerator {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:8002' : 
            'https://your-hybrid-ai-api.railway.app';
        this.isOnline = false;
        this.fallbackGenerator = new LyricsGenerator(); // Use existing generator as fallback
        
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            this.isOnline = response.ok;
        } catch (error) {
            console.warn('AI API not available, using fallback generator');
            this.isOnline = false;
        }
    }

    async generateLyrics(prompt = '', options = {}) {
        const {
            length = 4,
            style = 'rap',
            mood = 'confident',
            structure = 'verse'
        } = options;

        // Try AI API first
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiUrl}/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        length: length,
                        style: style,
                        mood: mood,
                        structure: structure
                    }),
                    timeout: 10000
                });

                if (response.ok) {
                    const result = await response.json();
                    return {
                        lyrics: result.lyrics,
                        source: 'ai',
                        prompt: prompt
                    };
                }
            } catch (error) {
                console.warn('AI API request failed, falling back to local generator:', error);
                this.isOnline = false;
            }
        }

        // Fallback to local generator
        return this.generateFallbackLyrics(prompt, options);
    }

    generateFallbackLyrics(prompt, options) {
        const {
            length = 4,
            style = 'hip_hop'
        } = options;

        // Use existing lyrics generator as fallback
        const lines = this.fallbackGenerator.generateVerse(style, length);
        
        // If we have a prompt, try to incorporate it into the first line
        if (prompt && lines.length > 0) {
            lines[0] = this.incorporatePrompt(prompt, lines[0]);
        }

        return {
            lyrics: lines,
            source: 'fallback',
            prompt: prompt
        };
    }

    incorporatePrompt(prompt, firstLine) {
        // Simple prompt incorporation - prepend prompt words to first line
        const promptWords = prompt.toLowerCase().split(' ').slice(0, 3);
        const cleanPrompt = promptWords.join(' ');
        
        if (cleanPrompt.length > 0) {
            return `${cleanPrompt} ${firstLine.toLowerCase()}`.replace(/^\w/, c => c.toUpperCase());
        }
        
        return firstLine;
    }

    async generateFullSong(prompt = '', genre = 'hip_hop') {
        const structure = ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'];
        const song = {
            title: this.generateTitle(prompt, genre),
            genre: genre,
            structure: structure,
            sections: {},
            source: this.isOnline ? 'ai' : 'fallback'
        };

        let chorusLines = null;

        for (const sectionType of structure) {
            let sectionLines;

            switch (sectionType) {
                case 'verse':
                    const verseResult = await this.generateLyrics(prompt, { 
                        length: 4, 
                        style: genre 
                    });
                    sectionLines = verseResult.lyrics;
                    break;

                case 'chorus':
                    if (!chorusLines) {
                        const chorusResult = await this.generateLyrics(prompt, { 
                            length: 4, 
                            style: genre 
                        });
                        chorusLines = chorusResult.lyrics;
                    }
                    sectionLines = chorusLines;
                    break;

                case 'bridge':
                    const bridgeResult = await this.generateLyrics('', { 
                        length: 4, 
                        style: genre 
                    });
                    sectionLines = bridgeResult.lyrics;
                    break;
            }

            const sectionKey = sectionType === 'chorus' ? 'chorus' : 
                             sectionType === 'bridge' ? 'bridge' : 
                             `${sectionType}_${Object.keys(song.sections).filter(k => k.startsWith('verse')).length + 1}`;
            
            song.sections[sectionKey] = sectionLines;
        }

        return song;
    }

    generateTitle(prompt, genre) {
        if (prompt) {
            const words = prompt.split(' ').slice(0, 2);
            return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        // Fallback to existing title generation
        return this.fallbackGenerator.generateTitle(genre);
    }

    formatSongForDisplay(song) {
        let formatted = `"${song.title}"\nGenre: ${song.genre} (Generated by ${song.source === 'ai' ? 'AI Model' : 'Local Generator'})\n\n`;
        
        for (const sectionType of song.structure) {
            let sectionKey = sectionType;
            
            // Handle duplicate sections
            if (sectionType === 'verse') {
                const verseKeys = Object.keys(song.sections).filter(k => k.startsWith('verse'));
                const unusedVerse = verseKeys.find(k => !formatted.includes(song.sections[k].join('\n')));
                if (unusedVerse) {
                    sectionKey = unusedVerse;
                }
            }

            if (song.sections[sectionKey]) {
                formatted += `[${sectionType.toUpperCase()}]\n`;
                formatted += song.sections[sectionKey].join('\n') + '\n\n';
            }
        }
        
        return formatted;
    }

    async testConnection() {
        await this.checkConnection();
        return {
            online: this.isOnline,
            apiUrl: this.apiUrl,
            fallbackAvailable: !!this.fallbackGenerator
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AILyricsGenerator;
} else {
    window.AILyricsGenerator = AILyricsGenerator;
}