class PianoApp {
    constructor() {
        this.activeNotes = new Set();
        this.currentSong = null;
        this.currentNoteIndex = 0;
        this.songPlaying = false;
        
        this.pianoElement = document.getElementById('piano');
        this.notesDisplay = document.getElementById('currentNotes');
        this.songListElement = document.getElementById('songList');
        this.songProgressElement = document.getElementById('songProgress');
        this.progressFill = document.getElementById('progressFill');
        this.nextNoteElement = document.getElementById('nextNote');
        this.stopSongBtn = document.getElementById('stopSong');
        
        this.instrumentSelect = document.getElementById('instrumentSelect');
        this.recordBtn = document.getElementById('recordBtn');
        this.stopRecordBtn = document.getElementById('stopRecordBtn');
        this.playbackBtn = document.getElementById('playbackBtn');
        this.exportMidiBtn = document.getElementById('exportMidiBtn');
        this.gameModeBtn = document.getElementById('gameModeBtn');
        this.chordModeBtn = document.getElementById('chordModeBtn');
        this.sheetEditorBtn = document.getElementById('sheetEditorBtn');
        this.midiInputBtn = document.getElementById('midiInputBtn');
        this.onlineBtn = document.getElementById('onlineBtn');
        this.shareBtn = document.getElementById('shareBtn');
        
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingTime = document.getElementById('recordingTime');
        
        this.chordDisplay = document.getElementById('chordDisplay');
        this.chordNameElement = document.getElementById('chordName');
        
        this.gameModeContainer = document.getElementById('gameModeContainer');
        this.sheetEditorContainer = document.getElementById('sheetEditorContainer');
        this.midiInputPanel = document.getElementById('midiInputPanel');
        this.chordPanel = document.getElementById('chordPanel');
        this.onlinePanel = document.getElementById('onlinePanel');
        
        this.sheetNotes = [];
        this.sheetPlaying = false;
        this.midiInitialized = false;
        
        this.init();
    }

    init() {
        this.createPianoKeys();
        this.setupEventListeners();
        this.renderSongList();
        this.updateNotesDisplay();
        this.setupGameModeCallbacks();
        this.setupRecorderCallbacks();
        
        this.activePanels = new Set();
    }

    setupGameModeCallbacks() {
        gameMode.setCallbacks(
            (note, velocity) => {
                if (!this.activeNotes.has(note)) {
                    this.playNote(note, velocity, true);
                }
            },
            (note) => {
                this.stopNote(note, true);
            }
        );
    }

    setupRecorderCallbacks() {
        recorder.onRecordingChange = (isRecording, elapsed) => {
            this.updateRecordingUI(isRecording, elapsed);
        };
        
        recorder.onPlaybackComplete = () => {
            this.playbackBtn.textContent = '▶ 回放';
            this.playbackBtn.disabled = !recorder.hasRecording();
        };
    }

