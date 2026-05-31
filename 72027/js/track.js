var TrackGenerator = (function () {
    var curve = null;
    var trackWidth = 1.2;
    var points = [];
    var trackMeshes = [];
    var railMeshes = [];
    var glowMeshes = [];
    var decorationMeshes = [];
    var finishMesh = null;
    var totalLength = 0;
    var segmentCount = 500;
    var currentLevelId = null;
    var trackFriction = 1.0;

    function createCurve(levelData) {
        if (levelData && levelData.points) {
            points = [];
            for (var i = 0; i < levelData.points.length; i++) {
                points.push(new THREE.Vector3(
                    levelData.points[i][0],
                    levelData.points[i][1],
                    levelData.points[i][2]
                ));
            }
            trackWidth = levelData.width || 1.2;
            currentLevelId = levelData.id;
        } else {
            points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -15),
                new THREE.Vector3(0, 0, -30),
                new THREE.Vector3(3, 0, -45),
                new THREE.Vector3(8, 0, -58),
                new THREE.Vector3(10, 0, -70),
                new THREE.Vector3(6, 2, -85),
                new THREE.Vector3(0, 5, -100),
                new THREE.Vector3(-4, 8, -115),
                new THREE.Vector3(-10, 10, -130),
                new THREE.Vector3(-14, 10, -145),
                new THREE.Vector3(-10, 10, -158),
                new THREE.Vector3(-2, 10, -168),
                new THREE.Vector3(8, 10, -180),
                new THREE.Vector3(14, 10, -192),
                new THREE.Vector3(10, 8, -205),
                new THREE.Vector3(2, 5, -218),
                new THREE.Vector3(-2, 3, -230),
                new THREE.Vector3(-4, 2, -242),
                new THREE.Vector3(-2, 0, -255),
                new THREE.Vector3(2, -1, -268),
                new THREE.Vector3(4, 0, -280),
                new THREE.Vector3(2, 0, -292),
                new THREE.Vector3(0, 0, -305),
                new THREE.Vector3(0, 0, -320),
                new THREE.Vector3(0, 0, -340)
            ];
            trackWidth = 1.2;
            currentLevelId = 'default';
        }

        curve = new THREE.CatmullRomCurve3(points);
        totalLength = curve.getLength();
        return curve;
    }

    function createCurveFromPoints(pts) {
        points = pts;
        curve = new THREE.CatmullRomCurve3(points);
        totalLength = curve.getLength();
        currentLevelId = 'custom';
        return curve;
    }

    function buildTrack(scene, levelData) {
        if (!curve) createCurve(levelData);

        trackFriction = levelData ? (levelData.friction || 1.0) : 1.0;

        for (var i = 0; i < trackMeshes.length; i++) {
            scene.remove(trackMeshes[i]);
        }
        for (var i = 0; i < railMeshes.length; i++) {
            scene.remove(railMeshes[i]);
        }
        for (var i = 0; i < glowMeshes.length; i++) {
            scene.remove(glowMeshes[i]);
        }
        for (var i = 0; i < decorationMeshes.length; i++) {
            scene.remove(decorationMeshes[i]);
        }
        if (finishMesh) scene.remove(finishMesh);

        trackMeshes = [];
        railMeshes = [];
        glowMeshes = [];
        decorationMeshes = [];

        var trackColor = levelData ? levelData.trackColor : 0x8899aa;
        var trackEmissive = levelData ? levelData.trackEmissive : 0x112233;
        var glowColor = levelData ? (levelData.accentColor ? parseInt(levelData.accentColor.replace('#', '0x')) : 0x00f5d4) : 0x00f5d4;

        var steps = segmentCount;
        var halfW = trackWidth / 2;

        var planks = [];
        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            var pos = curve.getPointAt(t);
            var tangent = curve.getTangentAt(t).normalize();
            var up = new THREE.Vector3(0, 1, 0);
            var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
            up.crossVectors(right, tangent).normalize();

            planks.push({
                pos: pos,
                right: right,
                up: up,
                tangent: tangent,
                t: t
            });
        }

        createRail(scene, planks, halfW, trackColor, trackEmissive);
        createRail(scene, planks, -halfW, trackColor, trackEmissive);
        createPlanks(scene, planks, trackColor, trackEmissive);
        createGlowLines(scene, planks, glowColor);
        createFinishLine(scene, planks);

        if (levelData && levelData.id === 'snow') {
            createSnowDecorations(scene, planks);
        } else if (levelData && levelData.id === 'scifi') {
            createScifiDecorations(scene, planks);
        } else if (levelData && levelData.id === 'bridge') {
            createBridgeDecorations(scene, planks);
        }

        return curve;
    }

    function createRail(scene, planks, offset, color, emissive) {
        var railPoints = [];
        for (var i = 0; i < planks.length; i++) {
            var p = planks[i];
            var pt = p.pos.clone().add(p.right.clone().multiplyScalar(offset));
            railPoints.push(pt);
        }

        var railCurve = new THREE.CatmullRomCurve3(railPoints);
        var tubeGeo = new THREE.TubeGeometry(railCurve, segmentCount, 0.04, 6, false);
        var railMat = new THREE.MeshStandardMaterial({
            color: color || 0x8899aa,
            metalness: 0.9,
            roughness: 0.2,
            emissive: emissive || 0x112233,
            emissiveIntensity: 0.1
        });
        var railMesh = new THREE.Mesh(tubeGeo, railMat);
        scene.add(railMesh);
        railMeshes.push(railMesh);
    }

    function createPlanks(scene, planks, color, emissive) {
        var plankGeo = new THREE.BoxGeometry(trackWidth, 0.03, 0.15);
        var plankMat = new THREE.MeshStandardMaterial({
            color: color || 0x334455,
            metalness: 0.5,
            roughness: 0.6,
            emissive: emissive || 0x001122,
            emissiveIntensity: 0.05
        });

        var instancedMesh = new THREE.InstancedMesh(plankGeo, plankMat, planks.length);
        var dummy = new THREE.Object3D();

        for (var i = 0; i < planks.length; i++) {
            var p = planks[i];
            dummy.position.copy(p.pos);
            dummy.position.y -= 0.02;

            var lookTarget = p.pos.clone().add(p.tangent);
            dummy.lookAt(lookTarget);

            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        scene.add(instancedMesh);
        trackMeshes.push(instancedMesh);
    }

    function createGlowLines(scene, planks, glowColor) {
        var step = Math.max(1, Math.floor(planks.length / 80));
        var sphereGeo = new THREE.SphereGeometry(0.06, 6, 6);
        var sphereMat = new THREE.MeshBasicMaterial({
            color: glowColor || 0x00f5d4,
            transparent: true,
            opacity: 0.6
        });

        var instancedGlow = new THREE.InstancedMesh(sphereGeo, sphereMat, Math.ceil(planks.length / step));
        var dummy = new THREE.Object3D();
        var idx = 0;

        for (var i = 0; i < planks.length; i += step) {
            var p = planks[i];
            var leftPt = p.pos.clone().add(p.right.clone().multiplyScalar(-trackWidth / 2));
            leftPt.y += 0.06;
            dummy.position.copy(leftPt);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            instancedGlow.setMatrixAt(idx, dummy.matrix);
            idx++;
        }

        instancedGlow.count = idx;
        instancedGlow.instanceMatrix.needsUpdate = true;
        scene.add(instancedGlow);
        glowMeshes.push(instancedGlow);

        var instancedGlow2 = new THREE.InstancedMesh(sphereGeo, sphereMat.clone(), Math.ceil(planks.length / step));
        idx = 0;

        for (var i = 0; i < planks.length; i += step) {
            var p = planks[i];
            var rightPt = p.pos.clone().add(p.right.clone().multiplyScalar(trackWidth / 2));
            rightPt.y += 0.06;
            dummy.position.copy(rightPt);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            instancedGlow2.setMatrixAt(idx, dummy.matrix);
            idx++;
        }

        instancedGlow2.count = idx;
        instancedGlow2.instanceMatrix.needsUpdate = true;
        scene.add(instancedGlow2);
        glowMeshes.push(instancedGlow2);
    }

    function createFinishLine(scene, planks) {
        var last = planks[planks.length - 1];
        var prev = planks[planks.length - 2];

        var finishGeo = new THREE.BoxGeometry(trackWidth * 1.5, 1.5, 0.1);
        var finishMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.5,
            transparent: true,
            opacity: 0.8
        });

        finishMesh = new THREE.Mesh(finishGeo, finishMat);
        finishMesh.position.copy(last.pos);
        finishMesh.position.y += 1.0;

        var lookTarget = last.pos.clone().add(last.tangent);
        finishMesh.lookAt(lookTarget);
        scene.add(finishMesh);

        var poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 2, 6);
        var poleMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });

        var leftPole = new THREE.Mesh(poleGeo, poleMat);
        leftPole.position.copy(last.pos);
        leftPole.position.add(last.right.clone().multiplyScalar(-trackWidth * 0.7));
        leftPole.position.y += 1;
        scene.add(leftPole);
        trackMeshes.push(leftPole);

        var rightPole = new THREE.Mesh(poleGeo, poleMat);
        rightPole.position.copy(last.pos);
        rightPole.position.add(last.right.clone().multiplyScalar(trackWidth * 0.7));
        rightPole.position.y += 1;
        scene.add(rightPole);
        trackMeshes.push(rightPole);
    }

    function createBridgeDecorations(scene, planks) {
        var pillarStep = Math.max(1, Math.floor(planks.length / 12));
        var pillarGeo = new THREE.CylinderGeometry(0.08, 0.12, 1, 6);
        var pillarMat = new THREE.MeshStandardMaterial({
            color: 0x554433,
            metalness: 0.4,
            roughness: 0.7,
            emissive: 0x221100,
            emissiveIntensity: 0.1
        });

        for (var i = pillarStep; i < planks.length - pillarStep; i += pillarStep) {
            var p = planks[i];
            var pillarHeight = Math.max(0.5, p.pos.y + 3);

            var leftPillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.1, pillarHeight, 6),
                pillarMat
            );
            leftPillar.position.copy(p.pos);
            leftPillar.position.add(p.right.clone().multiplyScalar(-trackWidth * 0.8));
            leftPillar.position.y -= pillarHeight / 2;
            scene.add(leftPillar);
            decorationMeshes.push(leftPillar);

            var rightPillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.1, pillarHeight, 6),
                pillarMat
            );
            rightPillar.position.copy(p.pos);
            rightPillar.position.add(p.right.clone().multiplyScalar(trackWidth * 0.8));
            rightPillar.position.y -= pillarHeight / 2;
            scene.add(rightPillar);
            decorationMeshes.push(rightPillar);
        }

        var lanternStep = Math.max(1, Math.floor(planks.length / 6));
        var lanternGeo = new THREE.SphereGeometry(0.08, 8, 8);
        var lanternMat = new THREE.MeshBasicMaterial({
            color: 0xff8c42,
            transparent: true,
            opacity: 0.8
        });

        for (var i = lanternStep; i < planks.length; i += lanternStep) {
            var p = planks[i];
            var lantern = new THREE.Mesh(lanternGeo, lanternMat);
            lantern.position.copy(p.pos);
            lantern.position.add(p.right.clone().multiplyScalar(trackWidth * 0.6));
            lantern.position.y += 0.8;
            scene.add(lantern);
            decorationMeshes.push(lantern);
        }
    }

    function createSnowDecorations(scene, planks) {
        var treeStep = Math.max(1, Math.floor(planks.length / 8));
        for (var i = treeStep; i < planks.length; i += treeStep) {
            var p = planks[i];
            var side = (i % 2 === 0) ? -1 : 1;
            var offset = trackWidth * (0.8 + Math.random() * 0.5);

            var trunkGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 5);
            var trunkMat = new THREE.MeshStandardMaterial({
                color: 0x4a3728,
                roughness: 0.9
            });
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.copy(p.pos);
            trunk.position.add(p.right.clone().multiplyScalar(side * offset));
            trunk.position.y -= 0.4;
            scene.add(trunk);
            decorationMeshes.push(trunk);

            var coneGeo = new THREE.ConeGeometry(0.4, 1.2, 6);
            var snowMat = new THREE.MeshStandardMaterial({
                color: 0xe8f0f8,
                metalness: 0.1,
                roughness: 0.4,
                emissive: 0x223344,
                emissiveIntensity: 0.1
            });
            var cone = new THREE.Mesh(coneGeo, snowMat);
            cone.position.copy(trunk.position);
            cone.position.y += 1.0;
            scene.add(cone);
            decorationMeshes.push(cone);

            var cone2Geo = new THREE.ConeGeometry(0.28, 0.8, 6);
            var cone2 = new THREE.Mesh(cone2Geo, snowMat);
            cone2.position.copy(trunk.position);
            cone2.position.y += 1.6;
            scene.add(cone2);
            decorationMeshes.push(cone2);
        }

        var icicleStep = Math.max(1, Math.floor(planks.length / 15));
        var icicleGeo = new THREE.ConeGeometry(0.02, 0.3, 4);
        var icicleMat = new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            metalness: 0.3,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });
        for (var i = icicleStep; i < planks.length; i += icicleStep) {
            var p = planks[i];
            var icicle = new THREE.Mesh(icicleGeo, icicleMat);
            icicle.position.copy(p.pos);
            icicle.position.add(p.right.clone().multiplyScalar(-trackWidth / 2));
            icicle.position.y -= 0.15;
            icicle.rotation.z = Math.PI;
            scene.add(icicle);
            decorationMeshes.push(icicle);
        }
    }

    function createScifiDecorations(scene, planks) {
        var ringStep = Math.max(1, Math.floor(planks.length / 10));
        var ringGeo = new THREE.TorusGeometry(trackWidth * 0.8, 0.03, 8, 24);
        var ringMat = new THREE.MeshStandardMaterial({
            color: 0xb388ff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x6633cc,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });

        for (var i = ringStep; i < planks.length; i += ringStep) {
            var p = planks[i];
            var ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(p.pos);
            ring.position.y += 0.5;

            var lookTarget = p.pos.clone().add(p.tangent);
            ring.lookAt(lookTarget);
            scene.add(ring);
            decorationMeshes.push(ring);
        }

        var panelStep = Math.max(1, Math.floor(planks.length / 6));
        var panelGeo = new THREE.PlaneGeometry(trackWidth * 0.5, 0.6);
        var panelMat = new THREE.MeshStandardMaterial({
            color: 0x220066,
            emissive: 0xb388ff,
            emissiveIntensity: 0.3,
            metalness: 0.9,
            roughness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });

        for (var i = panelStep; i < planks.length; i += panelStep) {
            var p = planks[i];
            var side = (i % 2 === 0) ? -1 : 1;
            var panel = new THREE.Mesh(panelGeo, panelMat);
            panel.position.copy(p.pos);
            panel.position.add(p.right.clone().multiplyScalar(side * trackWidth * 0.7));
            panel.position.y += 0.3;
            panel.lookAt(p.pos);
            scene.add(panel);
            decorationMeshes.push(panel);
        }
    }

    function getPointAt(t) {
        if (!curve) return new THREE.Vector3();
        return curve.getPointAt(GameUtils.clamp(t, 0, 1));
    }

    function getTangentAt(t) {
        if (!curve) return new THREE.Vector3(0, 0, -1);
        return curve.getTangentAt(GameUtils.clamp(t, 0, 1)).normalize();
    }

    function getRightAt(t) {
        var tangent = getTangentAt(t);
        var up = new THREE.Vector3(0, 1, 0);
        var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        return right;
    }

    function getUpAt(t) {
        var tangent = getTangentAt(t);
        var right = getRightAt(t);
        var up = new THREE.Vector3().crossVectors(right, tangent).normalize();
        return up;
    }

    function getTotalLength() {
        return totalLength;
    }

    function getTrackWidth() {
        return trackWidth;
    }

    function getCurve() {
        return curve;
    }

    function getTrackData() {
        return {
            curve: curve,
            width: trackWidth,
            friction: trackFriction
        };
    }

    function getCurrentLevelId() {
        return currentLevelId;
    }

    return {
        createCurve: createCurve,
        createCurveFromPoints: createCurveFromPoints,
        buildTrack: buildTrack,
        getPointAt: getPointAt,
        getTangentAt: getTangentAt,
        getRightAt: getRightAt,
        getUpAt: getUpAt,
        getTotalLength: getTotalLength,
        getTrackWidth: getTrackWidth,
        getCurve: getCurve,
        getTrackData: getTrackData,
        getCurrentLevelId: getCurrentLevelId
    };
})();
