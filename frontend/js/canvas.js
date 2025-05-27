window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let shipImg = new window.Image();
    shipImg.src = '/resources/cargo-ship.png';

    // Offset for the grid to push it below the navbar
    const topOffset = 80; // px, adjusted to match navbar height

    // Animation state
    let shipX = 0;
    let shipY = 0;
    let shipWidth = 220;
    let shipHeight = 80;
    let speed = 0.3; // px per frame

    // Resize canvas to fill window
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        shipY = Math.floor(canvas.height * 0.7) - shipHeight; // lower part of screen
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawDimmedBackground() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(30, 40, 60, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw a single ship at (x, y)
    function drawShipAt(x, y) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.drawImage(shipImg, x, y, shipWidth, shipHeight);
        ctx.restore();
        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(x + shipWidth/2, y + shipHeight - 10, shipWidth/2.2, 12, 0, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }

    // Draw a grid of ships, each row offset horizontally for animation
    function drawShipGrid(offsetX) {
        // Increase gap to make the boats fewer
        const gapX = Math.floor(shipWidth * 3.5); // much wider horizontal gap
        const gapY = Math.floor(shipHeight * 3.5); // much taller vertical gap
        const cols = Math.ceil(canvas.width / gapX) + 2;
        const rows = Math.ceil((canvas.height - topOffset) / gapY);
        for (let row = 0; row < rows; row++) {
            // Each row can have a different horizontal offset
            let rowOffset = (offsetX + row * gapX / 2) % (gapX * cols);
            for (let col = -1; col < cols; col++) {
                let x = col * gapX + rowOffset - gapX;
                let y = row * gapY + topOffset;
                drawShipAt(x, y);
            }
        }
    }

    let animationOffset = 0;

    function animate() {
        drawDimmedBackground();
        if (shipImg.complete) {
            drawShipGrid(animationOffset);
        }
        animationOffset += speed;
        const gapX = Math.floor(shipWidth * 3.5);
        const cols = Math.ceil(canvas.width / gapX) + 2;
        const gridWidth = gapX * cols;
        if (animationOffset > gridWidth) {
            animationOffset -= gridWidth;
        }
        requestAnimationFrame(animate);
    }

    shipImg.onload = () => {
        shipWidth = Math.floor(shipImg.width * 0.4);
        shipHeight = Math.floor(shipImg.height * 0.4);
        shipY = Math.floor(canvas.height * 0.7) - shipHeight;
        animate();
    };
    // If image is cached
    if (shipImg.complete) {
        shipWidth = Math.floor(shipImg.width * 0.4);
        shipHeight = Math.floor(shipImg.height * 0.4);
        shipY = Math.floor(canvas.height * 0.7) - shipHeight;
        animate();
    }
});