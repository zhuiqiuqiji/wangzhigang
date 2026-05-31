class ChordRecognizer {
    constructor() {
        this.chordDatabase = this.buildChordDatabase();
        this.currentChord = null;
        this.accompanyInterval = null;
        this.accompanyStyle = 'pop';
        this.tempo = 100;
        this.enabled = false;
        this.currentBeat = 0;
    }

    buildChordDatabase() {
        const chords = {};
        const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const chordTypes = {
            major: [0, 4, 7],
            minor: [0, 3, 7],
            dim: [0, 3, 6],
            aug: [0, 4, 8],
            major7: [0, 4, 7, 11],
            minor7: [0, 3, 7, 10],
            dom7: [0, 4, 7, 10],
            sus2: [0, 2, 7],
            sus4: [0, 5, 7]
        };

        roots.forEach((root, rootIndex) => {
            Object.entries(chordTypes).forEach(([type, intervals]) => {
                const notes = intervals.map(interval => {
                    const noteIndex = (rootIndex + interval) % 12;
                    return roots[noteIndex];
                });
                
                const chordName = root + (type === 'major' ? '' : 
                    type === 'minor' ? 'm' : 
                    type === 'dim' ? '°' : 
                    type === 'aug' ? '+' : 
                    type === 'major7' ? 'maj7' : 
                    type === 'minor7' ? 'm7' : 
                    type === 'dom7' ? '7' : 
                    type === 'sus2' ? 'sus2' : 'sus4');
                
                const noteSet = new Set(notes);
                chords[chordName] = {
                    name: chordName,
                    notes: noteSet,
                    intervals,
                    root,
                    type
                };
            });
        });

        return chords;
    }

    noteToSemitone(noteName) {
        const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        const match = noteName.match(/([A-G]#?)/);
        return match ? noteMap[match[1]] : -1;
    }

    normalizeNotes(notes) {
        return new Set(notes.map(n => this.noteToSemitone(n) % 12).filter(n => n >= 0));
    }

    recognizeChord(activeNotes) {
        if (activeNotes.size < 3) {
            this.currentChord = null;
            return null;
        }

        const playedSemitones = this.normalizeNotes(Array.from(activeNotes));
        let bestMatch = null;
        let bestScore = 0;

        Object.values(this.chordDatabase).forEach(chord => {
            const chordSemitones = this.normalizeNotes(Array.from(chord.notes));
            let matches = 0;
            playedSemitones.forEach(n => {
                if (chordSemitones.has(n)) matches++;
            });
            
            const extras = playedSemitones.size - matches;
            const score = matches - extras * 0.5;
            
            if (score > bestScore && matches >= 2) {
                bestScore = score;
                bestMatch = chord;
            }
        });

        this.currentChord = bestMatch;
        return bestMatch;
    }

    getChordNotes(chordName, octave = 3) {
        const chord = this.chordDatabase[chordName];
        if (!chord) return [];
        
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = noteOrder.indexOf(chord.root);
        
        return chord.intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
            return noteOrder[noteIndex] + noteOctave;
        });
    }

    getAccompanyPattern(style) {
        const patterns = {
            pop: {
                beatsPerMeasure: 4,
                pattern: [
                    { notes: [0], duration: 1, bass: true },
                    { notes: [1, 2], duration: 0.5, bass: false },
                    { notes: [1, 2], duration: 0.5, bass: false },
                    { notes: [0, 2], duration: 1, bass: true },
                    { notes: [1, 2], duration: 0.5, bass: false },
                    { notes: [1, 2], duration: 0.5, bass: false }
                ]
            },
            rock: {
                beatsPerMeasure: 4,
                pattern: [
                    { notes: [0, 1, 2], duration: 0.5, bass: true },
                    { notes: [], duration: 0.5, bass: false },
                    { notes: [0, 1, 2], duration: 0.5, bass: false },
                    { notes: [], duration: 0.5, bass: false },
                    { notes: [0, 1, 2], duration: 0.5, bass: true },
                    { notes: [], duration: 0.5, bass: false },
                    { notes: [0, 2], duration: 0.5, bass: false },
                    { notes: [1, 2], duration: 0.5, bass: false }
                ]
            },
            jazz: {
                beatsPerMeasure: 4,
                pattern: [
                    { notes: [0, 2], duration: 0.5, bass: true },
                    { notes: [1, 3], duration: 0.5, bass: false },
                    { notes: [0, 2], duration: 0.5, bass: false },
                    { notes: [1, 3], duration: 0.5, bass: false },
                    { notes: [0, 2], duration: 0.5, bass: true },
                    { notes: [1, 3], duration: 0.5, bass: false },
                    { notes: [0, 2, 3], duration: 0.5, bass: false },
                    { notes: [0, 1, 2], duration: 0.5, bass: false }
                ]
            },
            classic: {
                beatsPerMeasure: 4,
                pattern: [
                    { notes: [0], duration: 1, bass: true },
                    { notes: [1], duration: 1, bass: false },
                    { notes: [2], duration: 1, bass: false },
                    { notes: [0, 1, 2], duration: 1, bass: true }
                ]
            }
        };
        return patterns[style] || patterns.pop;
    }

    setAccompanyStyle(style) {
        this.accompanyStyle = style;
        if (this.enabled) {
            this.stopAccompaniment();
            this.startAccompaniment();
        }
    }

    setTempo(bpm) {
        this.tempo = bpm;
        if (this.enabled) {
            this.stopAccompaniment();
            this.startAccompaniment();
        }
    }

    startAccompaniment(onNotePlay, onNoteStop) {
        this.enabled = true;
        this.onNotePlay = onNotePlay;
        this.onNoteStop = onNoteStop;
        this.currentBeat = 0;
        
        this.playNextBeat();
    }

    playNextBeat() {
        if (!this.enabled || !this.currentChord) {
            this.scheduleNextBeat();
            return;
        }

        const pattern = this.getAccompanyPattern(this.accompanyStyle);
        const beatEvent = pattern.pattern[this.currentBeat % pattern.pattern.length];
        
        const chordNotes = this.getChordNotes(this.currentChord.name, 3);
        
        beatEvent.notes.forEach(noteIndex => {
            if (chordNotes[noteIndex]) {
                const note = chordNotes[noteIndex];
                if (this.onNotePlay) {
                    this.onNotePlay(note, 0.5);
                    const duration = (60 / this.tempo) * beatEvent.duration * 1000 * 0.9;
                    setTimeout(() => {
                        if (this.onNoteStop) {
                            this.onNoteStop(note);
                        }
                    }, duration);
                }
            }
        });

        if (beatEvent.bass) {
            const bassNote = this.currentChord.root + '2';
            if (this.onNotePlay) {
                this.onNotePlay(bassNote, 0.4);
                const duration = (60 / this.tempo) * beatEvent.duration * 1000 * 0.9;
                setTimeout(() => {
                    if (this.onNoteStop) {
                        this.onNoteStop(bassNote);
                    }
                }, duration);
            }
        }

        this.currentBeat++;
        this.scheduleNextBeat();
    }

    scheduleNextBeat() {
        if (!this.enabled) return;
        
        const pattern = this.getAccompanyPattern(this.accompanyStyle);
        const beatEvent = pattern.pattern[this.currentBeat % pattern.pattern.length];
        const interval = (60 / this.tempo) * beatEvent.duration * 1000;
        
        this.accompanyInterval = setTimeout(() => {
            this.playNextBeat();
        }, interval);
    }

    stopAccompaniment() {
        this.enabled = false;
        if (this.accompanyInterval) {
            clearTimeout(this.accompanyInterval);
            this.accompanyInterval = null;
        }
        this.currentBeat = 0;
    }

    getChordName() {
        return this.currentChord ? this.currentChord.name : null;
    }
}

const chordRecognizer = new ChordRecognizer();
