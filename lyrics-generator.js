// AI Lyrics Generator for Studio Buddy Web
// Generates original lyrics using patterns, rhyme schemes, and vocabulary

class LyricsGenerator {
    constructor() {
        this.genres = {
            hip_hop: {
                vocabulary: ['flow', 'beat', 'rhythm', 'mic', 'track', 'sound', 'vibe', 'game', 'life', 'time', 'mind', 'grind', 'shine', 'climb', 'line'],
                themes: ['success', 'struggle', 'dreams', 'hustle', 'loyalty', 'growth', 'journey'],
                patterns: ['AABA', 'ABAB', 'AABB']
            },
            pop: {
                vocabulary: ['love', 'heart', 'soul', 'dream', 'night', 'light', 'time', 'feel', 'real', 'way', 'day', 'stay', 'play', 'say', 'today'],
                themes: ['love', 'friendship', 'freedom', 'youth', 'hope', 'celebration', 'memories'],
                patterns: ['ABAB', 'AABA', 'ABCB']
            },
            rock: {
                vocabulary: ['fire', 'wild', 'free', 'strong', 'loud', 'proud', 'fight', 'night', 'light', 'road', 'soul', 'roll', 'bold', 'hold', 'gold'],
                themes: ['rebellion', 'freedom', 'strength', 'passion', 'truth', 'power', 'unity'],
                patterns: ['AABA', 'ABAB', 'AAAA']
            },
            r_and_b: {
                vocabulary: ['baby', 'honey', 'sweet', 'heat', 'deep', 'keep', 'close', 'most', 'soul', 'whole', 'hold', 'gold', 'true', 'you', 'new'],
                themes: ['love', 'intimacy', 'desire', 'relationships', 'emotions', 'connection', 'devotion'],
                patterns: ['ABAB', 'AABA', 'ABCB']
            }
        };

        this.rhymePatterns = {
            'AABA': [0, 0, 1, 0],
            'ABAB': [0, 1, 0, 1], 
            'AABB': [0, 0, 1, 1],
            'ABCB': [0, 1, 2, 1],
            'AAAA': [0, 0, 0, 0]
        };

        this.syllableCounts = {
            verse: [8, 10, 12],
            chorus: [6, 8, 10],
            bridge: [10, 12, 14]
        };

        this.structureTemplates = [
            ['verse', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
            ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'chorus'],
            ['verse', 'verse', 'chorus', 'verse', 'chorus', 'verse', 'chorus']
        ];

        // Simple rhyme dictionary
        this.rhymeDict = this.buildRhymeDict();
    }

    buildRhymeDict() {
        return {
            'ay': ['day', 'way', 'say', 'play', 'stay', 'pay', 'may', 'today', 'away', 'display'],
            'ight': ['night', 'light', 'bright', 'sight', 'fight', 'right', 'might', 'flight', 'height', 'tight'],
            'ove': ['love', 'above', 'dove', 'glove', 'shove', 'grove'],
            'ime': ['time', 'rhyme', 'climb', 'prime', 'shine', 'mine', 'line', 'sign', 'define', 'design'],
            'eart': ['heart', 'start', 'part', 'art', 'smart', 'cart', 'dart', 'apart'],
            'ound': ['sound', 'round', 'ground', 'found', 'bound', 'pound', 'wound', 'around'],
            'eel': ['feel', 'real', 'deal', 'steal', 'heal', 'meal', 'seal', 'reveal', 'appeal'],
            'ow': ['flow', 'show', 'know', 'grow', 'slow', 'blow', 'glow', 'throw', 'below'],
            'ack': ['back', 'track', 'pack', 'lack', 'crack', 'stack', 'attack', 'black'],
            'ead': ['head', 'lead', 'read', 'dead', 'bread', 'thread', 'spread', 'ahead']
        };
    }

