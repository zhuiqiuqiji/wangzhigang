class ParticleSystem {
    constructor() {
        this.particles = [];
        this.container = null;
        this.animationId = null;
    }

    init(container) {
        this.container = container;
        this.startLoop();
    }

    spawnFlowParticles(element, liquidType) {
        if (!this.container || !element) return;
        
        const rect = element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const config = LIQUID_CONFIG[liquidType] || LIQUID_CONFIG[LIQUID_TYPES.WATER];
        const particleCount = 3;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'absolute';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = config.particleColor;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '100';
            
            const startX = rect.left - containerRect.left + Math.random() * rect.width;
            const startY = rect.top - containerRect.top + rect.height / 2;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            this.container.appendChild(particle);
            
            const velocity = {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 1
            };
            
            this.particles.push({
                element: particle,
                x: startX,
                y: startY,
                vx: velocity.x,
                vy: velocity.y,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    spawnConnectionParticles(row, col, liquidType) {
        const cells = document.querySelectorAll('.pipe-cell');
        cells.forEach(cell => {
            if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
                this.spawnFlowParticles(cell, liquidType);
            }
        });
    }

    spawnVictoryParticles() {
        if (!this.container) return;
        
        const configs = [LIQUID_CONFIG[LIQUID_TYPES.WATER], LIQUID_CONFIG[LIQUID_TYPES.STEAM]];
        const containerRect = this.container.getBoundingClientRect();
        
        for (let i = 0; i < 30; i++) {
            const config = configs[Math.floor(Math.random() * configs.length)];
            const particle = document.createElement('div');
            particle.className = 'particle victory';
            particle.style.position = 'fixed';
            particle.style.width = (4 + Math.random() * 8) + 'px';
            particle.style.height = particle.style.width;
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = config.particleColor;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '2000';
            
            const startX = containerRect.left + containerRect.width / 2 + (Math.random() - 0.5) * 200;
            const startY = containerRect.top + containerRect.height / 2;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            
            this.particles.push({
                element: particle,
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 5,
                gravity: 0.15,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.01,
                useFixedPosition: true
            });
        }
    }

    startLoop() {
        const update = () => {
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.gravity) {
                    p.vy += p.gravity;
                }
                
                p.life -= p.decay;
                
                if (p.life <= 0) {
                    p.element.remove();
                    return false;
                }
                
                p.element.style.left = p.x + 'px';
                p.element.style.top = p.y + 'px';
                p.element.style.opacity = p.life;
                p.element.style.transform = `scale(${p.life})`;
                
                return true;
            });
            
            this.animationId = requestAnimationFrame(update);
        };
        
        update();
    }

    clearAll() {
        this.particles.forEach(p => p.element.remove());
        this.particles = [];
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.clearAll();
    }
}

window.particleSystem = new ParticleSystem();