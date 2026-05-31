class Recorder {
    constructor() {
        this.isRecording = false;
        this.isPlaying = false;
        this.recordedEvents = [];
        this.startTime = 0;
        this.recordingStartTime = 0;
        this.playbackTimeoutIds = [];
        this.onRecordingChange = null;
        this.onPlaybackComplete = null;
    }

    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordedEvents = [];
        this.recordingStartTime = performance.now();
        this.startTime = this.recordingStartTime;
        
        if (this.onRecordingChange) {
            this.onRecordingChange(true, 0);
        }
        
        this.recordingTimer = setInterval(() => {
            if (this.isRecording && this.onRecordingChange) {
                const elapsed = performance.now() - this.recordingStartTime;
                this.onRecordingChange(true, elapsed);
            }
        }, 100);
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        if (this.onRecordingChange) {
            this.onRecordingChange(false, 0);
        }
        
        return this.recordedEvents.length;
    }

    recordNoteOn(note, velocity = 0.8) {
        if (!this.isRecording) return;
        
        const event = {
            type: 'noteOn',
            note: note,
            velocity: velocity,
            time: performance.now() - this.recordingStartTime
        };
        
        this.recordedEvents.push(event);
    }

    recordNoteOff(note) {
        if (!this.isRecording) return;
        
        const event = {
            type: 'noteOff',
            note: note,
            time: performance.now() - this.recordingStartTime
        };
        
        this.recordedEvents.push(event);
    }

    async startPlayback(onNoteOn, onNoteOff) {
        if (this.isPlaying || this.recordedEvents.length === 0) return false;
        
        this.isPlaying = true;
        this.playbackTimeoutIds = [];
        
        const startTime = performance.now();
        
        this.recordedEvents.forEach(event => {
            const delay = event.time;
            
            const timeoutId = setTimeout(() => {
                if (!this.isPlaying) return;
                
                if (event.type === 'noteOn') {
                    if (onNoteOn) {
                        onNoteOn(event.note, event.velocity);
                    }
                } else if (event.type === 'noteOff') {
                    if (onNoteOff) {
                        onNoteOff(event.note);
                    }
                }
            }, delay);
            
            this.playbackTimeoutIds.push(timeoutId);
        });
        
        const maxTime = Math.max(...this.recordedEvents.map(e => e.time));
        const endTimeoutId = setTimeout(() => {
            this.stopPlayback();
            if (this.onPlaybackComplete) {
                this.onPlaybackComplete();
            }
        }, maxTime + 500);
        
        this.playbackTimeoutIds.push(endTimeoutId);
        
        return true;
    }

    stopPlayback() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        this.playbackTimeoutIds.forEach(id => {
            clearTimeout(id);
        });
        
        this.playbackTimeoutIds = [];
    }

    getEvents() {
        return [...this.recordedEvents];
    }

    setEvents(events) {
        this.recordedEvents = [...events];
    }

    clear() {
        this.stopRecording();
        this.stopPlayback();
        this.recordedEvents = [];
    }

    getDuration() {
        if (this.recordedEvents.length === 0) return 0;
        return Math.max(...this.recordedEvents.map(e => e.time));
    }

    getEventCount() {
        return this.recordedEvents.length;
    }

    getNoteCount() {
        return this.recordedEvents.filter(e => e.type === 'noteOn').length;
    }

    hasRecording() {
        return this.recordedEvents.length > 0;
    }

    isRecordingActive() {
        return this.isRecording;
    }

    isPlaybackActive() {
        return this.isPlaying;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    exportJSON() {
        return JSON.stringify({
            version: '1.0',
            instrument: pianoAudio.getInstrument(),
            tempo: midiManager.tempo,
            duration: this.getDuration(),
            events: this.recordedEvents
        }, null, 2);
    }

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.events && Array.isArray(data.events)) {
                this.recordedEvents = data.events;
                if (data.tempo) {
                    midiManager.tempo = data.tempo;
                }
                if (data.instrument) {
                    pianoAudio.setInstrument(data.instrument);
                }
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    exportAsText() {
        let text = '=== 钢琴录音记录 ===\n';
        text += `乐器: ${pianoAudio.getInstrument()}\n`;
        text += `时长: ${this.formatTime(this.getDuration())}\n`;
        text += `音符数: ${this.getNoteCount()}\n\n`;
        text += '时间线:\n';
        
        const noteOnEvents = this.recordedEvents.filter(e => e.type === 'noteOn');
        noteOnEvents.forEach((event, index) => {
            const time = this.formatTime(event.time);
            text += `${index + 1}. [${time}] ${event.note} (力度: ${Math.round(event.velocity * 100)}%)\n`;
        });
        
        return text;
    }
}

const recorder = new Recorder();
