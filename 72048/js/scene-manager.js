class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentScene = 'mountains';
        this.scenes = {};
        
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0002);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 3000, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.setupLighting();
        this.loadScene('mountains');

        window.addEventListener('resize', () => this.onResize());
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(100, 1000, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 5000;
        this.sunLight.shadow.camera.left = -1000;
        this.sunLight.shadow.camera.right = 1000;
        this.sunLight.shadow.camera.top = 1000;
        this.sunLight.shadow.camera.bottom = -1000;
        this.scene.add(this.sunLight);

        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
        this.scene.add(hemiLight);
    }

    loadScene(sceneName) {
        this.clearScene();
        this.currentScene = sceneName;

        switch (sceneName) {
            case 'mountains':
                this.createMountainScene();
                break;
            case 'beach':
                this.createBeachScene();
                break;
            case 'city':
                this.createCityScene();
                break;
        }

        this.createSkyDome();
    }

    clearScene() {
        const toRemove = [];
        this.scene.traverse((object) => {
            if (object.isMesh || object.isGroup) {
                if (object !== this.sunLight && object.type !== 'AmbientLight' && object.type !== 'HemisphereLight') {
                    toRemove.push(object);
                }
            }
        });
        toRemove.forEach(obj => this.scene.remove(obj));
    }

    createSkyDome() {
        const skyGeometry = new THREE.SphereGeometry(4000, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    createMountainScene() {
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000, 100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.1
        });

        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const height = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 200 + 
                          Math.sin(x * 0.02 + 1) * Math.cos(y * 0.02 + 1) * 100;
            positions.setZ(i, height);
        }
        groundGeometry.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        for (let i = 0; i < 20; i++) {
            const tree = this.createTree();
            tree.position.set(
                Utils.random(-2000, 2000),
                0,
                Utils.random(-2000, 2000)
            );
            const scale = Utils.random(0.8, 1.5);
            tree.scale.setScalar(scale);
            this.scene.add(tree);
        }

        const mountainGeometry = new THREE.ConeGeometry(300, 600, 8);
        const mountainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            roughness: 0.9
        });
        
        for (let i = 0; i < 5; i++) {
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(
                Utils.random(-1500, 1500),
                200,
                Utils.random(-1500, 1500)
            );
            mountain.scale.set(Utils.random(0.8, 1.5), Utils.random(1, 2), Utils.random(0.8, 1.5));
            mountain.castShadow = true;
            mountain.receiveShadow = true;
            this.scene.add(mountain);
        }

        this.scene.fog.color.setHex(0x87CEEB);
    }

    createTree() {
        const group = new THREE.Group();

        const trunkGeometry = new THREE.CylinderGeometry(3, 5, 20, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 10;
        trunk.castShadow = true;
        group.add(trunk);

        const leavesGeometry = new THREE.ConeGeometry(15, 40, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 40;
        leaves.castShadow = true;
        group.add(leaves);

        return group;
    }

    createBeachScene() {
        const oceanGeometry = new THREE.PlaneGeometry(5000, 3000, 50, 50);
        const oceanMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x006994,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.z = 1000;
        ocean.receiveShadow = true;
        this.scene.add(ocean);

        const beachGeometry = new THREE.PlaneGeometry(5000, 3000, 50, 50);
        const beachMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xF4D03F,
            roughness: 0.9
        });
        const beach = new THREE.Mesh(beachGeometry, beachMaterial);
        beach.rotation.x = -Math.PI / 2;
        beach.position.z = -1000;
        beach.receiveShadow = true;
        this.scene.add(beach);

        for (let i = 0; i < 15; i++) {
            const palm = this.createPalmTree();
            palm.position.set(
                Utils.random(-2000, 2000),
                0,
                Utils.random(-1500, -500)
            );
            const scale = Utils.random(0.8, 1.2);
            palm.scale.setScalar(scale);
            this.scene.add(palm);
        }

        const islandGeometry = new THREE.CylinderGeometry(200, 250, 50, 32);
        const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.set(0, 10, 1500);
        island.castShadow = true;
        this.scene.add(island);

        this.scene.fog.color.setHex(0x87CEEB);
    }

    createPalmTree() {
        const group = new THREE.Group();

        const trunkGeometry = new THREE.CylinderGeometry(4, 6, 30, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 15;
        trunk.castShadow = true;
        group.add(trunk);

        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        for (let i = 0; i < 6; i++) {
            const leafGeometry = new THREE.ConeGeometry(25, 5, 4);
            const leaf = new THREE.Mesh(leafGeometry, leavesMaterial);
            leaf.position.y = 35;
            leaf.rotation.z = (i / 6) * Math.PI * 2;
            leaf.rotation.x = Math.PI / 3;
            leaf.castShadow = true;
            group.add(leaf);
        }

        return group;
    }

    createCityScene() {
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4A4A4A,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        for (let i = 0; i < 50; i++) {
            const building = this.createBuilding();
            building.position.set(
                Utils.random(-2000, 2000),
                0,
                Utils.random(-2000, 2000)
            );
            this.scene.add(building);
        }

        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        for (let i = -4; i <= 4; i++) {
            const roadH = new THREE.Mesh(new THREE.PlaneGeometry(30, 4000), roadMaterial);
            roadH.rotation.x = -Math.PI / 2;
            roadH.position.set(i * 500, 0.1, 0);
            this.scene.add(roadH);

            const roadV = new THREE.Mesh(new THREE.PlaneGeometry(4000, 30), roadMaterial);
            roadV.rotation.x = -Math.PI / 2;
            roadV.position.set(0, 0.1, i * 500);
            this.scene.add(roadV);
        }

        this.scene.fog.color.setHex(0x708090);
    }

    createBuilding() {
        const width = Utils.random(50, 150);
        const height = Utils.random(100, 500);
        const depth = Utils.random(50, 150);

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(Utils.random(0.55, 0.65), 0.2, Utils.random(0.3, 0.5)),
            roughness: 0.7,
            metalness: 0.3
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;

        const windowsGeometry = new THREE.BoxGeometry(width + 1, height, depth + 1);
        const windowsMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFF88,
            emissive: 0xFFFF88,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.3
        });
        const windows = new THREE.Mesh(windowsGeometry, windowsMaterial);
        building.add(windows);

        return building;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
}
