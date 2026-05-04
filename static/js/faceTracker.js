// faceTracker.js
// Handles MediaPipe Face Mesh and Skin Tone extraction

class FaceTracker {
    constructor(videoElement, canvasElement, onResultsCallback) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.onResultsCallback = onResultsCallback;
        this.faceMesh = null;
        this.camera = null;
        
        // Skin tone detection
        this.skinToneDetected = false;
        this.skinToneHex = '#d2b48c';
        this.skinToneLabel = 'Medium';
        this.frameCount = 0;
        this.samples = [];
    }

    async init() {
        this.faceMesh = new FaceMesh({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }});
        
        this.faceMesh.setOptions({
            maxNumFaces: 4,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        this.faceMesh.onResults((results) => {
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                if (!this.skinToneDetected) {
                    this.detectSkinTone(results.multiFaceLandmarks[0]);
                }
            }
            this.onResultsCallback(results);
        });

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.faceMesh.send({image: this.videoElement});
            },
            width: 1920,
            height: 1080
        });

        await this.camera.start();
        document.getElementById('loading').style.display = 'none';
    }

    detectSkinTone(landmarks) {
        this.frameCount++;
        // Wait 15 frames for camera to auto-expose properly before sampling
        if (this.frameCount < 15) return;
        
        // We will take 10 samples (frames 15 to 25) to average
        if (this.frameCount > 25) {
            if (!this.skinToneDetected && this.samples.length > 0) {
                // Average the samples
                let sumR = 0, sumG = 0, sumB = 0;
                this.samples.forEach(s => { sumR += s.r; sumG += s.g; sumB += s.b; });
                const r = Math.round(sumR / this.samples.length);
                const g = Math.round(sumG / this.samples.length);
                const b = Math.round(sumB / this.samples.length);
                
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                this.skinToneHex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
                
                if (brightness > 175) this.skinToneLabel = "Light";
                else if (brightness > 115) this.skinToneLabel = "Medium";
                else this.skinToneLabel = "Dark";
                
                this.skinToneDetected = true;
                
                window.dispatchEvent(new CustomEvent('skinToneDetected', {
                    detail: { hex: this.skinToneHex, label: this.skinToneLabel }
                }));
            }
            return;
        }

        // Use a cheek landmark to sample skin color (landmark 205 left cheek)
        const cheekLandmark = landmarks[205];
        
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.videoElement.videoWidth;
        offCanvas.height = this.videoElement.videoHeight;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, offCanvas.width, offCanvas.height);
        
        const x = Math.floor(cheekLandmark.x * offCanvas.width);
        const y = Math.floor(cheekLandmark.y * offCanvas.height);
        
        if(x > 0 && x < offCanvas.width && y > 0 && y < offCanvas.height) {
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            // Ignore if transparency is 0 (failed to read) or completely black
            if (pixelData[3] > 0 && (pixelData[0] !== 0 || pixelData[1] !== 0 || pixelData[2] !== 0)) {
                this.samples.push({ r: pixelData[0], g: pixelData[1], b: pixelData[2] });
            }
        }
    }
}

window.FaceTracker = FaceTracker;
