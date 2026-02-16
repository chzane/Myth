import nspell from 'nspell';

class SpellCheckManager {
    constructor() {
        this.checkers = {};
        this.dictionaries = {};
        this.init();
    }

    async init() {
        // Load English dictionary
        try {
            const [aff, dic] = await Promise.all([
                fetch('/dictionaries/en/index.aff').then(r => r.text()),
                fetch('/dictionaries/en/index.dic').then(r => r.text())
            ]);
            this.dictionaries.en = nspell(aff, dic);
            console.log('English dictionary loaded');
        } catch (e) {
            console.error('Failed to load English dictionary:', e);
        }

        this.registerDefaultCheckers();
    }

    registerChecker(language, checkerFn) {
        this.checkers[language] = checkerFn;
    }

    registerDefaultCheckers() {
        // English Checker using nspell
        this.registerChecker('en', (text) => {
            if (!this.dictionaries.en) return [];
            
            const errors = [];
            // Regex to match words, ignoring punctuation
            const wordRegex = /[a-zA-Z']+/g;
            let match;
            
            while ((match = wordRegex.exec(text)) !== null) {
                const word = match[0];
                if (!this.dictionaries.en.correct(word)) {
                    const suggestions = this.dictionaries.en.suggest(word);
                    errors.push({
                        word: word,
                        suggestions: suggestions, // Array of suggestions
                        type: 'spelling',
                        index: match.index,
                        length: word.length
                    });
                }
            }

            return errors;
        });

        // Chinese Checker (Basic)
        this.registerChecker('zh', (text) => {
            const errors = [];
            // Basic pattern checks or sensitive word checks could go here
            // For now, let's just check for some common punctuation errors or mixed width usage
            
            // Example: Check for use of English comma in Chinese context (simplified heuristic)
            const englishCommaInChinese = /[\u4e00-\u9fa5]+,[ \u4e00-\u9fa5]+/g;
            let match;
            while ((match = englishCommaInChinese.exec(text)) !== null) {
                const commaIndex = match[0].indexOf(',');
                errors.push({
                    word: ',',
                    suggestions: ['，'],
                    type: 'punctuation',
                    index: match.index + commaIndex,
                    length: 1
                });
            }

            return errors;
        });
    }

    check(text, languages = ['en', 'zh']) {
        let allErrors = [];
        languages.forEach(lang => {
            if (this.checkers[lang]) {
                try {
                    const errors = this.checkers[lang](text);
                    allErrors = allErrors.concat(errors.map(e => ({ ...e, lang })));
                } catch (e) {
                    console.error(`Error checking spell for ${lang}:`, e);
                }
            }
        });
        return allErrors;
    }
}

export default new SpellCheckManager();