    createPianoKeys() {
        const whiteKeys = pianoKeys.filter(k => k.type === 'white');
        const blackKeys = pianoKeys.filter(k => k.type === 'black');
        
        whiteKeys.forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'key white';
            keyElement.dataset.note = key.note;
            keyElement.dataset.type = 'white';
            
            const label = document.createElement('span');
            label.className = 'key-label';
            label.textContent = key.note + '\n' + key.key;
            keyElement.appendChild(label);
            
            this.pianoElement.appendChild(keyElement);
        });
        
        const blackKeyPositions = {
            'C#4': 1, 'D#4': 2, 'F#4': 4, 'G#4': 5, 'A#4': 6,
            'C#5': 8, 'D#5': 9, 'F#5': 11, 'G#5': 12, 'A#5': 13
        };
        
        blackKeys.forEach(key => {
            const position = blackKeyPositions[key.note];
            if (position !== undefined) {
                const keyElement = document.createElement('div');
                keyElement.className = 'key black';
                keyElement.dataset.note = key.note;
                keyElement.dataset.type = 'black';
                keyElement.dataset.blackIndex = position;
                
                const label = document.createElement('span');
                label.className = 'key-label';
                label.textContent = key.note + '\n' + key.key;
                keyElement.appendChild(label);
                
                this.pianoElement.appendChild(keyElement);
            }
        });
        
        this.positionBlackKeys();
    }

    positionBlackKeys() {
        const firstWhite = this.pianoElement.querySelector('.key.white');
        if (!firstWhite) return;
        const whiteKeyWidth = firstWhite.offsetWidth + 2;
        const blackKeyWidth = this.pianoElement.querySelector('.key.black')?.offsetWidth || 35;
        const offset = blackKeyWidth / 2;
        
        this.pianoElement.querySelectorAll('.key.black').forEach(key => {
            const idx = parseInt(key.dataset.blackIndex);
            key.style.left = (idx * whiteKeyWidth - offset) + 'px';
        });
    }

    setupEventListeners() {
        this.pianoElement.querySelectorAll('.key').forEach(key => {
            const note = key.dataset.note;
            
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(note);
            });
            
            key.addEventListener('mouseup', () => {
                this.stopNote(note);
            });
            
            key.addEventListener('mouseleave', () => {
                this.stopNote(note);
            });
            
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playNote(note);
            });
            
            key.addEventListener('touchend', () => {
                this.stopNote(note);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const note = getNoteFromKey(e.key);
            if (note) {
                this.playNote(note);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const note = getNoteFromKey(e.key);
            if (note) {
                this.stopNote(note);
            }
        });
        
        this.stopSongBtn.addEventListener('click', () => {
            this.stopSong();
        });
        
        window.addEventListener('resize', () => {
            this.positionBlackKeys();
        });
        
        this.instrumentSelect.addEventListener('change', (e) => {
            const instrument = e.target.value;
            pianoAudio.setInstrument(instrument);
            console.log(`切换乐器: ${instrument}`);
        });
        
        this.recordBtn.addEventListener('click', () => {
            this.toggleRecording();
        });
        
        this.stopRecordBtn.addEventListener('click', () => {
            this.stopRecording();
        });
        
        this.playbackBtn.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        this.exportMidiBtn.addEventListener('click', () => {
            this.exportMIDI();
        });
        
        this.gameModeBtn.addEventListener('click', () => {
            this.togglePanel('gameMode');
        });
        
        this.chordModeBtn.addEventListener('click', () => {
            this.togglePanel('chord');
        });
        
        this.sheetEditorBtn.addEventListener('click', () => {
            this.togglePanel('sheet');
        });
        
        this.midiInputBtn.addEventListener('click', () => {
            this.togglePanel('midi');
        });
        
        this.onlineBtn.addEventListener('click', () => {
            this.togglePanel('online');
        });
        
        this.shareBtn.addEventListener('click', () => {
            this.shareRecording();
        });
        
        document.getElementById('autoAccompany').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoAccompaniment();
            } else {
                this.stopAutoAccompaniment();
            }
        });
        
        document.getElementById('accompanyStyle').addEventListener('change', (e) => {
            chordRecognizer.setAccompanyStyle(e.target.value);
        });
        
        document.getElementById('tempoSlider').addEventListener('input', (e) => {
            const tempo = parseInt(e.target.value);
            document.getElementById('tempoValue').textContent = tempo;
            midiManager.setTempo(tempo);
        });
        
        document.getElementById('addNoteBtn').addEventListener('click', () => {
            this.addSheetNote();
        });
        
        document.getElementById('clearSheetBtn').addEventListener('click', () => {
            this.clearSheet();
        });
        
        document.getElementById('playSheetBtn').addEventListener('click', () => {
            this.playSheet();
        });
        
        document.getElementById('importMidiBtn').addEventListener('click', () => {
            document.getElementById('midiFileInput').click();
        });
        
        document.getElementById('midiFileInput').addEventListener('change', (e) => {
            this.importMIDIFile(e.target.files[0]);
        });
    }

    togglePanel(panelName) {
        const panelMap = {
            'gameMode': { btn: this.gameModeBtn, container: this.gameModeContainer, init: () => this.initGameMode() },
            'chord': { btn: this.chordModeBtn, container: this.chordPanel, init: () => this.initChordMode() },
            'sheet': { btn: this.sheetEditorBtn, container: this.sheetEditorContainer, init: () => this.initSheetEditor() },
            'midi': { btn: this.midiInputBtn, container: this.midiInputPanel, init: () => this.initMIDIPanel() },
            'online': { btn: this.onlineBtn, container: this.onlinePanel, init: () => {} }
        };
        
        const panel = panelMap[panelName];
        if (!panel) return;
        
        const isActive = this.activePanels.has(panelName);
        
        if (isActive) {
            this.activePanels.delete(panelName);
            panel.container.style.display = 'none';
            panel.btn.classList.remove('active');
            
            if (panelName === 'gameMode') {
                gameMode.stop();
            } else if (panelName === 'chord') {
                this.stopAutoAccompaniment();
                this.chordDisplay.style.display = 'none';
            }
        } else {
            this.activePanels.forEach(p => {
                const otherPanel = panelMap[p];
                if (otherPanel) {
                    otherPanel.container.style.display = 'none';
                    otherPanel.btn.classList.remove('active');
                }
            });
            
            this.activePanels.clear();
            this.activePanels.add(panelName);
            panel.container.style.display = 'block';
            panel.btn.classList.add('active');
            
            if (panel.init) panel.init();
        }
    }

    initGameMode() {
        if (!this.currentSong) {
            this.currentSong = getSongById(0);
        }
        gameMode.start(this.currentSong);
        setTimeout(() => {
            gameMode.play();
        }, 500);
    }

    initChordMode() {
        this.chordDisplay.style.display = 'block';
        if (document.getElementById('autoAccompany').checked) {
            this.startAutoAccompaniment();
        }
    }

    startAutoAccompaniment() {
        const style = document.getElementById('accompanyStyle').value;
        const tempo = parseInt(document.getElementById('tempoSlider').value);
        chordRecognizer.setAccompanyStyle(style);
        midiManager.setTempo(tempo);
        chordRecognizer.startAccompaniment(
            (note, velocity) => pianoAudio.playNote(note, velocity),
            (note) => pianoAudio.stopNote(note)
        );
    }

    stopAutoAccompaniment() {
        chordRecognizer.stopAccompaniment();
    }

    initSheetEditor() {
        this.renderSheet();
    }

    addSheetNote() {
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        this.sheetNotes.push({
            note: randomNote,
            duration: 500
        });
        this.renderSheet();
    }

    clearSheet() {
        this.sheetNotes = [];
        this.sheetPlaying = false;
        this.renderSheet();
    }

    async playSheet() {
        if (this.sheetPlaying || this.sheetNotes.length === 0) return;
        
        this.sheetPlaying = true;
        document.getElementById('playSheetBtn').textContent = '⏸ 播放中...';
        
        for (const noteData of this.sheetNotes) {
            if (!this.sheetPlaying) break;
            
            this.playNote(noteData.note, 0.8, true);
            await this.sleep(noteData.duration);
            this.stopNote(noteData.note, true);
        }
        
        this.sheetPlaying = false;
        document.getElementById('playSheetBtn').textContent = '▶ 播放';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    renderSheet() {
        const canvas = document.getElementById('vexflowCanvas');
        canvas.innerHTML = '';
        
        if (this.sheetNotes.length === 0) {
            canvas.innerHTML = '<text x="200" y="100" fill="#999" font-size="14">点击"添加音符"开始编辑乐谱</text>';
            return;
        }
        
        const svgNS = 'http://www.w3.org/2000/svg';
        const noteSpacing = 80;
        const startX = 50;
        const baseY = 120;
        
        const notePositions = {
            'C4': 140, 'D4': 133, 'E4': 126, 'F4': 119, 'G4': 112, 'A4': 105, 'B4': 98,
            'C5': 91, 'D5': 84, 'E5': 77, 'F5': 70, 'G5': 63, 'A5': 56, 'B5': 49
        };
        
        for (let i = 0; i < 5; i++) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', '20');
            line.setAttribute('y1', (baseY + i * 7).toString());
            line.setAttribute('x2', '780');
            line.setAttribute('y2', (baseY + i * 7).toString());
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '1');
            canvas.appendChild(line);
        }
        
        const clef = document.createElementNS(svgNS, 'text');
        clef.setAttribute('x', '25');
        clef.setAttribute('y', (baseY + 21).toString());
        clef.setAttribute('font-size', '48');
        clef.setAttribute('fill', '#333');
        clef.textContent = '𝄞';
        canvas.appendChild(clef);
        
        this.sheetNotes.forEach((noteData, index) => {
            const x = startX + index * noteSpacing;
            const y = notePositions[noteData.note] || baseY;
            
            const needsLedger = y > baseY + 14 || y < baseY - 14;
            if (needsLedger) {
                let ledgerY = baseY;
                if (y > baseY + 14) {
                    for (let ly = baseY + 35; ly <= y; ly += 7) {
                        const ledger = document.createElementNS(svgNS, 'line');
                        ledger.setAttribute('x1', (x - 15).toString());
                        ledger.setAttribute('y1', ly.toString());
                        ledger.setAttribute('x2', (x + 35).toString());
                        ledger.setAttribute('y2', ly.toString());
                        ledger.setAttribute('stroke', '#333');
                        ledger.setAttribute('stroke-width', '1');
                        canvas.appendChild(ledger);
                    }
                }
            }
            
            const note = document.createElementNS(svgNS, 'ellipse');
            note.setAttribute('cx', (x + 10).toString());
            note.setAttribute('cy', y.toString());
            note.setAttribute('rx', '12');
            note.setAttribute('ry', '9');
            note.setAttribute('fill', '#2d1b69');
            note.setAttribute('transform', `rotate(-15 ${x + 10} ${y})`);
            canvas.appendChild(note);
            
            const stem = document.createElementNS(svgNS, 'line');
            stem.setAttribute('x1', (x + 21).toString());
            stem.setAttribute('y1', y.toString());
            stem.setAttribute('x2', (x + 21).toString());
            stem.setAttribute('y2', (y - 45).toString());
            stem.setAttribute('stroke', '#2d1b69');
            stem.setAttribute('stroke-width', '2');
            canvas.appendChild(stem);
            
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x.toString());
            label.setAttribute('y', (y + 35).toString());
            label.setAttribute('font-size', '11');
            label.setAttribute('fill', '#666');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = noteData.note;
            canvas.appendChild(label);
        });
    }

    importMIDIFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                const events = midiManager.parseMIDI(arrayBuffer);
                this.sheetNotes = events
                    .filter(e => e.type === 'noteOn')
                    .map(e => ({
                        note: e.note,
                        duration: 500
                    }));
                this.renderSheet();
                alert(`成功导入 ${this.sheetNotes.length} 个音符!`);
            } catch (err) {
                alert('MIDI文件导入失败，请确保是有效的MIDI 1.0文件');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    initMIDIPanel() {
        if (!this.midiInitialized) {
            this.midiInitialized = true;
            midiManager.initMIDI(
                (midiNote, velocity) => {
                    const note = pianoAudio.midiToNote(midiNote);
                    if (note) {
                        this.playNote(note, velocity / 127);
                    }
                },
                (midiNote) => {
                    const note = pianoAudio.midiToNote(midiNote);
                    if (note) {
                        this.stopNote(note);
                    }
                },
                (devices) => {
                    this.updateMIDIDeviceList(devices);
                }
            );
        }
    }

    updateMIDIDeviceList(devices) {
        const listContainer = document.getElementById('midiDeviceList');
        
        if (devices.length === 0) {
            listContainer.innerHTML = '<p class="midi-status">未检测到MIDI设备，请连接后刷新页面</p>';
            return;
        }
        
        listContainer.innerHTML = devices.map((device, index) => `
            <div class="midi-device-item ${device.connected ? 'connected' : ''}">
                <span class="device-icon">🎹</span>
                <div class="device-info">
                    <div class="device-name">${device.name}</div>
                    <div class="device-state">${device.connected ? '✓ 已连接' : '未连接'}</div>
                </div>
            </div>
        `).join('');
    }

    toggleRecording() {
        if (recorder.isRecordingActive()) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        recorder.startRecording();
        this.recordBtn.textContent = '⏺ 录音中...';
        this.recordBtn.classList.add('recording');
        this.stopRecordBtn.disabled = false;
        this.playbackBtn.disabled = true;
        this.exportMidiBtn.disabled = true;
        this.recordingStatus.style.display = 'flex';
    }

    stopRecording() {
        const eventCount = recorder.stopRecording();
        this.recordBtn.textContent = '⏺ 开始录音';
        this.recordBtn.classList.remove('recording');
        this.stopRecordBtn.disabled = true;
        this.playbackBtn.disabled = eventCount === 0;
        this.exportMidiBtn.disabled = eventCount === 0;
        this.recordingStatus.style.display = 'none';
        
        if (eventCount > 0) {
            console.log(`录音完成，共 ${eventCount} 个事件，${recorder.getNoteCount()} 个音符`);
        }
    }

    updateRecordingUI(isRecording, elapsed) {
        if (isRecording) {
            this.recordingTime.textContent = recorder.formatTime(elapsed);
        }
    }

    togglePlayback() {
        if (recorder.isPlaybackActive()) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    async startPlayback() {
        this.playbackBtn.textContent = '⏸ 回放中...';
        this.recordBtn.disabled = true;
        
        await recorder.startPlayback(
            (note, velocity) => {
                this.playNote(note, velocity, true);
            },
            (note) => {
                this.stopNote(note, true);
            }
        );
    }

    stopPlayback() {
        recorder.stopPlayback();
        this.playbackBtn.textContent = '▶ 回放';
        this.recordBtn.disabled = false;
        
        this.activeNotes.forEach(note => {
            this.stopNote(note, true);
        });
    }

    exportMIDI() {
        if (!recorder.hasRecording()) return;
        
        const events = recorder.getEvents();
        const midiEvents = events.map(e => ({
            ...e,
            velocity: e.velocity ? Math.round(e.velocity * 127) : 100
        }));
        
        const instrument = pianoAudio.getInstrument();
        const blob = midiManager.generateMIDI(midiEvents, `钢琴录音_${instrument}_${new Date().toLocaleDateString()}`);
        midiManager.downloadMIDI(blob, `钢琴演奏_${Date.now()}.mid`);
    }

    shareRecording() {
        if (!recorder.hasRecording()) {
            alert('请先录制一段音乐再分享！');
            return;
        }
        
        const jsonData = recorder.exportJSON();
        const textData = recorder.exportAsText();
        
        const shareOptions = `
请选择分享方式：

1. 💾 导出为JSON文件（可导入回放）
2. 📝 导出为文本记录
3. 🎵 导出为MIDI文件

当前录音信息：
- 乐器：${pianoAudio.getInstrument()}
- 时长：${recorder.formatTime(recorder.getDuration())}
- 音符数：${recorder.getNoteCount()}
        `;
        
        const choice = prompt(shareOptions, '1');
        
        switch (choice) {
            case '1':
                this.downloadData(jsonData, '钢琴录音.json', 'application/json');
                break;
            case '2':
                this.downloadData(textData, '钢琴录音.txt', 'text/plain');
                break;
            case '3':
                this.exportMIDI();
                break;
            default:
                alert('已取消分享');
        }
    }

    downloadData(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    playNote(note, velocity = 0.8, isSystem = false) {
        if (this.activeNotes.has(note)) return;
        
        this.activeNotes.add(note);
        pianoAudio.playNote(note, velocity);
        
        const keyElement = this.pianoElement.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            keyElement.classList.remove('hint');
        }
        
        if (!isSystem) {
            recorder.recordNoteOn(note, velocity);
            
            if (gameMode.isGameActive()) {
                gameMode.onKeyPress(note);
            }
            
            if (this.activePanels.has('chord')) {
                chordRecognizer.addNote(note);
                this.updateChordDisplay();
                
                if (document.getElementById('autoAccompany').checked) {
                    chordRecognizer.onChordChange();
                }
            }
        }
        
        this.updateNotesDisplay();
        
        if (this.songPlaying && this.currentSong) {
            const currentNote = this.currentSong.notes[this.currentNoteIndex];
            if (currentNote && currentNote.note === note) {
                this.currentNoteIndex++;
                this.updateSongProgress();
            }
        }
    }

    stopNote(note, isSystem = false) {
        if (!this.activeNotes.has(note)) return;
        
        this.activeNotes.delete(note);
        pianoAudio.stopNote(note);
        
        const keyElement = this.pianoElement.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        
        if (!isSystem) {
            recorder.recordNoteOff(note);
            
            if (this.activePanels.has('chord')) {
                chordRecognizer.removeNote(note);
                this.updateChordDisplay();
                
                if (document.getElementById('autoAccompany').checked) {
                    chordRecognizer.onChordChange();
                }
            }
        }
        
        this.updateNotesDisplay();
    }

    updateChordDisplay() {
        const activeNotes = chordRecognizer.getActiveNotes();
        if (activeNotes.length >= 3) {
            const chord = chordRecognizer.recognizeChord();
            if (chord) {
                this.chordNameElement.textContent = chord.name;
            } else {
                this.chordNameElement.textContent = activeNotes.join(' + ');
            }
        } else if (activeNotes.length > 0) {
            this.chordNameElement.textContent = activeNotes.join(' + ');
        } else {
            this.chordNameElement.textContent = '-';
        }
    }

    updateNotesDisplay() {
        if (this.activeNotes.size === 0) {
            this.notesDisplay.innerHTML = '<span class="placeholder">准备弹奏...</span>';
        } else {
            const notes = Array.from(this.activeNotes).sort();
            this.notesDisplay.innerHTML = notes.map(note => 
                `<span class="note-tag">${note}</span>`
            ).join('');
        }
    }

    renderSongList() {
        const songList = getSongList();
        this.songListElement.innerHTML = songList.map(song => `
            <div class="song-card" data-song-id="${song.id}">
                <div class="song-name">${song.name}</div>
                <div class="song-difficulty">${song.difficulty}</div>
            </div>
        `).join('');
        
        this.songListElement.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', () => {
                const songId = parseInt(card.dataset.songId);
                this.startSong(songId);
            });
        });
    }

    startSong(songId) {
        this.currentSong = getSongById(songId);
        this.currentNoteIndex = 0;
        this.songPlaying = true;
        
        this.songListElement.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('active');
            if (parseInt(card.dataset.songId) === songId) {
                card.classList.add('active');
            }
        });
        
        this.songProgressElement.style.display = 'block';
        this.updateSongProgress();
        
        if (gameMode.isGameActive()) {
            gameMode.start(this.currentSong);
            setTimeout(() => gameMode.play(), 500);
        }
    }

    stopSong() {
        this.songPlaying = false;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        
        this.songProgressElement.style.display = 'none';
        this.songListElement.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('active');
        });
        
        this.pianoElement.querySelectorAll('.key').forEach(key => {
            key.classList.remove('hint');
        });
    }

    updateSongProgress() {
        if (!this.currentSong) return;
        
        const totalNotes = this.currentSong.notes.length;
        const progress = (this.currentNoteIndex / totalNotes) * 100;
        this.progressFill.style.width = progress + '%';
        
        this.pianoElement.querySelectorAll('.key').forEach(key => {
            key.classList.remove('hint');
        });
        
        if (this.currentNoteIndex < totalNotes) {
            const nextNote = this.currentSong.notes[this.currentNoteIndex];
            this.nextNoteElement.textContent = nextNote.note;
            
            const keyElement = this.pianoElement.querySelector(`[data-note="${nextNote.note}"]`);
            if (keyElement) {
                keyElement.classList.add('hint');
            }
        } else {
            this.nextNoteElement.textContent = '🎉 完成！';
            setTimeout(() => {
                this.stopSong();
            }, 2000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PianoApp();
});
