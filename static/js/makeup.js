// makeup.js
// Handles hyper-realistic rendering of accessories, makeup, and hats.

class MakeupDrawer {
    constructor(canvas, video) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.video = video;
        
        // State for UI toggles
        this.state = {
            lipstick: { enabled: true, color: '#c71585', opacity: 0.7 },
            blush: { enabled: true, color: '#ffb6c1', opacity: 0.5 },
            eyebrow: { enabled: false, color: '#3b2f2f', opacity: 0.7 },
            hats: { enabled: false, style: 'm_fedora' },
            glasses: { enabled: false, style: 'aviator' },
            earrings: { enabled: false, style: 'jhumka' }
        };
        
        this.beforeAfterRatio = 1.0;
        this.landmarks = null;

        // Generate Photorealistic Textures for Hats
        this.patterns = {
            felt: this.createFeltPattern(),
            straw: this.createStrawPattern(),
            knit: this.createKnitPattern()
        };
    }

    createFeltPattern() {
        const c = document.createElement('canvas');
        c.width = 100; c.height = 100;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(100, 100);
        for(let i = 0; i < imgData.data.length; i += 4) {
            let val = Math.random() * 25 + 15; // Dark soft fuzzy noise
            imgData.data[i] = val;
            imgData.data[i+1] = val;
            imgData.data[i+2] = val;
            imgData.data[i+3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        return this.ctx.createPattern(c, 'repeat');
    }

    createStrawPattern() {
        const c = document.createElement('canvas');
        c.width = 40; c.height = 20;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#C29B62'; // Base straw color
        ctx.fillRect(0, 0, 40, 20);
        ctx.lineWidth = 2;
        // Draw interwoven straw braids
        for(let x=0; x<40; x+=8) {
            for(let y=0; y<20; y+=8) {
                ctx.strokeStyle = `rgba(100, 50, 10, ${Math.random()*0.3 + 0.1})`; // Shadow
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.quadraticCurveTo(x+4, y-2, x+8, y);
                ctx.stroke();
                ctx.strokeStyle = `rgba(230, 200, 150, ${Math.random()*0.5 + 0.3})`; // Highlight
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.quadraticCurveTo(x+4, y+4, x+8, y);
                ctx.stroke();
            }
        }
        return this.ctx.createPattern(c, 'repeat');
    }

    createKnitPattern() {
        const c = document.createElement('canvas');
        c.width = 20; c.height = 20;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#8b0000'; // Dark red base
        ctx.fillRect(0, 0, 20, 20);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        // Chevron stitch pattern for realistic yarn
        for(let x=0; x<20; x+=10) {
            for(let y=0; y<20; y+=5) {
                ctx.strokeStyle = '#500000'; // Deep yarn shadow
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+5, y+5); ctx.lineTo(x+10, y); ctx.stroke();
                ctx.strokeStyle = '#c03030'; // Yarn highlight
                ctx.beginPath(); ctx.moveTo(x, y+1); ctx.lineTo(x+5, y+6); ctx.lineTo(x+10, y+1); ctx.stroke();
            }
        }
        return this.ctx.createPattern(c, 'repeat');
    }

    hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    updateLandmarks(faces) {
        this.faces = faces; // Array of faces
    }
    
    clear() {
        this.faces = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        if (!this.faces || this.faces.length === 0) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.beforeAfterRatio <= 0) return;

        this.ctx.globalAlpha = this.beforeAfterRatio;

        // Draw each face
        this.faces.forEach(lm => {
            if (this.state.hats.enabled) this.drawHats(lm, true);
            if (this.state.eyebrow.enabled) this.drawEyebrow(lm);
            if (this.state.blush.enabled) this.drawBlush(lm);
            if (this.state.lipstick.enabled) this.drawLipstick(lm);
            if (this.state.earrings.enabled) this.drawEarrings(lm);
            if (this.state.glasses.enabled) this.drawGlasses(lm);
            if (this.state.hats.enabled) this.drawHats(lm, false);
        });

        this.ctx.globalAlpha = 1.0;
    }

    drawLipstick(landmarks) {
        const upperLipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
        const upperLipInner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
        const lowerLipOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
        const lowerLipInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];

        this.ctx.fillStyle = this.hexToRgba(this.state.lipstick.color, this.state.lipstick.opacity);
        this.ctx.globalCompositeOperation = 'soft-light';
        this.ctx.filter = 'blur(4px)';

        const drawSmoothCurve = (pointsOuter, pointsInner) => {
            this.ctx.beginPath();
            this.moveToPoint(landmarks[pointsOuter[0]]);
            for (let i = 1; i < pointsOuter.length; i++) {
                let prev = landmarks[pointsOuter[i-1]];
                let curr = landmarks[pointsOuter[i]];
                let midX = (prev.x + curr.x) / 2;
                let midY = (prev.y + curr.y) / 2;
                this.ctx.quadraticCurveTo(prev.x * this.canvas.width, prev.y * this.canvas.height, midX * this.canvas.width, midY * this.canvas.height);
                this.ctx.lineTo(curr.x * this.canvas.width, curr.y * this.canvas.height);
            }
            
            for (let i = pointsInner.length - 1; i >= 0; i--) {
                let curr = landmarks[pointsInner[i]];
                this.ctx.lineTo(curr.x * this.canvas.width, curr.y * this.canvas.height);
            }
            this.ctx.closePath();
            this.ctx.fill();
        };

        drawSmoothCurve(upperLipOuter, upperLipInner);
        drawSmoothCurve(lowerLipOuter, lowerLipInner);

        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = this.hexToRgba(this.state.lipstick.color, this.state.lipstick.opacity * 0.5);
        this.ctx.filter = 'blur(2px)';
        drawSmoothCurve(upperLipOuter, upperLipInner);
        drawSmoothCurve(lowerLipOuter, lowerLipInner);

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.filter = 'none';
    }

    drawBlush(landmarks) {
        const leftCheek = landmarks[205];
        const rightCheek = landmarks[425];
        if (!leftCheek || !rightCheek) return;

        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const faceWidth = Math.abs((rightEye.x - leftEye.x) * this.canvas.width);
        const radius = faceWidth * 0.45;

        this.ctx.globalCompositeOperation = 'multiply';

        const drawCheek = (cheek) => {
            let cx = cheek.x * this.canvas.width;
            let cy = cheek.y * this.canvas.height;
            let grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, this.hexToRgba(this.state.blush.color, this.state.blush.opacity));
            grad.addColorStop(0.5, this.hexToRgba(this.state.blush.color, this.state.blush.opacity * 0.5));
            grad.addColorStop(1, this.hexToRgba(this.state.blush.color, 0));
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            this.ctx.fill();
        };

        drawCheek(leftCheek);
        drawCheek(rightCheek);

        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawEyebrow(landmarks) {
        const leftEyebrowUpper = [46, 53, 52, 65, 55];
        const leftEyebrowLower = [156, 70, 63, 105, 66, 107];
        const rightEyebrowUpper = [276, 283, 282, 295, 285];
        const rightEyebrowLower = [383, 300, 293, 334, 296, 336];

        this.ctx.fillStyle = this.hexToRgba(this.state.eyebrow.color, this.state.eyebrow.opacity);
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.filter = 'blur(2.5px)';

        const drawBrow = (upper, lower) => {
            this.ctx.beginPath();
            this.moveToPoint(landmarks[upper[0]]);
            for (let i = 1; i < upper.length; i++) this.lineToPoint(landmarks[upper[i]]);
            for (let i = lower.length - 1; i >= 0; i--) this.lineToPoint(landmarks[lower[i]]);
            this.ctx.closePath();
            this.ctx.fill();
        };

        drawBrow(leftEyebrowUpper, leftEyebrowLower);
        drawBrow(rightEyebrowUpper, rightEyebrowLower);

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.filter = 'none';
    }

    drawGlasses(landmarks) {
        const leftEye = landmarks[33]; 
        const rightEye = landmarks[263];
        const noseBridge = landmarks[168];

        if(!leftEye || !rightEye || !noseBridge) return;

        const dx = (rightEye.x - leftEye.x) * this.canvas.width;
        const dy = (rightEye.y - leftEye.y) * this.canvas.height;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        const width = distance * 1.8;
        const cx = noseBridge.x * this.canvas.width;
        const cy = noseBridge.y * this.canvas.height;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        const drawLensGlare = (lensPathFn, isRightLens) => {
            this.ctx.save();
            lensPathFn();
            this.ctx.clip();
            const grad = this.ctx.createLinearGradient(-width*0.2, -width*0.2, width*0.2, width*0.2);
            grad.addColorStop(0, 'rgba(255,255,255,0.4)');
            grad.addColorStop(0.3, 'rgba(255,255,255,0.0)');
            grad.addColorStop(1, 'rgba(255,255,255,0.1)');
            this.ctx.fillStyle = grad;
            this.ctx.fill();
            this.ctx.restore();
        };

        const style = this.state.glasses.style;

        if (style === 'aviator') {
            const h = width * 0.35;
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = width * 0.015;
            
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.4, -h * 0.2);
                this.ctx.quadraticCurveTo(s * width * 0.1, -h * 0.6, s * width * 0.05, 0);
                this.ctx.quadraticCurveTo(s * width * 0.1, h * 1.1, s * width * 0.35, h * 0.8);
                this.ctx.quadraticCurveTo(s * width * 0.55, h * 0.4, s * width * 0.4, -h * 0.2);
            };

            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 10;
            
            drawLens('left');
            this.ctx.fillStyle = 'rgba(20,50,30,0.7)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.stroke();
            drawLensGlare(() => drawLens('left'));

            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 10;
            drawLens('right');
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.stroke();
            drawLensGlare(() => drawLens('right'));

            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.15, -h*0.2);
            this.ctx.quadraticCurveTo(0, -h*0.35, width*0.15, -h*0.2);
            this.ctx.moveTo(-width*0.1, 0);
            this.ctx.quadraticCurveTo(0, -h*0.15, width*0.1, 0);
            this.ctx.stroke();
        } else if (style === 'clubmaster') {
            const h = width * 0.3;
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.45, -h * 0.2);
                this.ctx.lineTo(s * width * 0.1, -h * 0.2);
                this.ctx.quadraticCurveTo(s * width * 0.05, -h * 0.2, s * width * 0.05, h * 0.2);
                this.ctx.quadraticCurveTo(s * width * 0.1, h * 1.2, s * width * 0.4, h * 0.7);
                this.ctx.lineTo(s * width * 0.45, -h * 0.2);
            };
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = width * 0.01;
            drawLens('left');
            this.ctx.fillStyle = 'rgba(10,10,10,0.85)';
            this.ctx.fill(); this.ctx.stroke();
            drawLens('right');
            this.ctx.fill(); this.ctx.stroke();

            this.ctx.fillStyle = '#111';
            this.ctx.strokeStyle = '#111';
            this.ctx.lineWidth = width * 0.03;
            
            const drawTopRim = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.1, -h * 0.2);
                this.ctx.quadraticCurveTo(s * width * 0.25, -h * 0.4, s * width * 0.48, -h * 0.2);
                this.ctx.lineTo(s * width * 0.45, 0);
                this.ctx.quadraticCurveTo(s * width * 0.25, -h * 0.2, s * width * 0.1, 0);
                this.ctx.fill();
                this.ctx.stroke();
            };
            drawTopRim('left');
            drawTopRim('right');

            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = width * 0.015;
            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.1, -h*0.1);
            this.ctx.quadraticCurveTo(0, -h*0.3, width*0.1, -h*0.1);
            this.ctx.stroke();
        } else if (style === 'rimless') {
            const h = width * 0.2;
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.45, -h * 0.5);
                this.ctx.lineTo(s * width * 0.15, -h * 0.5);
                this.ctx.lineTo(s * width * 0.1, h * 0.5);
                this.ctx.lineTo(s * width * 0.4, h * 0.5);
                this.ctx.closePath();
            };
            this.ctx.fillStyle = 'rgba(150,200,255,0.2)';
            this.ctx.shadowColor = 'rgba(255,255,255,0.5)';
            this.ctx.shadowBlur = 5;

            drawLens('left'); this.ctx.fill(); drawLensGlare(() => drawLens('left'));
            drawLens('right'); this.ctx.fill(); drawLensGlare(() => drawLens('right'));
            
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = width * 0.015;
            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.15, -h*0.2);
            this.ctx.lineTo(width*0.15, -h*0.2);
            this.ctx.stroke();
        } else if (style === 'round_oversized') {
            const r = width * 0.22;
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.arc(s * width * 0.25, 0, r, 0, Math.PI*2);
            };
            this.ctx.strokeStyle = '#b76e79';
            this.ctx.lineWidth = width * 0.01;
            const lGrad = this.ctx.createLinearGradient(0, -r, 0, r);
            lGrad.addColorStop(0, 'rgba(150,50,50,0.6)');
            lGrad.addColorStop(1, 'rgba(250,200,100,0.2)');
            this.ctx.fillStyle = lGrad;

            drawLens('left'); this.ctx.fill(); this.ctx.stroke(); drawLensGlare(() => drawLens('left'));
            drawLens('right'); this.ctx.fill(); this.ctx.stroke(); drawLensGlare(() => drawLens('right'));

            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.1, -r*0.2);
            this.ctx.quadraticCurveTo(0, -r*0.6, width*0.1, -r*0.2);
            this.ctx.stroke();
        } else if (style === 'wayfarer') {
            const h = width * 0.3;
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.48, -h);
                this.ctx.lineTo(s * width * 0.1, -h);
                this.ctx.quadraticCurveTo(s * width * 0.05, -h, s * width * 0.05, -h * 0.5);
                this.ctx.lineTo(s * width * 0.1, h);
                this.ctx.quadraticCurveTo(s * width * 0.2, h * 1.2, s * width * 0.4, h * 0.8);
                this.ctx.lineTo(s * width * 0.48, -h);
                this.ctx.closePath();
            };
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = 'rgba(20,20,20,0.9)';
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = width * 0.04;

            drawLens('left'); this.ctx.fill(); this.ctx.stroke();
            this.ctx.shadowBlur = 0; drawLensGlare(() => drawLens('left'));

            this.ctx.shadowBlur = 8;
            drawLens('right'); this.ctx.fill(); this.ctx.stroke();
            this.ctx.shadowBlur = 0; drawLensGlare(() => drawLens('right'));

            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.1, -h*0.5);
            this.ctx.quadraticCurveTo(0, -h, width*0.1, -h*0.5);
            this.ctx.stroke();
        } else if (style === 'hexagon') {
            const h = width * 0.2;
            const drawLens = (side) => {
                const s = side === 'left' ? -1 : 1;
                this.ctx.beginPath();
                this.ctx.moveTo(s * width * 0.25, -h);
                this.ctx.lineTo(s * width * 0.45, -h*0.2);
                this.ctx.lineTo(s * width * 0.35, h);
                this.ctx.lineTo(s * width * 0.15, h);
                this.ctx.lineTo(s * width * 0.05, -h*0.2);
                this.ctx.closePath();
            };
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = width * 0.01;
            this.ctx.fillStyle = 'rgba(50,20,50,0.7)';

            drawLens('left'); this.ctx.fill(); this.ctx.stroke(); drawLensGlare(() => drawLens('left'));
            drawLens('right'); this.ctx.fill(); this.ctx.stroke(); drawLensGlare(() => drawLens('right'));

            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.15, -h*0.5);
            this.ctx.lineTo(width*0.15, -h*0.5);
            this.ctx.stroke();
        } else if (style === 'sport') {
            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.5, -width*0.1);
            this.ctx.quadraticCurveTo(0, -width*0.2, width*0.5, -width*0.1);
            this.ctx.quadraticCurveTo(width*0.6, width*0.1, width*0.3, width*0.2);
            this.ctx.quadraticCurveTo(0, width*0.05, -width*0.3, width*0.2);
            this.ctx.quadraticCurveTo(-width*0.6, width*0.1, -width*0.5, -width*0.1);
            const grad = this.ctx.createLinearGradient(-width*0.5, 0, width*0.5, 0);
            grad.addColorStop(0, '#ff00cc');
            grad.addColorStop(0.5, '#3333ff');
            grad.addColorStop(1, '#00ffcc');
            this.ctx.fillStyle = grad;
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(-width*0.4, -width*0.05);
            this.ctx.quadraticCurveTo(0, -width*0.1, width*0.4, -width*0.05);
            this.ctx.quadraticCurveTo(width*0.2, 0, 0, 0);
            this.ctx.quadraticCurveTo(-width*0.2, 0, -width*0.4, -width*0.05);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawEarrings(landmarks) {
        const leftLobe = landmarks[177];
        const rightLobe = landmarks[401];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const faceWidth = Math.abs((rightEye.x - leftEye.x) * this.canvas.width);
        const scale = faceWidth * 0.22;

        const drawEarring = (lobe, isLeft) => {
            if (!lobe) return;
            const x = lobe.x * this.canvas.width;
            const y = lobe.y * this.canvas.height;
            this.ctx.save();
            this.ctx.translate(x, y);
            const shiftX = isLeft ? -scale*0.05 : scale*0.05;
            const style = this.state.earrings.style;

            const drawJewel = (jx, jy, r, color1, color2) => {
                const grad = this.ctx.createRadialGradient(jx-r*0.2, jy-r*0.2, 0, jx, jy, r);
                grad.addColorStop(0, color1);
                grad.addColorStop(1, color2);
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(jx, jy, r, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#DAA520';
                this.ctx.lineWidth = r*0.2;
                this.ctx.stroke();
            };

            this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
            this.ctx.shadowBlur = 8;

            if (style === 'jhumka') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#B8860B';
                this.ctx.lineWidth = scale * 0.02;
                drawJewel(shiftX, scale*0.1, scale*0.1, '#fff', '#ccc');
                const grad = this.ctx.createLinearGradient(shiftX-scale*0.3, 0, shiftX+scale*0.3, 0);
                grad.addColorStop(0, '#B8860B');
                grad.addColorStop(0.5, '#FFDF00');
                grad.addColorStop(1, '#DAA520');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.moveTo(shiftX - scale*0.35, scale*0.6);
                this.ctx.quadraticCurveTo(shiftX, scale*0.2, shiftX + scale*0.35, scale*0.6);
                this.ctx.lineTo(shiftX - scale*0.35, scale*0.6);
                this.ctx.fill();
                this.ctx.stroke();
                for(let i = -0.3; i <= 0.3; i += 0.1) {
                    drawJewel(shiftX + scale*i, scale*0.65, scale*0.04, '#fff', '#e0e0e0');
                }
            } else if (style === 'chandbali') {
                this.ctx.lineWidth = scale * 0.03;
                drawJewel(shiftX, scale*0.1, scale*0.08, '#fff', '#eee');
                this.ctx.fillStyle = '#f5f5dc';
                this.ctx.strokeStyle = '#D4AF37';
                this.ctx.beginPath();
                this.ctx.arc(shiftX, scale*0.5, scale*0.35, 0, Math.PI, false);
                this.ctx.arc(shiftX, scale*0.4, scale*0.2, Math.PI, 0, true);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                drawJewel(shiftX, scale*0.5, scale*0.08, '#ff6b6b', '#8b0000');
                for(let angle = 0; angle <= Math.PI; angle += Math.PI/5) {
                    let px = shiftX + Math.cos(angle) * scale * 0.4;
                    let py = scale*0.5 + Math.sin(angle) * scale * 0.4;
                    drawJewel(px, py, scale*0.04, '#fff', '#ddd');
                }
            } else if (style === 'meenakari') {
                const grad = this.ctx.createRadialGradient(shiftX, scale*0.4, 0, shiftX, scale*0.4, scale*0.4);
                grad.addColorStop(0, '#00ffff');
                grad.addColorStop(1, '#00008b');
                this.ctx.fillStyle = grad;
                this.ctx.strokeStyle = '#D4AF37';
                this.ctx.lineWidth = scale*0.04;
                this.ctx.beginPath();
                this.ctx.moveTo(shiftX, scale*0.1);
                this.ctx.quadraticCurveTo(shiftX + scale*0.3, scale*0.5, shiftX, scale*0.8);
                this.ctx.quadraticCurveTo(shiftX - scale*0.3, scale*0.5, shiftX, scale*0.1);
                this.ctx.fill();
                this.ctx.stroke();
                drawJewel(shiftX, scale*0.5, scale*0.06, '#FFDF00', '#DAA520');
            } else if (style === 'polki') {
                for(let angle = 0; angle < Math.PI*2; angle += Math.PI/3) {
                    let px = shiftX + Math.cos(angle) * scale * 0.2;
                    let py = scale*0.2 + Math.sin(angle) * scale * 0.2;
                    drawJewel(px, py, scale*0.1, '#fff', '#b0c4de');
                }
                drawJewel(shiftX, scale*0.2, scale*0.15, '#fff', '#e6e6fa');
            } else if (style === 'temple') {
                this.ctx.fillStyle = '#DAA520';
                this.ctx.strokeStyle = '#8B6508';
                this.ctx.lineWidth = scale * 0.02;
                this.ctx.beginPath();
                this.ctx.arc(shiftX, scale*0.15, scale*0.15, 0, Math.PI*2);
                this.ctx.fill(); this.ctx.stroke();
                this.ctx.fillRect(shiftX - scale*0.25, scale*0.35, scale*0.5, scale*0.2);
                this.ctx.strokeRect(shiftX - scale*0.25, scale*0.35, scale*0.5, scale*0.2);
                for(let i = -0.2; i <= 0.2; i += 0.1) {
                    this.ctx.beginPath();
                    this.ctx.arc(shiftX + scale*i, scale*0.65, scale*0.05, 0, Math.PI*2);
                    this.ctx.fill(); this.ctx.stroke();
                }
            } else if (style === 'devsena') {
                this.ctx.strokeStyle = '#D4AF37';
                this.ctx.lineWidth = scale * 0.02;
                for(let i = -0.3; i <= 0.3; i += 0.15) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(shiftX, scale*0.1);
                    this.ctx.quadraticCurveTo(shiftX + scale*i, scale*0.5, shiftX + scale*i, scale*0.8);
                    this.ctx.stroke();
                    drawJewel(shiftX + scale*i, scale*0.85, scale*0.04, '#fff', '#ddd');
                }
                drawJewel(shiftX, scale*0.1, scale*0.12, '#ff69b4', '#8b0000');
            } else if (style === 'peacock') {
                this.ctx.fillStyle = '#006400';
                this.ctx.strokeStyle = '#D4AF37';
                this.ctx.beginPath();
                this.ctx.arc(shiftX, scale*0.3, scale*0.2, 0, Math.PI);
                this.ctx.lineTo(shiftX, scale*0.6);
                this.ctx.fill(); this.ctx.stroke();
                for(let i = -0.2; i <= 0.2; i += 0.1) {
                    drawJewel(shiftX + scale*i, scale*0.7, scale*0.05, '#00008b', '#4169e1');
                }
            } else if (style === 'passa') {
                drawJewel(shiftX, scale*0.1, scale*0.08, '#D4AF37', '#B8860B');
                this.ctx.beginPath();
                this.ctx.moveTo(shiftX, scale*0.18);
                this.ctx.lineTo(shiftX - scale*0.3, scale*0.5);
                this.ctx.lineTo(shiftX + scale*0.3, scale*0.5);
                this.ctx.closePath();
                this.ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
                this.ctx.fill(); this.ctx.stroke();
                for(let y = 0.55; y <= 0.75; y += 0.08) {
                    for(let x = -0.3; x <= 0.3; x += 0.08) {
                        if (Math.abs(x) < (0.8 - y)) {
                            drawJewel(shiftX + scale*x, scale*y, scale*0.03, '#fff', '#f0f0f0');
                        }
                    }
                }
            }

            this.ctx.restore();
        };

        drawEarring(leftLobe, true);
        drawEarring(rightLobe, false);
    }

    drawHats(landmarks, isBackLayer) {
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const topHead = landmarks[10];
        const leftTemple = landmarks[162];
        const rightTemple = landmarks[389];

        if (!leftEye || !rightEye || !topHead || !leftTemple || !rightTemple) return;

        // Head angle
        const dx = (rightEye.x - leftEye.x) * this.canvas.width;
        const dy = (rightEye.y - leftEye.y) * this.canvas.height;
        const headRoll = Math.atan2(dy, dx);
        
        // Decreased scale to make hats smaller
        const templeDistX = (rightTemple.x - leftTemple.x) * this.canvas.width;
        const templeDistY = (rightTemple.y - leftTemple.y) * this.canvas.height;
        const faceWidth = Math.sqrt(templeDistX*templeDistX + templeDistY*templeDistY) * 1.25;
        
        // Base anchor - shift significantly up so eyes are completely free
        const cx = topHead.x * this.canvas.width;
        const cy = topHead.y * this.canvas.height - faceWidth * 0.25;
        const style = this.state.hats.style;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(headRoll);

        // Enhance realistic shadows
        this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
        this.ctx.shadowBlur = faceWidth * 0.2;
        this.ctx.shadowOffsetY = faceWidth * 0.15;

        if (isBackLayer) {
            if (style === 'w_sunhat') {
                // Back of the sun hat brim
                this.ctx.fillStyle = this.patterns.straw;
                this.ctx.beginPath();
                // 0 to Math.PI with true = top half. This goes behind the head.
                this.ctx.ellipse(0, faceWidth*0.1, faceWidth*1.1, faceWidth*0.3, 0, 0, Math.PI, true);
                this.ctx.fill();
            }
        } else {
            // Front elements
            if (style === 'm_fedora') {
                // Fedora Brim (curved up at sides)
                this.ctx.fillStyle = this.patterns.felt;
                this.ctx.beginPath();
                this.ctx.moveTo(-faceWidth*0.8, faceWidth*0.05);
                this.ctx.quadraticCurveTo(0, faceWidth*0.25, faceWidth*0.8, faceWidth*0.05);
                this.ctx.quadraticCurveTo(0, faceWidth*0.35, -faceWidth*0.8, faceWidth*0.05);
                this.ctx.fill();

                // Fedora Crown (with gradient for 3D realism)
                this.ctx.shadowBlur = 0; 
                const crownGrad = this.ctx.createLinearGradient(-faceWidth*0.4, 0, faceWidth*0.4, 0);
                crownGrad.addColorStop(0, '#111');
                crownGrad.addColorStop(0.3, '#333');
                crownGrad.addColorStop(0.7, '#222');
                crownGrad.addColorStop(1, '#050505');
                this.ctx.fillStyle = crownGrad;
                
                this.ctx.beginPath();
                this.ctx.moveTo(-faceWidth*0.45, faceWidth*0.1);
                this.ctx.quadraticCurveTo(-faceWidth*0.4, -faceWidth*0.5, -faceWidth*0.3, -faceWidth*0.6);
                this.ctx.quadraticCurveTo(0, -faceWidth*0.45, faceWidth*0.3, -faceWidth*0.6);
                this.ctx.quadraticCurveTo(faceWidth*0.4, -faceWidth*0.5, faceWidth*0.45, faceWidth*0.1);
                this.ctx.fill();

                // Silk Ribbon
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.beginPath();
                this.ctx.moveTo(-faceWidth*0.43, faceWidth*0.1);
                this.ctx.quadraticCurveTo(0, faceWidth*0.15, faceWidth*0.43, faceWidth*0.1);
                this.ctx.lineTo(faceWidth*0.42, 0);
                this.ctx.quadraticCurveTo(0, faceWidth*0.05, -faceWidth*0.42, 0);
                this.ctx.fill();

            } else if (style === 'm_cap') {
                // Baseball cap bill sticking out
                this.ctx.fillStyle = '#1e3a8a';
                this.ctx.beginPath();
                this.ctx.ellipse(faceWidth*0.15, faceWidth*0.15, faceWidth*0.6, faceWidth*0.2, Math.PI*0.1, 0, Math.PI*2);
                this.ctx.fill();
                
                // Add a shiny stroke to the bill edge
                this.ctx.strokeStyle = '#3b82f6';
                this.ctx.lineWidth = faceWidth * 0.02;
                this.ctx.stroke();

                // Cap Dome
                this.ctx.shadowBlur = 0;
                const domeGrad = this.ctx.createRadialGradient(faceWidth*0.1, -faceWidth*0.2, 0, 0, 0, faceWidth*0.5);
                domeGrad.addColorStop(0, '#2563eb');
                domeGrad.addColorStop(1, '#1e3a8a');
                this.ctx.fillStyle = domeGrad;
                
                this.ctx.beginPath();
                this.ctx.arc(0, faceWidth*0.1, faceWidth*0.48, Math.PI, 0);
                this.ctx.fill();

                // Panels (stitching)
                this.ctx.strokeStyle = '#1e40af';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -faceWidth*0.38);
                this.ctx.lineTo(-faceWidth*0.3, faceWidth*0.1);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(0, -faceWidth*0.38);
                this.ctx.lineTo(faceWidth*0.3, faceWidth*0.1);
                this.ctx.stroke();

                // Top button
                this.ctx.fillStyle = '#111';
                this.ctx.beginPath();
                this.ctx.arc(0, -faceWidth*0.38, faceWidth*0.06, 0, Math.PI*2);
                this.ctx.fill();

            } else if (style === 'm_tophat') {
                this.ctx.fillStyle = '#111';
                this.ctx.beginPath();
                this.ctx.ellipse(0, faceWidth*0.1, faceWidth*0.8, faceWidth*0.15, 0, 0, Math.PI*2);
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                const grad = this.ctx.createLinearGradient(-faceWidth*0.45, 0, faceWidth*0.45, 0);
                grad.addColorStop(0, '#111');
                grad.addColorStop(0.3, '#4a4a4a'); // Shiny specular
                grad.addColorStop(0.6, '#111');
                grad.addColorStop(1, '#050505');
                this.ctx.fillStyle = grad;

                this.ctx.beginPath();
                this.ctx.moveTo(-faceWidth*0.45, faceWidth*0.1);
                this.ctx.lineTo(-faceWidth*0.5, -faceWidth*0.9);
                this.ctx.quadraticCurveTo(0, -faceWidth*1.0, faceWidth*0.5, -faceWidth*0.9);
                this.ctx.lineTo(faceWidth*0.45, faceWidth*0.1);
                this.ctx.fill();

                // Ribbon
                this.ctx.fillStyle = '#8b0000';
                this.ctx.beginPath();
                this.ctx.moveTo(-faceWidth*0.45, faceWidth*0.1);
                this.ctx.quadraticCurveTo(0, faceWidth*0.15, faceWidth*0.45, faceWidth*0.1);
                this.ctx.lineTo(faceWidth*0.46, -faceWidth*0.1);
                this.ctx.quadraticCurveTo(0, -faceWidth*0.05, -faceWidth*0.46, -faceWidth*0.1);
                this.ctx.fill();

            } else if (style === 'w_sunhat') {
                // Front brim - reduced Y radius so it doesn't cover face
                this.ctx.fillStyle = this.patterns.straw;
                this.ctx.beginPath();
                this.ctx.ellipse(0, faceWidth*0.1, faceWidth*1.1, faceWidth*0.25, 0, 0, Math.PI, false);
                this.ctx.fill();

                // Crown with texture and shadow
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(0, faceWidth*0.1, faceWidth*0.5, Math.PI, 0);
                this.ctx.fill();
                
                // Realistic Pink Ribbon
                const rGrad = this.ctx.createLinearGradient(-faceWidth*0.5, 0, faceWidth*0.5, 0);
                rGrad.addColorStop(0, '#c71585');
                rGrad.addColorStop(0.5, '#ff69b4');
                rGrad.addColorStop(1, '#db7093');
                this.ctx.fillStyle = rGrad;
                
                this.ctx.beginPath();
                this.ctx.ellipse(0, faceWidth*0.1, faceWidth*0.5, faceWidth*0.1, 0, 0, Math.PI, false);
                this.ctx.fill();

            } else if (style === 'w_beret') {
                this.ctx.fillStyle = this.patterns.knit;
                this.ctx.rotate(Math.PI/10); 
                
                this.ctx.beginPath();
                this.ctx.ellipse(faceWidth*0.1, -faceWidth*0.1, faceWidth*0.7, faceWidth*0.35, 0, 0, Math.PI*2);
                this.ctx.fill();
                
                // Add shading volume
                const vGrad = this.ctx.createRadialGradient(faceWidth*0.1, -faceWidth*0.3, 0, faceWidth*0.1, -faceWidth*0.1, faceWidth*0.7);
                vGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
                vGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
                this.ctx.fillStyle = vGrad;
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#8b0000';
                this.ctx.fillRect(faceWidth*0.1, -faceWidth*0.45, faceWidth*0.06, faceWidth*0.15);

            } else if (style === 'w_beanie') {
                this.ctx.fillStyle = this.patterns.knit;
                this.ctx.beginPath();
                this.ctx.arc(0, faceWidth*0.15, faceWidth*0.55, Math.PI, 0);
                this.ctx.fill();

                // Add fabric volume shading
                const vGrad = this.ctx.createRadialGradient(0, -faceWidth*0.1, 0, 0, faceWidth*0.15, faceWidth*0.55);
                vGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
                vGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
                this.ctx.fillStyle = vGrad;
                this.ctx.fill();

                // Thick Cuff
                this.ctx.fillStyle = '#a52a2a';
                this.ctx.fillRect(-faceWidth*0.55, faceWidth*0.05, faceWidth*1.1, faceWidth*0.2);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                this.ctx.strokeRect(-faceWidth*0.55, faceWidth*0.05, faceWidth*1.1, faceWidth*0.2);

                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(0, -faceWidth*0.4, faceWidth*0.18, 0, Math.PI*2);
                this.ctx.fill();
            }
        }
        
        this.ctx.restore();
    }

    moveToPoint(pt) {
        this.ctx.moveTo(pt.x * this.canvas.width, pt.y * this.canvas.height);
    }

    lineToPoint(pt) {
        this.ctx.lineTo(pt.x * this.canvas.width, pt.y * this.canvas.height);
    }
}
window.MakeupDrawer = MakeupDrawer;
