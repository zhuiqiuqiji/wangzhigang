class GameMode {
    constructor() {
        this.isActive = false;
        this.isPlaying = false;
        this.currentSong = null;
        this.fallingNotes = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.totalNotes = 0;
        this.animationId = null;
        this.gameStartTime = 0;
        this.speed = 2;
        this.hitWindow = 80;
        
        this.container = document.getElementById('gameModeContainer');
        this.notesContainer = document.getElementById('fallingNotesContainer');
        this.scoreElement = document.getElementById('gameScore');
        this.comboElement = document.getElementById('gameCombo');
        this.accuracyElement = document.getElementById('gameAccuracy');
        this.hitLineY = 260;
        
        this.onNotePlay = null;
        this.onNoteStop = null;
        this.activeGameNotes = new Set();
    }

    setCallbacks(onNotePlay, onNoteStop) {
        this.onNotePlay = onNotePlay;
        this.onNoteStop = onNoteStop;
    }

    start(song) {
        if (!song || !song.notes || song.notes.length === 0) return false;
        
        this.isActive = true;
        this.isPlaying = false;
        this.currentSong = song;
        this.fallingNotes = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.totalNotes = song.notes.length;
        this.activeGameNotes.clear();
        
        this.container.style.display = 'block';
        this.updateScore();
        
        this.prepareNotes();
        return true;
    }

    prepareNotes() {
        const notes = this.currentSong.notes;
        let currentTime = 0;
        const startDelay = 2000;
        const whiteKeys = pianoKeys.filter(k => k.type === 'white');
        
        const noteToX = {};
        whiteKeys.forEach((key, index) => {
            const firstWhite = document.querySelector('.key.white');
            if (firstWhite) {
                const keyWidth = firstWhite.offsetWidth + 2;
                noteToX[key.note] = index * keyWidth + keyWidth / 2 - 20;
            } else {
                noteToX[key.note] = index * 52 + 16;
            }
        });
        
        const blackKeyOffsets = {
            'C#4': 1, 'D#4': 2, 'F#4': 4, 'G#4': 5, 'A#4': 6,
            'C#5': 8, 'D#5': 9, 'F#5': 11, 'G#5': 12, 'A#5': 13
        };
        
        pianoKeys.filter(k => k.type === 'black').forEach(key => {
            const offset = blackKeyOffsets[key.note];
            if (offset !== undefined) {
                const firstWhite = document.querySelector('.key.white');
                if (firstWhite) {
                    const keyWidth = firstWhite.offsetWidth + 2;
                    noteToX[key.note] = offset * keyWidth - 17.5;
                } else {
                    noteToX[key.note] = offset * 52 - 17.5;
                }
            }
        });
        
        this.fallingNotes = notes.map((note, index) => {
            currentTime += note.duration;
            return {
                id: index,
                note: note.note,
                targetTime: currentTime + startDelay,
                x: noteToX[note.note] || 0,
                y: -50,
                hit: false,
                missed: false,
                played: false,
                element: null
            };
        });
    }

    play() {
        if (!this.isActive || this.isPlaying) return;
        
        this.isPlaying = true;
        this.gameStartTime = performance.now();
        this.gameLoop();
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    stop() {
        this.isActive = false;
        this.isPlaying = false;
        this.fallingNotes = [];
        this.activeGameNotes.clear();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.notesContainer.innerHTML = '';
        this.container.style.display = 'none';
        
        this.activeGameNotes.forEach(note => {
            if (this.onNoteStop) {
                this.onNoteStop(note);
            }
        });
        this.activeGameNotes.clear();
    }

    gameLoop() {
        if (!this.isPlaying || !this.isActive) return;
        
        const currentTime = performance.now() - this.gameStartTime;
        
        this.updateNotes(currentTime);
        this.renderNotes();
        this.checkMissedNotes(currentTime);
        
        if (this.fallingNotes.every(n => n.hit || n.missed)) {
            this.endGame();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    updateNotes(currentTime) {
        const travelTime = 3000;
        
        this.fallingNotes.forEach(note => {
            if (!note.hit && !note.missed) {
                const timeUntilHit = note.targetTime - currentTime;
                const progress = 1 - (timeUntilHit / travelTime);
                
                note.y = progress * this.hitLineY - 50;
                
                if (timeUntilHit <= 50 && !note.played) {
                    note.played = true;
                    if (this.onNotePlay) {
                        this.onNotePlay(note.note, 0.3);
                        this.activeGameNotes.add(note.note);
                        
                        setTimeout(() => {
                            if (this.onNoteStop) {
                                this.onNoteStop(note.note);
                            }
                            this.activeGameNotes.delete(note.note);
                        }, 200);
                    }
                }
            }
        });
    }

    renderNotes() {
        const existingElements = new Map();
        this.notesContainer.querySelectorAll('.falling-note').forEach(el => {
            const id = parseInt(el.dataset.id);
            existingElements.set(id, el);
        });
        
        this.fallingNotes.forEach(note => {
            if (note.y < -40 || note.hit || note.missed) {
                if (existingElements.has(note.id)) {
                    existingElements.get(note.id).remove();
                    existingElements.delete(note.id);
                }
                return;
            }
            
            let element = existingElements.get(note.id);
            
            if (!element) {
                element = document.createElement('div');
                element.className = 'falling-note';
                element.dataset.id = note.id;
                element.textContent = note.note;
                this.notesContainer.appendChild(element);
            }
            
            element.style.top = note.y + 'px';
            element.style.left = note.x + 'px';
            element.style.opacity = note.hit ? '0' : '1';
        });
    }

    checkMissedNotes(currentTime) {
        this.fallingNotes.forEach(note => {
            if (!note.hit && !note.missed) {
                const timeAfterHit = currentTime - note.targetTime;
                if (timeAfterHit > this.hitWindow) {
                    this.missNote(note);
                }
            }
        });
    }

    onKeyPress(note) {
        if (!this.isActive || !this.isPlaying) return;
        
        const currentTime = performance.now() - this.gameStartTime;
        
        const matchingNote = this.fallingNotes.find(n => 
            n.note === note && 
            !n.hit && 
            !n.missed &&
            Math.abs(currentTime - n.targetTime) <= this.hitWindow
        );
        
        if (matchingNote) {
            this.hitNote(matchingNote);
        }
    }

    hitNote(note) {
        note.hit = true;
        this.hitCount++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        const currentTime = performance.now() - this.gameStartTime;
        const timing = Math.abs(currentTime - note.targetTime);
        
        let points = 100;
        if (timing < 20) points = 150;
        else if (timing < 40) points = 120;
        
        this.score += points * (1 + this.combo * 0.1);
        
        const element = this.notesContainer.querySelector(`[data-id="${note.id}"]`);
        if (element) {
            element.classList.add('hit');
        }
        
        this.updateScore();
    }

    missNote(note) {
        note.missed = true;
        this.missCount++;
        this.combo = 0;
        
        const element = this.notesContainer.querySelector(`[data-id="${note.id}"]`);
        if (element) {
            element.classList.add('miss');
        }
        
        this.updateScore();
    }

    updateScore() {
        this.scoreElement.textContent = Math.floor(this.score);
        this.comboElement.textContent = this.combo;
        
        const total = this.hitCount + this.missCount;
        const accuracy = total > 0 ? (this.hitCount / total * 100) : 100;
        this.accuracyElement.textContent = accuracy.toFixed(1) + '%';
    }

    endGame() {
        this.isPlaying = false;
        
        const total = this.hitCount + this.missCount;
        const accuracy = total > 0 ? (this.hitCount / total * 100) : 0;
        
        let grade = 'F';
        if (accuracy >= 95) grade = 'S';
        else if (accuracy >= 90) grade = 'A';
        else if (accuracy >= 80) grade = 'B';
        else if (accuracy >= 70) grade = 'C';
        else if (accuracy >= 60) grade = 'D';
        
        setTimeout(() => {
            alert(`🎉 演奏完成!\n\n得分: ${Math.floor(this.score)}\n最大连击: ${this.maxCombo}\n准确率: ${accuracy.toFixed(1)}%\n评级: ${grade}\n命中: ${this.hitCount} | 错过: ${this.missCount}`);
            this.stop();
        }, 500);
    }

    setSpeed(speed) {
        this.speed = Math.max(0.5, Math.min(3, speed));
    }

    isGameActive() {
        return this.isActive;
    }

    isGamePlaying() {
        return this.isPlaying;
    }

    getStats() {
        return {
            score: Math.floor(this.score),
            combo: this.combo,
            maxCombo: this.maxCombo,
            hitCount: this.hitCount,
            missCount: this.missCount,
            totalNotes: this.totalNotes,
            accuracy: this.totalNotes > 0 ? (this.hitCount / this.totalNotes * 100) : 0
        };
    }
}

const gameMode = new GameMode();