    getRhymingWords(word) {
        const wordLower = word.toLowerCase();
        
        // Find rhyme group
        for (const [ending, words] of Object.entries(this.rhymeDict)) {
            if (words.includes(wordLower)) {
                return words.filter(w => w !== wordLower);
            }
        }
        
        // Fallback: find words with same ending
        const suffix = wordLower.slice(-2);
        const rhymes = [];
        
        for (const wordList of Object.values(this.rhymeDict)) {
            for (const rhymeWord of wordList) {
                if (rhymeWord.endsWith(suffix) && rhymeWord !== wordLower) {
                    rhymes.push(rhymeWord);
                }
            }
        }
        
        return rhymes.length > 0 ? rhymes : [wordLower];
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    generateLine(genre, targetSyllables, rhymeWith = null) {
        const genreData = this.genres[genre] || this.genres.pop;
        const words = genreData.vocabulary;
        const themes = genreData.themes;
        
        let line = [];
        let syllableCount = 0;
        let attempts = 0;
        const maxAttempts = 50;

        // If we need to rhyme, start with a rhyming word
        if (rhymeWith) {
            const rhymingWords = this.getRhymingWords(rhymeWith);
            if (rhymingWords.length > 0) {
                const rhymeWord = this.getRandomElement(rhymingWords);
                line.unshift(rhymeWord);
                syllableCount += this.estimateSyllables(rhymeWord);
            }
        }

        // Build the rest of the line
        while (syllableCount < targetSyllables && attempts < maxAttempts) {
            const word = this.getRandomElement(words);
            const wordSyllables = this.estimateSyllables(word);
            
            if (syllableCount + wordSyllables <= targetSyllables + 1) {
                if (Math.random() > 0.3 || line.length === 0) {
                    line.unshift(word);
                    syllableCount += wordSyllables;
                }
            }
            attempts++;
        }

        // Add connecting words and structure
        return this.formatLine(line, genre);
    }

    estimateSyllables(word) {
        // Simple syllable counting - count vowel groups
        const vowels = 'aeiouy';
        let count = 0;
        let prevWasVowel = false;
        
        for (const char of word.toLowerCase()) {
            const isVowel = vowels.includes(char);
            if (isVowel && !prevWasVowel) {
                count++;
            }
            prevWasVowel = isVowel;
        }
        
        // Handle silent e
        if (word.toLowerCase().endsWith('e') && count > 1) {
            count--;
        }
        
        return Math.max(1, count);
    }

    formatLine(words, genre) {
        if (words.length === 0) return "Generated line placeholder";
        
        const connectors = ['and', 'with', 'like', 'in', 'on', 'for', 'to', 'from', 'of', 'the'];
        const articles = ['a', 'an', 'the', 'my', 'your', 'this', 'that'];
        
        let formatted = [];
        
        for (let i = 0; i < words.length; i++) {
            formatted.push(words[i]);
            
            // Randomly add connectors
            if (i < words.length - 1 && Math.random() > 0.6) {
                formatted.push(this.getRandomElement(connectors));
            }
            
            // Add articles before nouns sometimes
            if (Math.random() > 0.7 && i < words.length - 1) {
                formatted.push(this.getRandomElement(articles));
            }
        }
        
        return this.capitalizeFirst(formatted.join(' '));
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    generateVerse(genre, linesCount = 4) {
        const genreData = this.genres[genre] || this.genres.pop;
        const pattern = this.getRandomElement(genreData.patterns);
        const rhymePattern = this.rhymePatterns[pattern];
        const syllableTarget = this.getRandomElement(this.syllableCounts.verse);
        
        const lines = [];
        const rhymeWords = {};
        
        for (let i = 0; i < linesCount; i++) {
            const rhymeGroup = rhymePattern[i % rhymePattern.length];
            let rhymeWith = null;
            
            if (rhymeWords[rhymeGroup]) {
                rhymeWith = rhymeWords[rhymeGroup];
            }
            
            const line = this.generateLine(genre, syllableTarget, rhymeWith);
            lines.push(line);
            
            // Store the last word for rhyming
            const lastWord = line.split(' ').pop().toLowerCase().replace(/[.,!?]/g, '');
            rhymeWords[rhymeGroup] = lastWord;
        }
        
        return lines;
    }

    generateChorus(genre, linesCount = 4) {
        const genreData = this.genres[genre] || this.genres.pop;
        const pattern = 'AABA'; // Choruses often use AABA
        const rhymePattern = this.rhymePatterns[pattern];
        const syllableTarget = this.getRandomElement(this.syllableCounts.chorus);
        
        const lines = [];
        const rhymeWords = {};
        
        for (let i = 0; i < linesCount; i++) {
            const rhymeGroup = rhymePattern[i % rhymePattern.length];
            let rhymeWith = null;
            
            if (rhymeWords[rhymeGroup]) {
                rhymeWith = rhymeWords[rhymeGroup];
            }
            
            const line = this.generateLine(genre, syllableTarget, rhymeWith);
            lines.push(line);
            
            const lastWord = line.split(' ').pop().toLowerCase().replace(/[.,!?]/g, '');
            rhymeWords[rhymeGroup] = lastWord;
        }
        
        return lines;
    }

    generateBridge(genre, linesCount = 4) {
        const syllableTarget = this.getRandomElement(this.syllableCounts.bridge);
        const lines = [];
        
        for (let i = 0; i < linesCount; i++) {
            const line = this.generateLine(genre, syllableTarget);
            lines.push(line);
        }
        
        return lines;
    }

    generateFullSong(genre = 'pop', customStructure = null) {
        const structure = customStructure || this.getRandomElement(this.structureTemplates);
        const song = {
            title: this.generateTitle(genre),
            genre: genre,
            structure: structure,
            sections: {}
        };
        
        let verseCount = 1;
        let chorusLines = null; // Store chorus to repeat
        
        for (const sectionType of structure) {
            let sectionLines;
            
            switch (sectionType) {
                case 'verse':
                    sectionLines = this.generateVerse(genre);
                    song.sections[`verse_${verseCount}`] = sectionLines;
                    verseCount++;
                    break;
                    
                case 'chorus':
                    if (!chorusLines) {
                        chorusLines = this.generateChorus(genre);
                    }
                    sectionLines = chorusLines;
                    song.sections['chorus'] = sectionLines;
                    break;
                    
                case 'bridge':
                    sectionLines = this.generateBridge(genre);
                    song.sections['bridge'] = sectionLines;
                    break;
            }
        }
        
        return song;
    }

    generateTitle(genre) {
        const genreData = this.genres[genre] || this.genres.pop;
        const word1 = this.getRandomElement(genreData.vocabulary);
        const word2 = this.getRandomElement(genreData.themes);
        
        const patterns = [
            () => this.capitalizeFirst(word1),
            () => this.capitalizeFirst(`${word1} ${word2}`),
            () => this.capitalizeFirst(`the ${word1}`),
            () => this.capitalizeFirst(`${word1} of ${word2}`),
            () => this.capitalizeFirst(`my ${word1}`)
        ];
        
        return this.getRandomElement(patterns)();
    }

    formatSongForDisplay(song) {
        let formatted = `"${song.title}"\nGenre: ${song.genre}\n\n`;
        
        for (const sectionType of song.structure) {
            const sectionKey = sectionType === 'chorus' ? 'chorus' : 
                              sectionType.includes('verse') ? Object.keys(song.sections).find(k => k.startsWith('verse') && !formatted.includes(k)) :
                              sectionType;
                              
            const actualKey = Object.keys(song.sections).find(k => 
                k === sectionKey || 
                (sectionType === 'chorus' && k === 'chorus') ||
                (sectionType.startsWith('verse') && k.startsWith('verse') && !formatted.includes(song.sections[k].join('\n'))) ||
                (sectionType === 'bridge' && k === 'bridge')
            );
            
            if (actualKey && song.sections[actualKey]) {
                formatted += `[${sectionType.toUpperCase()}]\n`;
                formatted += song.sections[actualKey].join('\n') + '\n\n';
            }
        }
        
        return formatted;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LyricsGenerator;
} else {
    window.LyricsGenerator = LyricsGenerator;
}