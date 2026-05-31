var GhostCar = (function () {
    var isRecording = false;
    var isReplaying = false;
    var ghostMesh = null;
    var ghostGlow = null;
    var recordData = [];
    var replayData = [];
    var replayIndex = 0;
    var replayStartTime = 0;
    var recordInterval = null;
    var RECORD_INTERVAL_MS = 50;
    var currentLevelId = null;

    function init(scene) {
        var ghostGeo = new THREE.SphereGeometry(0.18, 16, 16);
        var ghostMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.35,
            depthWrite: false
        });
        ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
        ghostMesh.visible = false;
        scene.add(ghostMesh);

        var glowGeo = new THREE.SphereGeometry(0.25, 12, 12);
        var glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15
        });
        ghostGlow = new THREE.Mesh(glowGeo, glowMat);
        ghostMesh.add(ghostGlow);
    }

    function startRecording(levelId) {
        if (!levelId) return;
        currentLevelId = levelId;
        recordData = [];
        isRecording = true;
        isReplaying = false;
        if (ghostMesh) ghostMesh.visible = false;

        if (recordInterval) clearInterval(recordInterval);
        recordInterval = setInterval(captureFrame, RECORD_INTERVAL_MS);
    }

    function captureFrame() {
        if (!isRecording) return;

        var physicsState = PhysicsEngine.getState();
        var ballMesh = BallController.getMesh();

        if (!ballMesh) return;

        recordData.push({
            t: physicsState.progress,
            offset: physicsState.lateralOffset,
            tilt: physicsState.tiltAngle,
            roll: physicsState.rollAngle,
            px: ballMesh.position.x,
            py: ballMesh.position.y,
            pz: ballMesh.position.z,
            rx: ballMesh.rotation.x,
            ry: ballMesh.rotation.y,
            rz: ballMesh.rotation.z
        });
    }

    function stopRecording(saveIfBest) {
        isRecording = false;
        if (recordInterval) {
            clearInterval(recordInterval);
            recordInterval = null;
        }

        if (saveIfBest && recordData.length > 0 && currentLevelId) {
            saveBestRun();
        }

        return recordData;
    }

    function saveBestRun() {
        if (!currentLevelId || recordData.length === 0) return false;

        try {
            var allRecords = JSON.parse(localStorage.getItem('bb_ghost_records') || '{}');
            var currentBest = allRecords[currentLevelId];
            var currentProgress = Levels.getLevelProgress(currentLevelId);
            var isBetter = !currentBest || recordData.length < currentBest.frames.length;

            if (isBetter) {
                allRecords[currentLevelId] = {
                    levelId: currentLevelId,
                    timestamp: Date.now(),
                    time: currentProgress.bestTime || 0,
                    frames: recordData
                };
                localStorage.setItem('bb_ghost_records', JSON.stringify(allRecords));
                return true;
            }
        } catch (e) {
            console.error('Failed to save ghost record:', e);
        }
        return false;
    }

    function loadBestRun(levelId) {
        try {
            var allRecords = JSON.parse(localStorage.getItem('bb_ghost_records') || '{}');
            return allRecords[levelId] || null;
        } catch (e) {
            return null;
        }
    }

    function hasBestRun(levelId) {
        return loadBestRun(levelId) !== null;
    }

    function startReplay(levelId) {
        var record = loadBestRun(levelId);
        if (!record || !record.frames || record.frames.length === 0) {
            return false;
        }

        replayData = record.frames;
        replayIndex = 0;
        replayStartTime = performance.now();
        isReplaying = true;
        isRecording = false;

        if (ghostMesh) {
            ghostMesh.visible = true;
            ghostMesh.position.set(0, 0, 0);
        }

        return true;
    }

    function stopReplay() {
        isReplaying = false;
        replayData = [];
        replayIndex = 0;
        if (ghostMesh) ghostMesh.visible = false;
    }

    function update(dt) {
        if (!isReplaying || !ghostMesh || replayData.length === 0) return;

        var currentProgress = PhysicsEngine.getState().progress;
        var targetIndex = findClosestFrame(currentProgress);

        if (targetIndex < 0 || targetIndex >= replayData.length) return;

        var frame = replayData[targetIndex];
        var nextFrame = replayData[Math.min(targetIndex + 1, replayData.length - 1)];

        var blend = 0;
        if (frame.t !== nextFrame.t) {
            blend = (currentProgress - frame.t) / (nextFrame.t - frame.t);
            blend = GameUtils.clamp(blend, 0, 1);
        }

        ghostMesh.position.x = GameUtils.lerp(frame.px, nextFrame.px, blend);
        ghostMesh.position.y = GameUtils.lerp(frame.py, nextFrame.py, blend);
        ghostMesh.position.z = GameUtils.lerp(frame.pz, nextFrame.pz, blend);

        ghostMesh.rotation.x = GameUtils.lerp(frame.rx, nextFrame.rx, blend);
        ghostMesh.rotation.y = GameUtils.lerp(frame.ry, nextFrame.ry, blend);
        ghostMesh.rotation.z = GameUtils.lerp(frame.rz, nextFrame.rz, blend);

        var time = performance.now() * 0.005;
        ghostMesh.material.opacity = 0.3 + Math.sin(time) * 0.1;
    }

    function findClosestFrame(progress) {
        if (replayData.length === 0) return -1;
        if (progress <= replayData[0].t) return 0;
        if (progress >= replayData[replayData.length - 1].t) return replayData.length - 1;

        var low = 0;
        var high = replayData.length - 1;

        while (low <= high) {
            var mid = Math.floor((low + high) / 2);
            if (replayData[mid].t < progress) {
                low = mid + 1;
            } else if (replayData[mid].t > progress) {
                high = mid - 1;
            } else {
                return mid;
            }
        }

        return high;
    }

    function isActive() {
        return isReplaying;
    }

    function setVisible(visible) {
        if (ghostMesh) ghostMesh.visible = visible && isReplaying;
    }

    function getGhostPosition() {
        if (!ghostMesh || !isReplaying) return null;
        return ghostMesh.position.clone();
    }

    function clearAllRecords() {
        try {
            localStorage.removeItem('bb_ghost_records');
            return true;
        } catch (e) {
            return false;
        }
    }

    function deleteRecord(levelId) {
        try {
            var allRecords = JSON.parse(localStorage.getItem('bb_ghost_records') || '{}');
            delete allRecords[levelId];
            localStorage.setItem('bb_ghost_records', JSON.stringify(allRecords));
            return true;
        } catch (e) {
            return false;
        }
    }

    return {
        init: init,
        startRecording: startRecording,
        stopRecording: stopRecording,
        startReplay: startReplay,
        stopReplay: stopReplay,
        update: update,
        isActive: isActive,
        setVisible: setVisible,
        hasBestRun: hasBestRun,
        loadBestRun: loadBestRun,
        getGhostPosition: getGhostPosition,
        clearAllRecords: clearAllRecords,
        deleteRecord: deleteRecord
    };
})();
