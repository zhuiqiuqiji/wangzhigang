class WeatherSystem {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.scene = sceneManager.getScene();
        this.currentWeather = 'clear';
        this.wind = new THREE.Vector3(0, 0, 0);
        this.clouds = [];
        this.stormZones = [];
        this.weatherTypes = ['clear', 'cloudy', 'rain', 'storm'];
        this.particles = null;
        
        this.init();
    }

    init() {
        this.createClouds();
        this.createParticleSystem();
    }

    createClouds() {
        const cloudGeometry = new THREE.SphereGeometry(100, 16, 16);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            roughness: 1
        });

        for (let i = 0; i < 30; i++) {
            const cloudGroup = new THREE.Group();
            
            for (let j = 0; j < 5; j++) {
                const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
                cloud.position.set(
                    Utils.random(-80, 80),
                    Utils.random(-20, 20),
                    Utils.random(-80, 80)
                );
                cloud.scale.set(
                    Utils.random(0.8, 1.5),
                    Utils.random(0.6, 1),
                    Utils.random(0.8, 1.5)
                );
                cloudGroup.add(cloud);
            }
            
            cloudGroup.position.set(
                Utils.random(-2000, 2000),
                Utils.random(1500, 2500),
                Utils.random(-2000, 2000)
            );
            cloudGroup.userData.speed = Utils.random(0.5, 2);
            cloudGroup.userData.baseOpacity = Utils.random(0.3, 0.8);
            
            this.clouds.push(cloudGroup);
            this.scene.add(cloudGroup);
        }
    }

    createParticleSystem() {
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Utils.random(-2000, 2000);
            positions[i * 3 + 1] = Utils.random(0, 3000);
            positions[i * 3 + 2] = Utils.random(-2000, 2000);
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = Utils.random(-5, -1);
            velocities[i * 3 + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 2,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setWeather(type) {
        this.currentWeather = type;
        const scene = this.scene;

        switch (type) {
            case 'clear':
                this.wind.set(0, 0, 0);
                scene.fog.density = 0.0002;
                this.particles.material.opacity = 0;
                this.setCloudOpacity(0.3);
                break;
            case 'cloudy':
                this.wind.set(Utils.random(-1, 1), 0, Utils.random(-1, 1));
                scene.fog.density = 0.0005;
                this.particles.material.opacity = 0;
                this.setCloudOpacity(0.7);
                break;
            case 'rain':
                this.wind.set(Utils.random(-2, 2), 0, Utils.random(-2, 2));
                scene.fog.density = 0.001;
                this.particles.material.opacity = 0.6;
                this.particles.material.color.setHex(0x88ccff);
                this.particles.material.size = 2;
                this.setCloudOpacity(0.9);
                break;
            case 'storm':
                this.wind.set(Utils.random(-5, 5), 0, Utils.random(-5, 5));
                scene.fog.density = 0.002;
                this.particles.material.opacity = 0.8;
                this.particles.material.color.setHex(0x4488aa);
                this.particles.material.size = 3;
                this.setCloudOpacity(1);
                this.createStormZones();
                break;
        }
    }

    setCloudOpacity(opacity) {
        this.clouds.forEach(cloud => {
            cloud.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.opacity = cloud.userData.baseOpacity * opacity;
                }
            });
        });
    }

    createStormZones() {
        this.stormZones.forEach(zone => this.scene.remove(zone));
        this.stormZones = [];

        for (let i = 0; i < 3; i++) {
            const zoneGeometry = new THREE.CylinderGeometry(100, 150, 2000, 16, 1, true);
            const zoneMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zone.position.set(
                Utils.random(-1500, 1500),
                1000,
                Utils.random(-1500, 1500)
            );
            zone.userData.isStorm = true;
            zone.userData.radius = 150;
            this.stormZones.push(zone);
            this.scene.add(zone);
        }
    }

    update(deltaTime, player) {
        const timeScale = deltaTime * 60;

        this.clouds.forEach(cloud => {
            cloud.position.x += this.wind.x * cloud.userData.speed * timeScale;
            cloud.position.z += this.wind.z * cloud.userData.speed * timeScale;

            if (cloud.position.x > 2500) cloud.position.x = -2500;
            if (cloud.position.x < -2500) cloud.position.x = 2500;
            if (cloud.position.z > 2500) cloud.position.z = -2500;
            if (cloud.position.z < -2500) cloud.position.z = 2500;
        });

        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            const positions = this.particles.geometry.attributes.position.array;
            const velocities = this.particles.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += (velocities[i * 3] + this.wind.x * 2) * timeScale;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * timeScale * 3;
                positions[i * 3 + 2] += (velocities[i * 3 + 2] + this.wind.z * 2) * timeScale;

                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3] = Utils.random(-2000, 2000);
                    positions[i * 3 + 1] = 3000;
                    positions[i * 3 + 2] = Utils.random(-2000, 2000);
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        if (player) {
            const windForce = this.wind.clone().multiplyScalar(0.1);
            
            this.stormZones.forEach(zone => {
                const dist = player.position.distanceTo(zone.position);
                if (dist < zone.userData.radius) {
                    const danger = (zone.userData.radius - dist) / zone.userData.radius;
                    windForce.multiplyScalar(1 + danger * 2);
                }
            });

            return windForce;
        }

        return new THREE.Vector3();
    }

    getWind() { return this.wind.clone(); }
    getWeather() { return this.currentWeather; }

    checkStormCollision(player) {
        for (const zone of this.stormZones) {
            const dist = player.position.distanceTo(zone.position);
            if (dist < zone.userData.radius * 0.5) {
                return true;
            }
        }
        return false;
    }
}
