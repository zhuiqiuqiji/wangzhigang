var BallController = (function () {
    var mesh = null;
    var glowMesh = null;
    var ballRadius = 0.18;
    var currentSkinId = 'default';
    var lastPhysicsResult = null;

    function create(scene, skinId) {
        if (mesh) {
            scene.remove(mesh);
        }

        var skin = skinId ? Skins.getById(skinId) : Skins.getById('default');
        if (skin) currentSkinId = skin.id;

        var geo = new THREE.SphereGeometry(ballRadius, 24, 24);
        var mat = new THREE.MeshStandardMaterial({
            color: skin.color,
            metalness: skin.metalness,
            roughness: skin.roughness,
            emissive: skin.emissive,
            emissiveIntensity: skin.emissiveIntensity
        });

        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        scene.add(mesh);

        var glowGeo = new THREE.SphereGeometry(ballRadius * 1.3, 16, 16);
        var glowMat = new THREE.MeshBasicMaterial({
            color: skin.glowColor,
            transparent: true,
            opacity: skin.glowOpacity
        });
        glowMesh = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glowMesh);

        if (skin.id === 'crystal') {
            var innerGeo = new THREE.IcosahedronGeometry(ballRadius * 0.5, 1);
            var innerMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3
            });
            var innerMesh = new THREE.Mesh(innerGeo, innerMat);
            mesh.add(innerMesh);
        }

        if (skin.id === 'iron') {
            var ringGeo = new THREE.TorusGeometry(ballRadius * 0.8, 0.015, 8, 16);
            var ringMat = new THREE.MeshStandardMaterial({
                color: 0xaabbcc,
                metalness: 0.95,
                roughness: 0.1
            });
            var ring = new THREE.Mesh(ringGeo, ringMat);
            mesh.add(ring);
        }

        PhysicsEngine.reset();
        reset();
        return mesh;
    }

    function applySkin(skinId) {
        if (!mesh) return;
        var skin = Skins.getById(skinId);
        if (!skin) return;
        if (!Skins.isUnlocked(skinId)) return;

        currentSkinId = skinId;

        mesh.material.color.setHex(skin.color);
        mesh.material.metalness = skin.metalness;
        mesh.material.roughness = skin.roughness;
        mesh.material.emissive.setHex(skin.emissive);
        mesh.material.emissiveIntensity = skin.emissiveIntensity;

        if (glowMesh) {
            glowMesh.material.color.setHex(skin.glowColor);
            glowMesh.material.opacity = skin.glowOpacity;
        }
    }

    function reset() {
        PhysicsEngine.reset();

        if (mesh) {
            mesh.visible = true;
            mesh.rotation.set(0, 0, 0);
            var startPos = TrackGenerator.getPointAt(0);
            if (startPos) {
                var up = TrackGenerator.getUpAt(0);
                mesh.position.copy(startPos);
                mesh.position.add(up.clone().multiplyScalar(ballRadius + 0.04));
            }
        }

        lastPhysicsResult = null;
    }

    function update(dt, inputState) {
        var skin = Skins.getById(currentSkinId);
        var trackData = TrackGenerator.getTrackData();

        var result = PhysicsEngine.update(dt, inputState, skin, trackData);
        lastPhysicsResult = result;

        if (result.isFalling) {
            return updateFallVisual(result);
        }

        var pos = TrackGenerator.getPointAt(result.progress);
        var tangent = TrackGenerator.getTangentAt(result.progress);
        var right = TrackGenerator.getRightAt(result.progress);
        var up = TrackGenerator.getUpAt(result.progress);

        var ballPos = pos.clone();
        ballPos.add(right.clone().multiplyScalar(result.lateralOffset));
        ballPos.add(up.clone().multiplyScalar(ballRadius + 0.04));

        mesh.position.copy(ballPos);
        mesh.rotation.z = GameUtils.degToRad(-result.tiltAngle);
        mesh.rotation.x = result.rollAngle;

        return {
            position: ballPos.clone(),
            progress: result.progress,
            tiltAngle: result.tiltAngle,
            speed: result.speed,
            isFalling: result.isFalling,
            isFinished: result.isFinished,
            lateralVelocity: result.lateralVelocity
        };
    }

    function updateFallVisual(result) {
        var pos = TrackGenerator.getPointAt(result.progress);
        var right = TrackGenerator.getRightAt(result.progress);
        var up = TrackGenerator.getUpAt(result.progress);

        var fallState = PhysicsEngine.getState();
        var ballPos = pos.clone();
        ballPos.add(right.clone().multiplyScalar(result.lateralOffset));
        ballPos.add(up.clone().multiplyScalar(ballRadius + 0.04));
        ballPos.y -= fallState.fallDistance;

        mesh.position.copy(ballPos);
        mesh.rotation.x = fallState.fallRotX;
        mesh.rotation.z = fallState.fallRotZ;

        if (ballPos.y < -20) {
            return {
                position: ballPos.clone(),
                progress: result.progress,
                tiltAngle: result.tiltAngle,
                speed: 0,
                isFalling: true,
                isFinished: false,
                fallDone: true
            };
        }

        return {
            position: ballPos.clone(),
            progress: result.progress,
            tiltAngle: result.tiltAngle,
            speed: 0,
            isFalling: true,
            isFinished: false,
            fallDone: false
        };
    }

    function getProgress() {
        return PhysicsEngine.getState().progress;
    }

    function getSpeed() {
        return PhysicsEngine.getState().forwardSpeed;
    }

    function getSpeedRatio() {
        return PhysicsEngine.getSpeedRatio();
    }

    function getMesh() {
        return mesh;
    }

    function getRadius() {
        return ballRadius;
    }

    function getCurrentSkinId() {
        return currentSkinId;
    }

    function setMeshVisible(visible) {
        if (mesh) mesh.visible = visible;
    }

    return {
        create: create,
        reset: reset,
        update: update,
        applySkin: applySkin,
        getProgress: getProgress,
        getSpeed: getSpeed,
        getSpeedRatio: getSpeedRatio,
        getMesh: getMesh,
        getRadius: getRadius,
        getCurrentSkinId: getCurrentSkinId,
        setMeshVisible: setMeshVisible
    };
})();
