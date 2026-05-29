class Player3D {
    constructor(scene, skinSystem) {
        this.scene = scene;
        this.skinSystem = skinSystem;
        this.position = new THREE.Vector3(0, 3000, 0);
        this.velocity = new THREE.Vector3(0, -2, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        
        this.mesh = null;
        this.parachute = null;
        this.parachuteOpen = false;
        this.parachuteProgress = 0;
        
        this.maxSpeed = 8;
        this.fallSpeed = 2;
        this.parachuteFallSpeed = 0.5;
        this.moveSpeed = 0.3;
        
        this.cameraMode = 'firstPerson';
        this.cameraOffset = new THREE.Vector3(0, 2, 5);
        
        this.createMesh();
    }

    createMesh() {
        this.mesh = new THREE.Group();
        
        const bodyGeometry = new THREE.CapsuleGeometry(8, 25, 4, 8);
        const bodyMaterial = this.skinSystem.getSkinMaterial();
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 20;
        body.castShadow = true;
        body.name = 'body';
        this.mesh.add(body);
        
        const headGeometry = new THREE.SphereGeometry(10, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 45;
        head.castShadow = true;
        this.mesh.add(head);
        
        const helmetMaterial = this.skinSystem.getEquipmentMaterial('helmet');
        const helmetGeometry = new THREE.SphereGeometry(11, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 47;
        helmet.castShadow = true;
        helmet.name = 'helmet';
        this.mesh.add(helmet);
        
        const gogglesMaterial = this.skinSystem.getEquipmentMaterial('goggles');
        const gogglesGeometry = new THREE.BoxGeometry(14, 6, 3);
        const goggles = new THREE.Mesh(gogglesGeometry, gogglesMaterial);
        goggles.position.set(0, 45, 8);
        goggles.castShadow = true;
        goggles.name = 'goggles';
        this.mesh.add(goggles);
        
        const suitMaterial = this.skinSystem.getEquipmentMaterial('suit');
        const leftArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(4, 20, 4, 8),
            suitMaterial
        );
        leftArm.position.set(-15, 25, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        
        const rightArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(4, 20, 4, 8),
            suitMaterial
        );
        rightArm.position.set(15, 25, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        
        const leftLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(5, 20, 4, 8),
            suitMaterial
        );
        leftLeg.position.set(-6, -10, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(5, 20, 4, 8),
            suitMaterial
        );
        rightLeg.position.set(6, -10, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        
        this.createParachute();
        
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    createParachute() {
        this.parachute = new THREE.Group();
        
        const canopyGeometry = new THREE.CircleGeometry(50, 32);
        const canopyMaterial = new THREE.MeshStandardMaterial({
            color: this.skinSystem.getSkinColor(),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.rotation.x = Math.PI;
        canopy.position.y = 100;
        canopy.name = 'canopy';
        this.parachute.add(canopy);
        
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const points = [
                new THREE.Vector3(Math.cos(angle) * 45, 95, Math.sin(angle) * 45),
                new THREE.Vector3(0, 40, 0)
            ];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial.clone());
            line.name = 'line';
            this.parachute.add(line);
        }
        
        this.parachute.visible = false;
        this.mesh.add(this.parachute);
    }

    update(keys, deltaTime, windForce) {
        const timeScale = deltaTime * 60;
        
        const acceleration = this.moveSpeed * timeScale;
        const friction = Math.pow(0.92, timeScale);
        
        if (keys.left) {
            this.velocity.x -= acceleration;
            this.angularVelocity.z += 0.02 * timeScale;
        } else if (keys.right) {
            this.velocity.x += acceleration;
            this.angularVelocity.z -= 0.02 * timeScale;
        }
        
        if (keys.up) {
            this.velocity.z -= acceleration;
            this.angularVelocity.x -= 0.01 * timeScale;
        } else if (keys.down) {
            this.velocity.z += acceleration;
            this.angularVelocity.x += 0.01 * timeScale;
        }
        
        this.velocity.x *= friction;
        this.velocity.z *= friction;
        this.angularVelocity.multiplyScalar(0.95);
        
        this.velocity.x = Utils.clamp(this.velocity.x, -this.maxSpeed, this.maxSpeed);
        this.velocity.z = Utils.clamp(this.velocity.z, -this.maxSpeed, this.maxSpeed);
        
        this.velocity.add(windForce.clone().multiplyScalar(timeScale));
        
        const currentFallSpeed = this.parachuteOpen ? this.parachuteFallSpeed : this.fallSpeed;
        this.velocity.y = Utils.lerp(this.velocity.y, -currentFallSpeed, 0.1 * timeScale);
        
        this.position.add(this.velocity.clone().multiplyScalar(timeScale));
        
        this.position.x = Utils.clamp(this.position.x, -2000, 2000);
        this.position.z = Utils.clamp(this.position.z, -2000, 2000);
        this.position.y = Math.max(0, this.position.y);
        
        this.rotation.x += this.angularVelocity.x * timeScale;
        this.rotation.z += this.angularVelocity.z * timeScale;
        this.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
        
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        if (this.parachuteOpen) {
            this.parachuteProgress = Utils.lerp(this.parachuteProgress, 1, 0.05 * timeScale);
            this.updateParachute();
        }
    }

    updateParachute() {
        this.parachute.visible = true;
        this.parachute.traverse(child => {
            if (child.isMesh || child.isLine) {
                child.material.opacity = this.parachuteProgress * 0.9;
            }
        });
        
        const sway = Math.sin(Date.now() * 0.002) * 0.1;
        this.parachute.rotation.z = sway;
    }

    openParachute() {
        if (!this.parachuteOpen) {
            this.parachuteOpen = true;
            this.velocity.multiplyScalar(0.3);
            this.angularVelocity.multiplyScalar(0.1);
        }
    }

    updateCamera(camera) {
        if (this.cameraMode === 'firstPerson') {
            camera.position.copy(this.position);
            camera.position.y += 45;
            
            const lookDir = this.velocity.clone().normalize();
            lookDir.y = 0;
            if (lookDir.length() > 0.1) {
                camera.lookAt(this.position.clone().add(lookDir));
            } else {
                camera.rotation.set(0, this.rotation.y, 0);
            }
        } else {
            const offset = this.cameraOffset.clone();
            offset.applyEuler(this.rotation);
            camera.position.copy(this.position).add(offset);
            camera.position.y += 40;
            camera.lookAt(this.position);
        }
    }

    toggleCameraMode() {
        this.cameraMode = this.cameraMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson';
    }

    updateSkins() {
        this.mesh.traverse(child => {
            if (child.name === 'body') {
                child.material = this.skinSystem.getSkinMaterial();
            } else if (child.name === 'helmet') {
                child.material = this.skinSystem.getEquipmentMaterial('helmet');
            } else if (child.name === 'goggles') {
                child.material = this.skinSystem.getEquipmentMaterial('goggles');
            } else if (child.name === 'canopy') {
                child.material.color.setHex(this.skinSystem.getSkinColor());
            }
        });
    }

    getAltitude() {
        return Math.round(this.position.y);
    }

    reset() {
        this.position.set(0, 3000, 0);
        this.velocity.set(0, -2, 0);
        this.rotation.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.parachuteOpen = false;
        this.parachuteProgress = 0;
        if (this.parachute) {
            this.parachute.visible = false;
        }
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}
