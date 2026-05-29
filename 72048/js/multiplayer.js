class MultiplayerSystem {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.getScene();
        this.players = [];
        this.maxPlayers = 4;
        this.isActive = false;
        this.localPlayerId = null;
        this.formation = null;
        
        this.colors = [0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0xA78BFA];
        this.names = ['玩家1', '玩家2', '玩家3', '玩家4'];
    }

    startGame(playerCount = 2) {
        this.isActive = true;
        this.players = [];
        this.localPlayerId = 0;
        
        for (let i = 0; i < playerCount; i++) {
            const player = this.createAIPlayer(i);
            this.players.push(player);
            this.scene.add(player.mesh);
        }
        
        this.createFormationTargets(playerCount);
    }

    createAIPlayer(index) {
        const group = new THREE.Group();
        
        const bodyGeometry = new THREE.CapsuleGeometry(8, 25, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.colors[index] });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 20;
        body.castShadow = true;
        group.add(body);
        
        const headGeometry = new THREE.SphereGeometry(10, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 45;
        head.castShadow = true;
        group.add(head);
        
        const helmetGeometry = new THREE.SphereGeometry(11, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 47;
        helmet.castShadow = true;
        group.add(helmet);
        
        group.position.set(
            (index - 1.5) * 50,
            3000,
            0
        );
        
        return {
            id: index,
            mesh: group,
            velocity: new THREE.Vector3(0, -0.5, 0),
            targetPosition: new THREE.Vector3(0, 0, 0),
            isLocal: index === 0,
            name: this.names[index],
            color: this.colors[index],
            coins: 0,
            tricks: 0
        };
    }

    createFormationTargets(count) {
        this.formation = {
            targets: [],
            active: false
        };
        
        const formations = {
            2: [[0, 0, 0], [50, 0, 0]],
            3: [[0, 0, 0], [-40, 30, 0], [40, 30, 0]],
            4: [[0, 0, 0], [-50, 0, 0], [50, 0, 0], [0, 50, 0]]
        };
        
        const formation = formations[count] || formations[2];
        formation.forEach((pos, i) => {
            const target = new THREE.Mesh(
                new THREE.RingGeometry(15, 20, 32),
                new THREE.MeshBasicMaterial({ 
                    color: this.colors[i], 
                    transparent: true, 
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            target.rotation.x = -Math.PI / 2;
            target.visible = false;
            target.userData.playerIndex = i;
            this.formation.targets.push(target);
            this.scene.add(target);
        });
    }

    startFormation() {
        if (!this.formation) return;
        this.formation.active = true;
        this.formation.targets.forEach(t => t.visible = true);
    }

    stopFormation() {
        if (!this.formation) return;
        this.formation.active = false;
        this.formation.targets.forEach(t => t.visible = false);
    }

    update(deltaTime, localPlayer, windForce) {
        if (!this.isActive) return;
        
        const timeScale = deltaTime * 60;
        
        this.players.forEach((player, index) => {
            if (player.isLocal) {
                player.mesh.position.copy(localPlayer.position);
                player.mesh.rotation.copy(localPlayer.rotation);
            } else {
                this.updateAIPlayer(player, index, timeScale, localPlayer, windForce);
            }
            
            if (this.formation && this.formation.active) {
                const target = this.formation.targets[index];
                target.position.copy(player.mesh.position);
                target.position.y -= 5;
            }
        });
        
        this.checkFormationBonus();
    }

    updateAIPlayer(player, index, timeScale, localPlayer, windForce) {
        const followDistance = 30 + index * 10;
        const followOffset = new THREE.Vector3(
            (index - 1.5) * 40,
            0,
            followDistance
        );
        
        const targetPos = localPlayer.position.clone().add(followOffset);
        targetPos.y = Math.max(targetPos.y, localPlayer.position.y - 20);
        
        player.velocity.lerp(
            targetPos.clone().sub(player.mesh.position).multiplyScalar(0.02),
            0.1
        );
        
        player.velocity.add(windForce.clone().multiplyScalar(0.5));
        player.velocity.y = Math.min(player.velocity.y, -0.3);
        
        player.mesh.position.add(player.velocity.clone().multiplyScalar(timeScale));
        
        const lookTarget = player.mesh.position.clone().add(player.velocity);
        player.mesh.lookAt(lookTarget);
        
        if (Math.random() < 0.001) {
            player.tricks++;
        }
    }

    checkFormationBonus() {
        if (!this.formation || !this.formation.active) return 0;
        
        let inFormation = 0;
        this.players.forEach((player, index) => {
            const targetPos = new THREE.Vector3(
                (index - 1.5) * 40,
                0,
                30 + index * 10
            );
            targetPos.add(this.players[0].mesh.position);
            
            const dist = player.mesh.position.distanceTo(targetPos);
            if (dist < 30) inFormation++;
        });
        
        if (inFormation === this.players.length) {
            return 10;
        }
        return 0;
    }

    getPlayerRankings() {
        return [...this.players].sort((a, b) => {
            const aScore = a.coins * 100 + a.tricks * 50 - a.mesh.position.y;
            const bScore = b.coins * 100 + b.tricks * 50 - b.mesh.position.y;
            return bScore - aScore;
        });
    }

    collectCoin(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) player.coins++;
    }

    getPlayerPosition(playerId) {
        const rankings = this.getPlayerRankings();
        return rankings.findIndex(p => p.id === playerId) + 1;
    }

    endGame() {
        this.isActive = false;
        this.players.forEach(p => this.scene.remove(p.mesh));
        if (this.formation) {
            this.formation.targets.forEach(t => this.scene.remove(t));
        }
        this.players = [];
        this.formation = null;
    }

    getPlayers() {
        return this.players;
    }

    isPlayerLocal(playerId) {
        return playerId === this.localPlayerId;
    }
}
