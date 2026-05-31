(function () {
    const canvas = document.getElementById('pendulumCanvas');
    const physics = new PendulumPhysics();
    const renderer = new PendulumRenderer(canvas);
    let bobInfo = null;

    const getScale = () => {
        const availableHeight = renderer.height * 0.7;
        return availableHeight / 3.0;
    };

    const getBobInfo = () => bobInfo;

    const interaction = new PendulumInteraction(canvas, physics, getScale, getBobInfo);
    const controls = new PendulumControls(physics);

    interaction.onDragStart = () => {};
    interaction.onDragEnd = () => {};
    interaction.onDragging = () => {};

    function animate() {
        physics.step();
        bobInfo = renderer.render(physics, getScale(), interaction.getIsDragging());
        controls.updateData();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        renderer.resize();
    });

    animate();
})();
