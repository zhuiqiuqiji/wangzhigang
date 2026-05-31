class PendulumControls {
    constructor(physics) {
        this.physics = physics;
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.massSlider = document.getElementById('massSlider');
        this.massValue = document.getElementById('massValue');
        this.dampingSlider = document.getElementById('dampingSlider');
        this.dampingValue = document.getElementById('dampingValue');
        this.resetBtn = document.getElementById('resetBtn');

        this.dataElements = {
            angle: document.getElementById('dataAngle'),
            angularVelocity: document.getElementById('dataAngularVelocity'),
            linearVelocity: document.getElementById('dataLinearVelocity'),
            acceleration: document.getElementById('dataAcceleration'),
            kineticEnergy: document.getElementById('dataKineticEnergy'),
            potentialEnergy: document.getElementById('dataPotentialEnergy'),
            totalEnergy: document.getElementById('dataTotalEnergy'),
            theoreticalPeriod: document.getElementById('dataTheoreticalPeriod'),
            measuredPeriod: document.getElementById('dataMeasuredPeriod'),
            time: document.getElementById('dataTime'),
            ekBar: document.getElementById('ekBar'),
            epBar: document.getElementById('epBar'),
            etBar: document.getElementById('etBar'),
        };

        this.initSliders();
        this.resetBtn.addEventListener('click', () => {
            this.physics.reset(0);
        });
    }

    initSliders() {
        this.lengthSlider.addEventListener('input', () => {
            const val = parseFloat(this.lengthSlider.value);
            this.physics.length = val;
            this.lengthValue.textContent = val.toFixed(1) + ' m';
            this.physics.reset(this.physics.theta);
        });

        this.massSlider.addEventListener('input', () => {
            const val = parseFloat(this.massSlider.value);
            this.physics.mass = val;
            this.massValue.textContent = val.toFixed(1) + ' kg';
        });

        this.dampingSlider.addEventListener('input', () => {
            const val = parseFloat(this.dampingSlider.value);
            this.physics.damping = val;
            this.dampingValue.textContent = val.toFixed(2);
        });
    }

    updateData() {
        const state = this.physics.getState();
        const maxEnergy = this.physics.mass * this.physics.g * this.physics.length || 1;
        if (!this.physics.isRunning && this.physics.trail.length > 0) {
            this.physics.ageTrail();
        }

        this.dataElements.angle.textContent = state.angle.toFixed(2) + '°';
        this.dataElements.angularVelocity.textContent = state.angularVelocity.toFixed(3) + ' rad/s';
        this.dataElements.linearVelocity.textContent = state.linearVelocity.toFixed(3) + ' m/s';
        this.dataElements.acceleration.textContent = state.angularAcceleration.toFixed(3) + ' rad/s²';
        this.dataElements.kineticEnergy.textContent = state.kineticEnergy.toFixed(4) + ' J';
        this.dataElements.potentialEnergy.textContent = state.potentialEnergy.toFixed(4) + ' J';
        this.dataElements.totalEnergy.textContent = state.totalEnergy.toFixed(4) + ' J';
        this.dataElements.theoreticalPeriod.textContent = state.theoreticalPeriod.toFixed(3) + ' s';
        this.dataElements.measuredPeriod.textContent = state.measuredPeriod > 0 ? state.measuredPeriod.toFixed(3) + ' s' : '—';
        this.dataElements.time.textContent = state.time.toFixed(2) + ' s';

        const ekPct = Math.min(100, (state.kineticEnergy / maxEnergy) * 100);
        const epPct = Math.min(100, (state.potentialEnergy / maxEnergy) * 100);
        const etPct = Math.min(100, (state.totalEnergy / maxEnergy) * 100);
        this.dataElements.ekBar.style.width = ekPct + '%';
        this.dataElements.epBar.style.width = epPct + '%';
        this.dataElements.etBar.style.width = etPct + '%';
    }
}

window.PendulumControls = PendulumControls;
