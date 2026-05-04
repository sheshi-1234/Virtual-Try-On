// app.js
// Main Application Entry Point

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('inputVideo');
    const canvasElement = document.getElementById('outputCanvas');
    
    // Resize canvas to match video stream
    videoElement.addEventListener('loadeddata', () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
    });

    const makeupDrawer = new MakeupDrawer(canvasElement, videoElement);

    
    // UI Setup
    setupUIControls(makeupDrawer);

    // Initialize Face Tracker
    const faceTracker = new FaceTracker(videoElement, canvasElement, (results) => {
        if (results.multiFaceLandmarks) {
            makeupDrawer.updateLandmarks(results.multiFaceLandmarks);
        } else {
            makeupDrawer.clear();
        }
    });

    // Start drawing loop
    const renderLoop = () => {
        makeupDrawer.draw();
        requestAnimationFrame(renderLoop);
    };
    renderLoop();

    faceTracker.init();

    // Listen for skin tone detection
    window.addEventListener('skinToneDetected', (e) => {
        const { hex, label } = e.detail;
        document.getElementById('skinToneSwatch').style.backgroundColor = hex;
        document.getElementById('skinToneLabel').textContent = `Skin Tone: ${label}`;
    });

    // Action buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
        const compCanvas = document.createElement('canvas');
        compCanvas.width = canvasElement.width;
        compCanvas.height = canvasElement.height;
        const ctx = compCanvas.getContext('2d');
        
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-compCanvas.width, 0);
        ctx.drawImage(videoElement, 0, 0, compCanvas.width, compCanvas.height);
        ctx.restore();
        
        ctx.drawImage(canvasElement, 0, 0);
        
        const link = document.createElement('a');
        link.download = 'glamai-tryon.png';
        link.href = compCanvas.toDataURL('image/png');
        link.click();
    });
});

function setupUIControls(makeupDrawer) {
    // Toggles
    const toggles = ['lipstick', 'blush', 'eyebrow', 'hats', 'glasses', 'earrings'];
    toggles.forEach(type => {
        const toggleEl = document.getElementById(`${type}Toggle`);
        if (toggleEl) {
            toggleEl.addEventListener('change', (e) => {
                makeupDrawer.state[type].enabled = e.target.checked;
            });
            // Initial sync
            if(makeupDrawer.state[type]) makeupDrawer.state[type].enabled = toggleEl.checked;
        }
    });

    // Opacity Sliders
    const sliders = ['lipstick', 'blush', 'eyebrow'];
    sliders.forEach(type => {
        const sliderEl = document.getElementById(`${type}Opacity`);
        if (sliderEl) {
            sliderEl.addEventListener('input', (e) => {
                makeupDrawer.state[type].opacity = parseFloat(e.target.value);
            });
        }
    });
    
    // Before/After Slider
    document.getElementById('beforeAfterSlider').addEventListener('input', (e) => {
        makeupDrawer.beforeAfterRatio = parseInt(e.target.value) / 100;
    });

    // Color Buttons Setup
    const setupColorButtons = (containerId, type) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const buttons = container.querySelectorAll('.color-btn');
        const customPicker = container.querySelector('.color-picker');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const color = btn.dataset.color;
                makeupDrawer.state[type].color = color;
                if(customPicker) customPicker.value = color;
            });
        });

        if (customPicker) {
            customPicker.addEventListener('input', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                makeupDrawer.state[type].color = e.target.value;
            });
        }
    };

    setupColorButtons('lipstickColors', 'lipstick');
    setupColorButtons('blushColors', 'blush');
    setupColorButtons('eyebrowColors', 'eyebrow');

    // Style Buttons Setup
    const setupStyleButtons = (containerId, type) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const buttons = container.querySelectorAll('.style-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                makeupDrawer.state[type].style = btn.dataset.style;
                document.getElementById(`${type}Toggle`).checked = true;
                makeupDrawer.state[type].enabled = true;
            });
        });
    };

    setupStyleButtons('hatsOptions', 'hats');
    setupStyleButtons('glassesOptions', 'glasses');
    setupStyleButtons('earringsOptions', 'earrings');

    window.addEventListener('updateMakeupColor', (e) => {
        const { type, color } = e.detail;
        if (makeupDrawer.state[type]) {
            makeupDrawer.state[type].color = color;
            makeupDrawer.state[type].enabled = true;
            document.getElementById(`${type}Toggle`).checked = true;
            const customInput = document.getElementById(`${type}Custom`);
            if(customInput) customInput.value = color;
        }
    });
}
