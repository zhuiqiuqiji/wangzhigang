class Game3D {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.style.display = 'none';

        this.sceneManager = null;
        this.weatherSystem = null;
        this.multiplayer = null;
        this.skinSystem = new SkinSystem();
        this.tricksSystem = new TricksSystem();
        this.player = null;
        this.coins = [];
        this.obstacles = [];
        
        this.state = 'MENU';
        this.currentScene = 'mountains';
        this.weather = 'clear';
        this.multiplayerMode = false;
        this.playerCount = 2;
        
        this.collectedCoins = 0;
        this.coinScore = 0;
        this.landingScore = 0;
        this.trickScore = 0;
        this.totalScore = 0;
        this.totalScore = 0;
        
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        this.parachuteOpenAltitude = 500;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.init();
    }
    
    init() {
        this.sceneManager = new SceneManager(this.container);
        this.weatherSystem = new WeatherSystem(this.sceneManager);
        this.player = new Player3D(this.sceneManager.getScene(), this.skinSystem);
        
        this.initUI();
        this.initEventListeners();
        this.updateHighScoreDisplay();
        
        if (Utils.isMobile()) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
        
        this.gameLoop(0);
    }
    
    initUI() {
        document.getElementById('startMenu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        
        this.addV2UI();
    }
    
    addV2UI() {
        const startMenu = document.querySelector('#startMenu .menu-content');
        
        const sceneSelect = document.createElement('div');
        sceneSelect.className = 'scene-select';
        sceneSelect.innerHTML = `
            <h3>🗺️ 选择场景</h3>
            <div class="scene-buttons">
                <button class="scene-btn active" data-scene="mountains">🏔️ 山脉</button>
                <button class="scene-btn" data-scene="beach">🏖️ 海滩</button>
                <button class="scene-btn" data-scene="city">🏙️ 城市</button>
            </div>
        `;
        startMenu.insertBefore(sceneSelect, startMenu.querySelector('.instructions-card'));
        
        const weatherSelect = document.createElement('div');
        weatherSelect.className = 'weather-select';
        weatherSelect.innerHTML = `
            <h3>🌤️ 天气</h3>
            <div class="weather-buttons">
                <button class="weather-btn active" data-weather="clear">☀️ 晴朗</button>
                <button class="weather-btn" data-weather="cloudy">☁️ 多云</button>
                <button class="weather-btn" data-weather="rain">🌧️ 下雨</button>
                <button class="weather-btn" data-weather="storm">⛈️ 雷暴</button>
            </div>
        `;
        startMenu.insertBefore(weatherSelect, startMenu.querySelector('.instructions-card'));
        
        const multiplayerSelect = document.createElement('div');
        multiplayerSelect.className = 'multiplayer-select';
        multiplayerSelect.innerHTML = `
            <h3>👥 游戏模式</h3>
            <div class="mode-buttons">
                <button class="mode-btn active" data-mode="single">单人</button>
                <button class="mode-btn" data-mode="multi">多人竞技</button>
            </div>
            <div class="player-count hidden">
                <label>玩家数量:</label>
                <select id="playerCount">
                    <option value="2">2人</option>
                    <option value="3">3人</option>
                    <option value="4">4人</option>
                </select>
            </div>
        `;
        startMenu.insertBefore(multiplayerSelect, startMenu.querySelector('.instructions-card'));
        
        const skinSelect = document.createElement('div');
        skinSelect.className = 'skin-select';
        skinSelect.innerHTML = `
            <h3>🎨 定制角色</h3>
            <button id="customizeBtn" class="customize-btn">👤 自定义装备</button>
        `;
        startMenu.insertBefore(skinSelect, startMenu.querySelector('.instructions-card'));
        
        const style = document.createElement('style');
        style.textContent = `
            .scene-select, .weather-select, .multiplayer-select, .skin-select {
                background: rgba(255,255,255,0.9);
                border-radius: 15px;
                padding: 15px;
                margin-bottom: 15px;
                text-align: left;
            }
            .scene-select h3, .weather-select h3, .multiplayer-select h3, .skin-select h3 {
                color: #1E90FF;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .scene-buttons, .weather-buttons, .mode-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .scene-btn, .weather-btn, .mode-btn {
                flex: 1;
                min-width: 70px;
                padding: 8px 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            .scene-btn:hover, .weather-btn:hover, .mode-btn:hover {
                border-color: #1E90FF;
                background: #f0f8ff;
            }
            .scene-btn.active, .weather-btn.active, .mode-btn.active {
                border-color: #1E90FF;
                background: #1E90FF;
                color: white;
            }
            .player-count {
                margin-top: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .player-count select {
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
            .customize-btn {
                width: 100%;
                padding: 10px;
                border: 2px dashed #1E90FF;
                border-radius: 8px;
                background: #f0f8ff;
                cursor: pointer;
                font-size: 14px;
                color: #1E90FF;
                transition: all 0.2s;
            }
            .customize-btn:hover {
                background: #1E90FF;
                color: white;
            }
            .trick-hud {
                position: absolute;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.7);
                padding: 10px 20px;
                border-radius: 10px;
                color: #FFD700;
                font-weight: bold;
                font-size: 18px;
                font-family: 'Orbitron', sans-serif;
                z-index: 20;
            }
            .combo-display {
                position: absolute;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                color: #FF6B6B;
                font-size: 24px;
                font-weight: bold;
                font-family: 'Orbitron', sans-serif;
                z-index: 20;
                animation: pulse 0.5s ease-out;
            }
            .trick-popup {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 48px;
                font-weight: bold;
                color: #FFD700;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                animation: trickPopup 1s ease-out forwards;
                pointer-events: none;
                z-index: 30;
            }
            @keyframes trickPopup {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -70%) scale(1); opacity: 0; }
            }
            .player-list {
                position: absolute;
                right: 20px;
                top: 80px;
                background: rgba(0,0,0,0.6);
                padding: 10px;
                border-radius: 10px;
                color: white;
                z-index: 10;
            }
            .player-list-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 10px;
                margin: 3px 0;
                border-radius: 5px;
            }
            .player-list-item.local {
                background: rgba(255, 107, 107, 0.3);
            }
        `;
        document.head.appendChild(style);
        
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentScene = e.target.dataset.scene;
                this.sceneManager.loadScene(this.currentScene);
            });
        });
        
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.weather = e.target.dataset.weather;
            });
        });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.multiplayerMode = e.target.dataset.mode === 'multi';
                document.querySelector('.player-count').classList.toggle('hidden', !this.multiplayerMode);
            });
        });
        
        document.getElementById('playerCount').addEventListener('change', (e) => {
            this.playerCount = parseInt(e.target.value);
        });
        
        document.getElementById('customizeBtn').addEventListener('click', () => this.showCustomizeMenu());
    }
    
    showCustomizeMenu() {
        const customizeUI = document.createElement('div');
        customizeUI.className = 'menu';
        customizeUI.innerHTML = `
            <div class="menu-content">
                <h2 class="result-title">🎨 角色定制</h2>
                <div class="customize-content">
                    <div class="skin-section">
                    <h3>🪂 降落伞皮肤</h3>
                    <div class="skin-options">
                        ${this.skinSystem.getAvailableSkins().map(skin => `
                            <div class="skin-option ${skin.selected ? 'selected' : ''} ${skin.unlocked ? '' : 'locked'}" data-skin="${skin.id}">
                                <div class="skin-preview" style="background: #${skin.color.toString(16).padStart(6, '0')}"></div>
                                <span>${skin.name}</span>
                                ${skin.unlocked ? '' : `<span class="price">🪙 ${skin.price}</span>`}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="equip-section">
                    <h3>⛑️ 装备</h3>
                    ${['helmet', 'goggles', 'suit'].map(type => `
                        <div class="equip-type">
                        <h4>${type === 'helmet' ? '头盔' : type === 'goggles' ? '护目镜' : '飞行服'}</h4>
                        <div class="equip-options">
                            ${this.skinSystem.getAvailableEquipment(type).map(equip => `
                                <div class="equip-option ${equip.selected ? 'selected' : ''} ${equip.unlocked ? '' : 'locked'}" data-type="${type}" data-equip="${equip.id}">
                                    <div class="equip-preview" style="background: #${equip.color.toString(16).padStart(6, '0')}"></div>
                                    <span>${equip.name}</span>
                                    ${equip.unlocked ? '' : `<span class="price">🪙 ${equip.price}</span>`}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    `).join('')}
                </div>
                </div>
                <button id="closeCustomize" class="start-btn">返回</button>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .customize-content {
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 10px;
            }
            .skin-section, .equip-section {
                background: rgba(255,255,255,0.9);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .skin-options, .equip-options {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            .skin-option, .equip-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .skin-option:hover, .equip-option:hover {
                border-color: #1E90FF;
                transform: translateY(-2px);
            }
            .skin-option.selected, .equip-option.selected {
                border-color: #1E90FF;
                background: #f0f8ff;
            }
            .skin-option.locked, .equip-option.locked {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .skin-preview, .equip-preview {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                margin-bottom: 5px;
                border: 2px solid rgba(0,0,0,0.1);
            }
            .price {
                font-size: 12px;
                color: #FFD700;
                margin-top: 3px;
            }
            .equip-type {
                margin-bottom: 15px;
            }
            .equip-type h4 {
                color: #333;
                margin-bottom: 8px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(customizeUI);
        
        customizeUI.querySelectorAll('.skin-option').forEach(option => {
            option.addEventListener('click', () => {
                const skinId = option.dataset.skin;
                if (this.skinSystem.isSkinUnlocked(skinId)) {
                    this.skinSystem.setSkin(skinId);
                    this.player.updateSkins();
                    customizeUI.remove();
                    this.showCustomizeMenu();
                } else {
                    const skin = this.skinSystem.skins[skinId];
                    if (confirm(`是否花费 ${skin.price} 金币解锁 ${skin.name}？`)) {
                        const cost = this.skinSystem.unlockSkin(skinId, 99999);
                        if (cost) {
                            alert('解锁成功！');
                            this.player.updateSkins();
                            customizeUI.remove();
                            this.showCustomizeMenu();
                        }
                    }
                }
            });
        });
        
        customizeUI.querySelectorAll('.equip-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                const equipId = option.dataset.equip;
                if (this.skinSystem.isEquipmentUnlocked(type, equipId)) {
                    this.skinSystem.setEquipment(type, equipId);
                    this.player.updateSkins();
                    customizeUI.remove();
                    this.showCustomizeMenu();
                } else {
                    const equip = this.skinSystem.equipment[type][equipId];
                    if (confirm(`是否花费 ${equip.price} 金币解锁 ${equip.name}？`)) {
                        const cost = this.skinSystem.unlockEquipment(type, equipId, 99999);
                        if (cost) {
                            alert('解锁成功！');
                            this.player.updateSkins();
                            customizeUI.remove();
                            this.showCustomizeMenu();
                        }
                    }
                }
            });
        });
        
        document.getElementById('closeCustomize').addEventListener('click', () => {
            customizeUI.remove();
        });
    }
    
    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = true;
                this.tricksSystem.onKeyDown('left');
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = true;
                this.tricksSystem.onKeyDown('right');
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = true;
                this.tricksSystem.onKeyDown('up');
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = true;
                this.tricksSystem.onKeyDown('down');
            }
            if (e.key === ' ') {
                e.preventDefault();
                this.tryOpenParachute();
            }
            if (e.key === 'v' || e.key === 'V') {
                this.player.toggleCameraMode();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = false;
                this.tricksSystem.onKeyUp('left');
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = false;
                this.tricksSystem.onKeyUp('right');
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.keys.up = false;
                this.tricksSystem.onKeyUp('up');
            }
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                this.keys.down = false;
                this.tricksSystem.onKeyUp('down');
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const key = btn.dataset.key;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
                this.tricksSystem.onKeyDown(key);
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
                this.tricksSystem.onKeyUp(key);
            });
        });
        
        document.getElementById('parachuteBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.tryOpenParachute();
        });
    }
    
    startGame() {
        this.state = 'PLAYING';
        this.player.reset();
        this.coins = [];
        this.obstacles = [];
        this.collectedCoins = 0;
        this.coinScore = 0;
        this.landingScore = 0;
        this.trickScore = 0;
        this.totalScore = 0;
        this.tricksSystem.reset();
        
        this.sceneManager.loadScene(this.currentScene);
        this.weatherSystem.setWeather(this.weather);
        
        if (this.multiplayerMode) {
            if (!this.multiplayer) {
                this.multiplayer = new MultiplayerSystem(this.sceneManager);
            }
            this.multiplayer.startGame(this.playerCount);
        } else if (this.multiplayer) {
            this.multiplayer.endGame();
            this.multiplayer = null;
        }
        
        this.generateLevel();
        
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        if (Utils.isMobile()) {
            document.getElementById('mobileControls').classList.remove('hidden');
        }
        
        this.updateHUD();
    }
    
    generateLevel() {
        for (let y = 0; y < 3000; y += Utils.random(80, 150)) {
            const coin = new THREE.Mesh(
                new THREE.TorusGeometry(20, 5, 8, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xFFD700,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: 0xFFA500,
                    emissiveIntensity: 0.3
                })
            );
            coin.position.set(
                Utils.random(-800, 800),
                3000 - y,
                Utils.random(-800, 800)
            );
            coin.userData.collected = false;
            coin.userData.rotationSpeed = Utils.random(0.02, 0.05);
            this.coins.push(coin);
            this.sceneManager.getScene().add(coin);
        }
        
        const obstacleTypes = ['bird', 'balloon', 'drone'];
        for (let y = 300; y < 3000; y += Utils.random(150, 250)) {
            const type = obstacleTypes[Utils.randomInt(0, obstacleTypes.length - 1)];
            let obstacle;
            
            if (type === 'bird') {
                obstacle = this.createBird();
            } else if (type === 'balloon') {
                obstacle = this.createBalloon();
            } else {
                obstacle = this.createDrone();
            }
            
            obstacle.position.set(
                Utils.random(-800, 800),
                3000 - y,
                Utils.random(-800, 800)
            );
            obstacle.userData.type = type;
            this.obstacles.push(obstacle);
            this.sceneManager.getScene().add(obstacle);
        }
    }
    
    createBird() {
        const group = new THREE.Group();
        
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(15, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        body.scale.set(1, 0.6, 1.5);
        group.add(body);
        
        const wingGeometry = new THREE.BoxGeometry(30, 2, 10);
        const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-15, 0, 0);
        leftWing.userData.isWing = true;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(15, 0, 0);
        rightWing.userData.isWing = true;
        group.add(rightWing);
        
        return group;
    }
    
    createBalloon() {
        const group = new THREE.Group();
        
        const colors = [0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0xA78BFA];
        const balloon = new THREE.Mesh(
            new THREE.SphereGeometry(25, 16, 16),
            new THREE.MeshStandardMaterial({
                color: colors[Utils.randomInt(0, colors.length - 1)],
                transparent: true,
                opacity: 0.9
            })
        );
        balloon.scale.y = 1.3;
        group.add(balloon);
        
        const rope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 40, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        rope.position.y = -35;
        group.add(rope);
        
        return group;
    }
    
    createDrone() {
        const group = new THREE.Group();
        
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(30, 8, 30),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        group.add(body);
        
        const armGeometry = new THREE.BoxGeometry(50, 2, 5);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        
        const arm1 = new THREE.Mesh(armGeometry, armMaterial);
        arm1.rotation.y = Math.PI / 4;
        group.add(arm1);
        
        const arm2 = new THREE.Mesh(armGeometry, armMaterial);
        arm2.rotation.y = -Math.PI / 4;
        group.add(arm2);
        
        const propellerGeometry = new THREE.CylinderGeometry(15, 15, 1, 8);
        const propellerMaterial = new THREE.MeshStandardMaterial({ color: 0x4ECDC4 });
        
        [[25, 5, 25], [-25, 5, 25], [25, 5, -25], [-25, 5, -25]].forEach(([x, y, z]) => {
            const prop = new THREE.Mesh(propellerGeometry, propellerMaterial);
            prop.position.set(x, y, z);
            prop.rotation.x = Math.PI / 2;
            prop.userData.isPropeller = true;
            group.add(prop);
        });
        
        return group;
    }
    
    tryOpenParachute() {
        if (this.state === 'PLAYING' && this.player.getAltitude() <= this.parachuteOpenAltitude) {
            this.player.openParachute();
            document.getElementById('parachuteHint').classList.add('hidden');
        }
    }
    
    update(deltaTime) {
        if (this.state !== 'PLAYING' && this.state !== 'PARACHUTE') return;
        
        const windForce = this.weatherSystem.update(deltaTime, this.player.position);
        
        this.player.update(this.keys, deltaTime, windForce);
        this.tricksSystem.update(deltaTime, this.player);
        
        if (this.player.parachuteOpen) {
            this.state = 'PARACHUTE';
        }
        
        if (this.player.getAltitude() <= this.parachuteOpenAltitude && !this.player.parachuteOpen) {
            document.getElementById('parachuteHint').classList.remove('hidden');
        }
        
        this.coins.forEach(coin => {
            coin.rotation.y += coin.userData.rotationSpeed;
            coin.rotation.x += coin.userData.rotationSpeed * 0.5;
            
            if (coin.userData.collected) return;
            
            const dist = this.player.position.distanceTo(coin.position);
            if (dist < 40) {
                coin.userData.collected = true;
                coin.visible = false;
                this.collectedCoins++;
                this.coinScore += 100;
                this.showTrickPopup('+100');
            }
        });
        
        this.obstacles.forEach(obstacle => {
            if (obstacle.userData.type === 'bird') {
                obstacle.children.forEach(child => {
                    if (child.userData.isWing) {
                        child.rotation.z = Math.sin(Date.now() * 0.01) * 0.5;
                    }
                });
            } else if (obstacle.userData.type === 'drone') {
                obstacle.children.forEach(child => {
                    if (child.userData.isPropeller) {
                        child.rotation.z += 0.5;
                    }
                });
            }
            
            const dist = this.player.position.distanceTo(obstacle.position);
            if (dist < 50) {
                this.player.position.y = Math.max(0, this.player.position.y - 100);
                obstacle.visible = false;
            }
        });
        
        if (this.multiplayer) {
            this.multiplayer.update(deltaTime, this.player.position, windForce);
        }
        
        if (this.player.getAltitude() <= 0) {
            this.endGame();
        }
        
        this.trickScore = this.tricksSystem.getTrickScore();
        this.updateHUD();
        this.updateTrickDisplay();
    }
    
    updateHUD() {
        document.getElementById('altitude').textContent = this.player.getAltitude() + 'm';
        document.getElementById('coins').textContent = '🪙 ' + this.collectedCoins;
    }
    
    updateTrickDisplay() {
        const activeTrick = this.tricksSystem.getActiveTrickName();
        const combo = this.tricksSystem.getCombo();
        
        let trickHUD = document.querySelector('.trick-hud');
        if (trickHUD) trickHUD.remove();
        
        if (activeTrick) {
            trickHUD = document.createElement('div');
            trickHUD.className = 'trick-hud';
            trickHUD.textContent = activeTrick;
            document.getElementById('gameContainer').appendChild(trickHUD);
        }
        
        if (combo > 1) {
            let comboDisplay = document.querySelector('.combo-display');
            if (comboDisplay) {
                comboDisplay.textContent = combo + 'x 连击!';
            } else {
                comboDisplay = document.createElement('div');
                comboDisplay.className = 'combo-display';
                comboDisplay.textContent = combo + 'x 连击!';
                document.getElementById('gameContainer').appendChild(comboDisplay);
            }
        } else {
            document.querySelector('.combo-display')?.remove();
        }
    }
    
    showTrickPopup(text) {
        const popup = document.createElement('div');
        popup.className = 'trick-popup';
        popup.textContent = text;
        document.getElementById('gameContainer').appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }
    
    endGame() {
        this.state = 'GAME_OVER';
        
        const distanceFromTarget = Math.abs(this.player.position.x);
        if (distanceFromTarget < 50) {
            this.landingScore = 500;
        } else if (distanceFromTarget < 150) {
            this.landingScore = 300;
        } else if (distanceFromTarget < 300) {
            this.landingScore = 150;
        } else if (distanceFromTarget < 500) {
            this.landingScore = 50;
        } else {
            this.landingScore = 0;
        }
        
        this.totalScore = this.coinScore + this.landingScore + this.trickScore;
        
        const highScore = Utils.getHighScore();
        const isNewHighScore = this.totalScore > highScore;
        if (isNewHighScore) {
            Utils.setHighScore(this.totalScore);
        }
        
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobileControls').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.remove('hidden');
        document.getElementById('coinScore').textContent = this.coinScore;
        document.getElementById('landingScore').textContent = this.landingScore;
        document.getElementById('totalScore').textContent = this.totalScore;
        
        const newHighScoreEl = document.getElementById('newHighScore');
        if (isNewHighScore) {
            newHighScoreEl.classList.remove('hidden');
        } else {
            newHighScoreEl.classList.add('hidden');
        }
        
        document.getElementById('parachuteHint').classList.add('hidden');
        document.querySelector('.trick-hud')?.remove();
        document.querySelector('.combo-display')?.remove();
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = Utils.getHighScore();
    }
    
    gameLoop(timestamp) {
        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(this.deltaTime);
        
        if (this.state === 'PLAYING' || this.state === 'PARACHUTE') {
            this.player.updateCamera(this.sceneManager.getCamera());
        }
        
        this.sceneManager.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('load', () => {
    new Game3D();
});
