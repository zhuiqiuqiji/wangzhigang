var SceneManager = (function () {
    var scene = null;
    var renderer = null;
    var camera = null;
    var clock = null;
    var stars = null;
    var ambientLight = null;
    var dirLight = null;
    var pointLights = [];
    var animationId = null;
    var updateCallback = null;
    var currentLevelTheme = null;

    function init(canvas) {
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0e27, 0.003);

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x0a0e27, 1);
        renderer.shadowMap.enabled = false;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        camera.position.set(0, 5, 8);

        CameraController.init(camera);

        clock = new THREE.Clock();

        createDefaultLights();
        createStarfield();

        window.addEventListener('resize', onResize);

        return {
            scene: scene,
            camera: camera,
            renderer: renderer
        };
    }

    function applyLevelTheme(levelData) {
        if (!levelData) return;
        currentLevelTheme = levelData;

        if (scene.fog) {
            scene.fog.color.setHex(levelData.fogColor || 0x0a0e27);
            scene.fog.density = levelData.fogDensity || 0.003;
        }

        renderer.setClearColor(levelData.bgColor || 0x0a0e27, 1);

        if (ambientLight) {
            ambientLight.color.setHex(levelData.ambientColor || 0x223344);
            ambientLight.intensity = levelData.ambientIntensity || 0.6;
        }

        if (dirLight) {
            dirLight.color.setHex(levelData.dirLightColor || 0xffeedd);
            dirLight.intensity = levelData.dirLightIntensity || 0.8;
        }

        if (levelData.pointLightColors && pointLights.length > 0) {
            for (var i = 0; i < pointLights.length; i++) {
                if (i < levelData.pointLightColors.length) {
                    pointLights[i].color.setHex(levelData.pointLightColors[i]);
                }
            }
        }
    }

    function createDefaultLights() {
        ambientLight = new THREE.AmbientLight(0x223344, 0.6);
        scene.add(ambientLight);

        dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
        dirLight.position.set(10, 20, 5);
        scene.add(dirLight);

        var colors = [0x00f5d4, 0x00f5d4, 0xff6b35, 0x4488ff, 0x00f5d4];
        var offsets = [
            { x: -3, y: -2, z: 0 },
            { x: 3, y: -2, z: 0 },
            { x: 0, y: -3, z: 0 },
            { x: 0, y: 5, z: -10 },
            { x: 0, y: -2, z: 5 }
        ];

        for (var i = 0; i < colors.length; i++) {
            var pl = new THREE.PointLight(colors[i], 0.6, 15);
            pl.position.set(offsets[i].x, offsets[i].y, offsets[i].z);
            scene.add(pl);
            pointLights.push(pl);
        }
    }

    function createStarfield() {
        var starCount = 1500;
        var positions = new Float32Array(starCount * 3);
        var sizes = new Float32Array(starCount);

        for (var i = 0; i < starCount; i++) {
            var radius = 100 + Math.random() * 200;
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 50;
            positions[i * 3 + 2] = radius * Math.cos(phi);
            sizes[i] = Math.random() * 1.5 + 0.5;
        }

        var starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        var starMat = new THREE.PointsMaterial({
            color: 0xccddff,
            size: 0.5,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
    }

    function updatePointLights(ballPos) {
        if (!ballPos || pointLights.length === 0) return;

        pointLights[0].position.set(ballPos.x - 3, ballPos.y - 2, ballPos.z);
        pointLights[1].position.set(ballPos.x + 3, ballPos.y - 2, ballPos.z);
        pointLights[2].position.set(ballPos.x, ballPos.y - 3, ballPos.z);
        pointLights[3].position.set(ballPos.x, ballPos.y + 5, ballPos.z - 10);
        pointLights[4].position.set(ballPos.x, ballPos.y - 2, ballPos.z + 5);
    }

    function onResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function startRenderLoop(callback) {
        updateCallback = callback;
        animate();
    }

    function animate() {
        animationId = requestAnimationFrame(animate);

        var dt = clock.getDelta();
        if (dt > 0.1) dt = 0.1;

        if (updateCallback) {
            var result = updateCallback(dt);
            if (result && result.position) {
                updatePointLights(result.position);
                CameraController.update(result.position, result.progress, result.tiltAngle);
            }
        }

        if (stars) {
            stars.rotation.y += 0.00003;
        }

        renderer.render(scene, camera);
    }

    function stopRenderLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function clearScene() {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        pointLights = [];
        stars = null;
        ambientLight = null;
        dirLight = null;
    }

    function rebuildForLevel(levelData) {
        clearScene();

        scene.fog = new THREE.FogExp2(
            levelData.fogColor || 0x0a0e27,
            levelData.fogDensity || 0.003
        );

        createDefaultLights();
        applyLevelTheme(levelData);
        createStarfield();
    }

    function getScene() {
        return scene;
    }

    function getCamera() {
        return camera;
    }

    function getClock() {
        return clock;
    }

    return {
        init: init,
        startRenderLoop: startRenderLoop,
        stopRenderLoop: stopRenderLoop,
        getScene: getScene,
        getCamera: getCamera,
        getClock: getClock,
        applyLevelTheme: applyLevelTheme,
        rebuildForLevel: rebuildForLevel,
        clearScene: clearScene
    };
})();
