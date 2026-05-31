var Collectibles = (function () {
    var items = [];
    var collectedCoins = 0;
    var collectedGems = 0;
    var totalCoins = 0;
    var totalGems = 0;
    var energyTimer = 0;
    var collectRadius = 0.35;
    var meshGroup = null;

    function init(scene) {
        if (!meshGroup) {
            meshGroup = new THREE.Group();
            scene.add(meshGroup);
        }
    }

    function loadForLevel(levelId) {
        clear();
        var level = Levels.getById(levelId);
        if (!level || !level.collectibles) return;

        for (var i = 0; i < level.collectibles.length; i++) {
            var c = level.collectibles[i];
            var item = createItem(c.type, c.t, c.offset, level);
            if (item) {
                items.push(item);
                meshGroup.add(item.mesh);
            }
        }

        totalCoins = 0;
        totalGems = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type === 'coin') totalCoins++;
            if (items[i].type === 'gem') totalGems++;
        }
    }

    function createItem(type, t, offset, level) {
        var curve = TrackGenerator.getCurve();
        if (!curve) return null;

        var pos = curve.getPointAt(GameUtils.clamp(t, 0, 1));
        var tangent = curve.getTangentAt(GameUtils.clamp(t, 0, 1)).normalize();
        var up = new THREE.Vector3(0, 1, 0);
        var right = new THREE.Vector3().crossVectors(tangent, up).normalize();
        up.crossVectors(right, tangent).normalize();

        var mesh;
        if (type === 'coin') {
            mesh = createCoinMesh();
        } else if (type === 'gem') {
            mesh = createGemMesh();
        } else if (type === 'energy') {
            mesh = createEnergyMesh();
        } else {
            return null;
        }

        var itemPos = pos.clone();
        itemPos.add(right.clone().multiplyScalar(offset));
        itemPos.add(up.clone().multiplyScalar(0.4));
        mesh.position.copy(itemPos);

        return {
            type: type,
            t: t,
            offset: offset,
            mesh: mesh,
            collected: false,
            baseY: itemPos.y
        };
    }

    function createCoinMesh() {
        var geo = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12);
        var mat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x664400,
            emissiveIntensity: 0.3
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = Math.PI / 2;
        return mesh;
    }

    function createGemMesh() {
        var geo = new THREE.OctahedronGeometry(0.1, 0);
        var mat = new THREE.MeshStandardMaterial({
            color: 0xff3366,
            metalness: 0.3,
            roughness: 0.1,
            emissive: 0xff0033,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geo, mat);
    }

    function createEnergyMesh() {
        var geo = new THREE.SphereGeometry(0.12, 12, 12);
        var mat = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.6
        });
        var mesh = new THREE.Mesh(geo, mat);

        var glowGeo = new THREE.SphereGeometry(0.18, 8, 8);
        var glowMat = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.15
        });
        mesh.add(new THREE.Mesh(glowGeo, glowMat));
        return mesh;
    }

    function update(dt, ballPos, ballRadius) {
        var time = Date.now() * 0.003;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.collected) continue;

            item.mesh.rotation.y += dt * 2;
            item.mesh.position.y = item.baseY + Math.sin(time + i) * 0.05;

            if (ballPos) {
                var dist = item.mesh.position.distanceTo(ballPos);
                if (dist < collectRadius + (ballRadius || 0.18)) {
                    collectItem(item);
                }
            }
        }

        if (energyTimer > 0) {
            energyTimer -= dt;
        }
    }

    function collectItem(item) {
        item.collected = true;

        if (item.type === 'coin') collectedCoins++;
        if (item.type === 'gem') collectedGems++;
        if (item.type === 'energy') energyTimer = 3.0;

        animateCollect(item);
    }

    function animateCollect(item) {
        var mesh = item.mesh;
        var startTime = performance.now();
        var duration = 300;

        function tick() {
            var elapsed = performance.now() - startTime;
            var t = Math.min(elapsed / duration, 1);
            var scale = 1 - t;
            mesh.scale.set(scale, scale, scale);
            mesh.position.y += 0.02;
            mesh.material.opacity = Math.max(0, 1 - t);
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                meshGroup.remove(mesh);
            }
        }
        requestAnimationFrame(tick);
    }

    function clear() {
        if (meshGroup) {
            while (meshGroup.children.length) {
                meshGroup.remove(meshGroup.children[0]);
            }
        }
        items = [];
        collectedCoins = 0;
        collectedGems = 0;
        totalCoins = 0;
        totalGems = 0;
        energyTimer = 0;
    }

    function hasEnergy() {
        return energyTimer > 0;
    }

    function getStats() {
        return {
            coins: collectedCoins,
            gems: collectedGems,
            totalCoins: totalCoins,
            totalGems: totalGems,
            score: collectedCoins * 10 + collectedGems * 50
        };
    }

    return {
        init: init,
        loadForLevel: loadForLevel,
        update: update,
        clear: clear,
        hasEnergy: hasEnergy,
        getStats: getStats
    };
})();
