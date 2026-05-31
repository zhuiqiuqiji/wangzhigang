class MidiManager {
    constructor() {
        this.midiAccess = null;
        this.inputDevices = [];
        this.outputDevices = [];
        this.onMidiNote = null;
        this.onMidiNoteOff = null;
        this.tempo = 120;
        this.timeDivision = 480;
    }

    async initMIDI(onNote, onNoteOff) {
        this.onMidiNote = onNote;
        this.onMidiNoteOff = onNoteOff;

        if (!navigator.requestMIDIAccess) {
            return { success: false, message: '浏览器不支持Web MIDI API' };
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            this.updateDeviceLists();
            
            this.midiAccess.onstatechange = () => {
                this.updateDeviceLists();
            };

            return { success: true, message: 'MIDI初始化成功' };
        } catch (error) {
            return { success: false, message: 'MIDI访问被拒绝: ' + error.message };
        }
    }

    updateDeviceLists() {
        this.inputDevices = [];
        this.outputDevices = [];

        if (this.midiAccess) {
            this.midiAccess.inputs.forEach(input => {
                this.inputDevices.push({
                    id: input.id,
                    name: input.name || '未命名设备',
                    manufacturer: input.manufacturer || '未知'
                });
                input.onmidimessage = (event) => this.handleMIDIMessage(event, input);
            });

            this.midiAccess.outputs.forEach(output => {
                this.outputDevices.push({
                    id: output.id,
                    name: output.name || '未命名设备',
                    manufacturer: output.manufacturer || '未知'
                });
            });
        }
    }

    handleMIDIMessage(event, input) {
        const data = event.data;
        const status = data[0] & 0xF0;
        const channel = data[0] & 0x0F;

        switch (status) {
            case 0x90:
                const noteOn = data[1];
                const velocityOn = data[2];
                if (velocityOn > 0) {
                    const noteName = pianoAudio.midiToNote(noteOn);
                    if (this.onMidiNote) {
                        this.onMidiNote(noteName, velocityOn / 127, {
                            device: input.name,
                            channel,
                            midiNumber: noteOn,
                            velocity: velocityOn
                        });
                    }
                } else {
                    const noteName = pianoAudio.midiToNote(noteOn);
                    if (this.onMidiNoteOff) {
                        this.onMidiNoteOff(noteName, {
                            device: input.name,
                            channel,
                            midiNumber: noteOn
                        });
                    }
                }
                break;

            case 0x80:
                const noteOff = data[1];
                const noteNameOff = pianoAudio.midiToNote(noteOff);
                if (this.onMidiNoteOff) {
                    this.onMidiNoteOff(noteNameOff, {
                        device: input.name,
                        channel,
                        midiNumber: noteOff
                    });
                }
                break;

            case 0xB0:
                const controller = data[1];
                const value = data[2];
                if (controller === 64 && value >= 64) {
                }
                break;
        }
    }

    getInputDevices() {
        return this.inputDevices;
    }

    getOutputDevices() {
        return this.outputDevices;
    }

    writeVariableLength(value) {
        let buffer = [];
        let v = value;
        
        buffer.unshift(v & 0x7F);
        v >>= 7;
        
        while (v > 0) {
            buffer.unshift((v & 0x7F) | 0x80);
            v >>= 7;
        }
        
        return new Uint8Array(buffer);
    }

    writeInt16(value) {
        return new Uint8Array([(value >> 8) & 0xFF, value & 0xFF]);
    }

    writeInt32(value) {
        return new Uint8Array([
            (value >> 24) & 0xFF,
            (value >> 16) & 0xFF,
            (value >> 8) & 0xFF,
            value & 0xFF
        ]);
    }

    concatBuffers(...buffers) {
        let totalLength = 0;
        buffers.forEach(buf => totalLength += buf.length);
        
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        buffers.forEach(buf => {
            result.set(buf, offset);
            offset += buf.length;
        });
        
        return result;
    }

    generateMIDI(events, title = 'Piano Recording') {
        const microsecondsPerQuarterNote = Math.round(60000000 / this.tempo);
        
        const headerChunk = this.concatBuffers(
            new Uint8Array([0x4D, 0x54, 0x68, 0x64]),
            this.writeInt32(6),
            this.writeInt16(1),
            this.writeInt16(2),
            this.writeInt16(this.timeDivision)
        );

        const tempoEvents = [];
        tempoEvents.push({
            deltaTime: 0,
            status: 0xFF,
            metaType: 0x51,
            data: new Uint8Array([
                (microsecondsPerQuarterNote >> 16) & 0xFF,
                (microsecondsPerQuarterNote >> 8) & 0xFF,
                microsecondsPerQuarterNote & 0xFF
            ])
        });

        const titleBytes = new TextEncoder().encode(title);
        tempoEvents.push({
            deltaTime: 0,
            status: 0xFF,
            metaType: 0x03,
            data: titleBytes
        });

        tempoEvents.push({
            deltaTime: 0,
            status: 0xFF,
            metaType: 0x2F,
            data: new Uint8Array([])
        });

        const tempoTrack = this.buildTrackChunk(tempoEvents);

        const noteEvents = this.convertToMIDIEvents(events);
        const instrumentBytes = new TextEncoder().encode('Piano');
        noteEvents.unshift({
            deltaTime: 0,
            status: 0xFF,
            metaType: 0x04,
            data: instrumentBytes
        });

        const noteTrack = this.buildTrackChunk(noteEvents);

        return this.concatBuffers(headerChunk, tempoTrack, noteTrack);
    }

    buildTrackChunk(events) {
        let trackData = new Uint8Array(0);
        
        events.forEach(event => {
            const deltaTimeBytes = this.writeVariableLength(event.deltaTime);
            
            if (event.status === 0xFF) {
                const metaHeader = new Uint8Array([
                    0xFF,
                    event.metaType,
                    ...this.writeVariableLength(event.data.length)
                ]);
                trackData = this.concatBuffers(trackData, deltaTimeBytes, metaHeader, event.data);
            } else {
                const midiEvent = new Uint8Array([event.status, ...event.data]);
                trackData = this.concatBuffers(trackData, deltaTimeBytes, midiEvent);
            }
        });

        const trackHeader = this.concatBuffers(
            new Uint8Array([0x4D, 0x54, 0x72, 0x6B]),
            this.writeInt32(trackData.length)
        );

        return this.concatBuffers(trackHeader, trackData);
    }

    convertToMIDIEvents(events) {
        const midiEvents = [];
        let lastTime = 0;
        const noteOnMap = new Map();

        const sortedEvents = [...events].sort((a, b) => a.time - b.time);

        sortedEvents.forEach(event => {
            const deltaTime = Math.round((event.time - lastTime) * this.timeDivision / 1000 * (this.tempo / 60));
            lastTime = event.time;

            const midiNumber = pianoAudio.noteToMidi(event.note);
            const velocity = event.velocity ? Math.round(event.velocity * 127) : 100;

            if (event.type === 'noteOn') {
                midiEvents.push({
                    deltaTime,
                    status: 0x90,
                    data: [midiNumber, velocity]
                });
                noteOnMap.set(event.note, { time: event.time, velocity });
            } else if (event.type === 'noteOff') {
                midiEvents.push({
                    deltaTime,
                    status: 0x80,
                    data: [midiNumber, 64]
                });
                noteOnMap.delete(event.note);
            }
        });

        noteOnMap.forEach((value, note) => {
            midiEvents.push({
                deltaTime: 0,
                status: 0x80,
                data: [pianoAudio.noteToMidi(note), 64]
            });
        });

        midiEvents.push({
            deltaTime: 0,
            status: 0xFF,
            metaType: 0x2F,
            data: new Uint8Array([])
        });

        return midiEvents;
    }

    downloadMIDI(events, filename = 'piano_recording') {
        const midiData = this.generateMIDI(events, filename);
        const blob = new Blob([midiData], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.mid`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async parseMIDI(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const buffer = new Uint8Array(e.target.result);
                    const notes = this.parseMIDIBuffer(buffer);
                    resolve(notes);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    parseMIDIBuffer(buffer) {
        let offset = 0;
        
        const readInt32 = () => {
            const value = (buffer[offset] << 24) | (buffer[offset + 1] << 16) | 
                         (buffer[offset + 2] << 8) | buffer[offset + 3];
            offset += 4;
            return value;
        };
        
        const readInt16 = () => {
            const value = (buffer[offset] << 8) | buffer[offset + 1];
            offset += 2;
            return value;
        };
        
        const readVariableLength = () => {
            let value = 0;
            let byte;
            do {
                byte = buffer[offset++];
                value = (value << 7) | (byte & 0x7F);
            } while (byte & 0x80);
            return value;
        };

        if (buffer[offset] !== 0x4D || buffer[offset + 1] !== 0x54 || 
            buffer[offset + 2] !== 0x68 || buffer[offset + 3] !== 0x64) {
            throw new Error('无效的MIDI文件');
        }
        offset += 4;

        const headerLength = readInt32();
        offset += headerLength;

        const notes = [];
        const noteOnTimes = new Map();
        let currentTime = 0;
        let ticksPerBeat = 480;
        let tempo = 120;

        while (offset < buffer.length) {
            if (buffer[offset] === 0x4D && buffer[offset + 1] === 0x54 && 
                buffer[offset + 2] === 0x72 && buffer[offset + 3] === 0x6B) {
                offset += 4;
                const trackLength = readInt32();
                const trackEnd = offset + trackLength;
                let lastStatus = null;
                let trackTime = 0;

                while (offset < trackEnd) {
                    const deltaTime = readVariableLength();
                    trackTime += deltaTime;
                    currentTime = trackTime * 60000 / (ticksPerBeat * tempo);

                    let status = buffer[offset];
                    if (status < 0x80) {
                        status = lastStatus;
                    } else {
                        offset++;
                    }
                    lastStatus = status;

                    const eventType = status & 0xF0;

                    if (eventType === 0xF0) {
                        if (status === 0xFF) {
                            const metaType = buffer[offset++];
                            const metaLength = readVariableLength();
                            
                            if (metaType === 0x51 && metaLength === 3) {
                                const microsecondsPerBeat = (buffer[offset] << 16) | 
                                                          (buffer[offset + 1] << 8) | 
                                                          buffer[offset + 2];
                                tempo = 60000000 / microsecondsPerBeat;
                            }
                            offset += metaLength;
                        } else {
                            const length = readVariableLength();
                            offset += length;
                        }
                    } else if (eventType === 0x90) {
                        const noteNumber = buffer[offset++];
                        const velocity = buffer[offset++];
                        const noteName = pianoAudio.midiToNote(noteNumber);
                        
                        if (velocity > 0) {
                            noteOnTimes.set(noteNumber, { time: currentTime, velocity: velocity / 127 });
                        } else {
                            if (noteOnTimes.has(noteNumber)) {
                                const noteData = noteOnTimes.get(noteNumber);
                                notes.push({
                                    note: noteName,
                                    time: noteData.time,
                                    duration: currentTime - noteData.time,
                                    velocity: noteData.velocity
                                });
                                noteOnTimes.delete(noteNumber);
                            }
                        }
                    } else if (eventType === 0x80) {
                        const noteNumber = buffer[offset++];
                        offset++;
                        const noteName = pianoAudio.midiToNote(noteNumber);
                        
                        if (noteOnTimes.has(noteNumber)) {
                            const noteData = noteOnTimes.get(noteNumber);
                            notes.push({
                                note: noteName,
                                time: noteData.time,
                                duration: currentTime - noteData.time,
                                velocity: noteData.velocity
                            });
                            noteOnTimes.delete(noteNumber);
                        }
                    } else {
                        if (eventType === 0xC0 || eventType === 0xD0) {
                            offset++;
                        } else {
                            offset += 2;
                        }
                    }
                }
            } else {
                break;
            }
        }

        noteOnTimes.forEach((noteData, noteNumber) => {
            notes.push({
                note: pianoAudio.midiToNote(noteNumber),
                time: noteData.time,
                duration: 500,
                velocity: noteData.velocity
            });
        });

        return notes;
    }
}

const midiManager = new MidiManager();
