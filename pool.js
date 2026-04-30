let c = document.getElementById('D');
let orientationPrompt = document.getElementById('orientationPrompt');
let powerFill = document.getElementById('powerFill');
let powerStatus = document.getElementById('powerStatus');
let tablePadding = 20;
let minShotPower = 0;
let maxShotPower = 50;
let shotPower = 10;
let shotPowerStep = 1;
let momentumThreshold = 0.2;
let stick;
let mouse = {
    x: null,
    y: null
}

addEventListener('mousemove', async (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY
});
addEventListener('dragenter', () => {
    for (let i = 0; i < balls.length; i++) {
        const e = balls[i];
        if (circ(mouse, e)) {
            e.x = mouse.x;
            e.y = mouse.y;
        }
    }
})

function updateHoles() {
    holes = [
        new Hole(0, 0),
        new Hole(c.width / 2, 0),
        new Hole(c.width, 0),
        new Hole(0, c.height / 2),
        new Hole(0, c.height),
        new Hole(c.width, c.height),
        new Hole(c.width, c.height / 2),
        new Hole(c.width / 2, c.height)
    ];
}

function resizeTable() {
    c.width = Math.max(window.innerWidth - tablePadding, 320);
    c.height = Math.max(window.innerHeight - tablePadding, 420);
    updateHoles();
    if (balls && balls.length) {
        balls[0].x = Math.min(balls[0].x, c.width * 0.35);
        balls[0].y = Math.min(Math.max(balls[0].y, ballradius * 2), c.height - ballradius * 2);
    }
}

function updateOrientationPrompt() {
    if (!orientationPrompt) {
        return;
    }
    let mobileViewport = window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches;
    let isLandscape = window.innerWidth > window.innerHeight;
    orientationPrompt.classList.toggle('active', mobileViewport && isLandscape);
}

function friction(obj) {
    let co_e = 0.02;
    let v = new Vector(obj.vel.x, obj.vel.y);
    if (v.mag() > 0) {
        if (v.mag() <= co_e) {
            obj.vel.x = 0;
            obj.vel.y = 0;
            return obj
        }
        v = v.mult(1 - co_e);
        obj.vel.x = v.x;
        obj.vel.y = v.y;
    }
    return obj
}

function getDist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function collidesWith(balls) {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            let a = balls[i];
            let b = balls[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let minDistance = a.r + b.r;

            if (distance === 0 || distance > minDistance) {
                continue;
            }

            let normalX = dx / distance;
            let normalY = dy / distance;
            let tangentX = -normalY;
            let tangentY = normalX;

            let relativeVelocityX = b.vel.x - a.vel.x;
            let relativeVelocityY = b.vel.y - a.vel.y;
            let speedAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

            if (speedAlongNormal < 0) {
                let aNormal = a.vel.x * normalX + a.vel.y * normalY;
                let bNormal = b.vel.x * normalX + b.vel.y * normalY;
                let aTangent = a.vel.x * tangentX + a.vel.y * tangentY;
                let bTangent = b.vel.x * tangentX + b.vel.y * tangentY;

                a.vel.x = bNormal * normalX + aTangent * tangentX;
                a.vel.y = bNormal * normalY + aTangent * tangentY;
                b.vel.x = aNormal * normalX + bTangent * tangentX;
                b.vel.y = aNormal * normalY + bTangent * tangentY;
            }

            let overlap = minDistance - distance;
            let separation = overlap / 2;

            a.x -= normalX * separation;
            a.y -= normalY * separation;
            b.x += normalX * separation;
            b.y += normalY * separation;
        }
    }
}
let ct = c.getContext('2d');

function circ(obj1, obj2, l) {
    if (getDist(obj1.x, obj1.y, obj2.x, obj2.y) <= l) {
        return true
    } else {
        return false

    }
}


function randomIntFromRange(min, max) {
    return Math.round((Math.random() * (max - min)) + min)
}

function Vector(x, y) {
    this.y = y;
    this.x = x;
    this.mag = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    this.normalise = () => {
        return new Vector(this.x / this.mag(), this.y / this.mag())
    }
    this.tangent = () => {
        return new Vector(this.y, -this.x)
    }
    this.mult = (n) => {
        return new Vector(this.x * n, this.y * n)
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getCurrentShotPower() {
    return clamp(shotPower, minShotPower, maxShotPower);
}

function getShotPowerPercentage() {
    let powerRange = maxShotPower - minShotPower;
    if (powerRange === 0) {
        return 100;
    }
    return Math.round(((getCurrentShotPower() - minShotPower) / powerRange) * 100);
}

function getTotalMomentum() {
    return balls.reduce((sum, ball) => {
        return sum + Math.sqrt(ball.vel.x * ball.vel.x + ball.vel.y * ball.vel.y);
    }, 0);
}

function canShoot() {
    return getTotalMomentum() <= momentumThreshold;
}

function updatePowerBar() {
    if (!powerFill || !powerStatus) {
        return;
    }
    let percentage = getShotPowerPercentage();
    powerFill.style.width = percentage + '%';
    powerStatus.textContent = canShoot()
        ? 'Power ' + percentage + '%'
        : 'Table moving...';
}

let ballradius = 15;
function Ball(x, y, name, color = 'red') {
    this.strokecolor = 'green';
    this.x = x;
    this.name = name;
    this.color = color;
    this.y = y;
    this.vel = {
        x: 0,
        y: 0,
    }
    this.updateVEL = async () => {
        this.vel.x = this.vel.x;
        this.vel.y = this.vel.y;
    }
    this.r = ballradius;
    this.draw = function (n) {
        let shadowOffsetX = this.r * 0.32;
        let shadowOffsetY = this.r * 0.45;
        let bodyGradient = n.createRadialGradient(
            this.x - this.r * 0.45,
            this.y - this.r * 0.55,
            this.r * 0.18,
            this.x,
            this.y,
            this.r
        );
        let highlightGradient = n.createRadialGradient(
            this.x - this.r * 0.4,
            this.y - this.r * 0.45,
            0,
            this.x - this.r * 0.4,
            this.y - this.r * 0.45,
            this.r * 0.42
        );

        n.save();
        n.beginPath();
        n.ellipse(
            this.x + shadowOffsetX,
            this.y + shadowOffsetY,
            this.r * 0.92,
            this.r * 0.52,
            -0.18,
            0,
            Math.PI * 2
        );
        n.fillStyle = 'rgba(0, 0, 0, 0.22)';
        n.fill();
        n.closePath();

        bodyGradient.addColorStop(0, '#ffffff');
        bodyGradient.addColorStop(0.16, this.color);
        bodyGradient.addColorStop(0.72, this.color);
        bodyGradient.addColorStop(1, 'rgba(0, 0, 0, 0.78)');

        n.beginPath();
        n.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        n.fillStyle = bodyGradient;
        n.fill();
        n.closePath();

        n.beginPath();
        n.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        n.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        n.lineWidth = 1.1;
        n.stroke();
        n.closePath();

        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        highlightGradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.32)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        n.beginPath();
        n.arc(this.x - this.r * 0.36, this.y - this.r * 0.38, this.r * 0.42, 0, Math.PI * 2);
        n.fillStyle = highlightGradient;
        n.fill();
        n.closePath();
        n.restore();
    }
    this.move = function () {
        this.x += this.vel.x;
        this.y += this.vel.y;
    }
    this.collider = function () {
        if (this.x - this.r <= 0 ||
            this.x + this.r >= c.width
        ) {
            this.vel.x = -this.vel.x;

        }
        if (this.y - this.r <= 0 ||
            this.y + this.r >= c.height) {
            this.vel.y = -this.vel.y;
        }
    }
};
function Stick(x, y) {
    this.l = 400;
    this.w = 5;
    this.x = x;
    this.y = y;
    this.deg = Math.PI;
    this.vel = {
        x: 0,
        y: 0
    }
    this.shooting = false;
    this.shoot = async function (obj) {
        if (!canShoot()) {
            return;
        }
        obj.vel.y += this.vel.y;
        obj.vel.x += this.vel.x;
        this.shooting = true;
        obj.updateVEL();
    }
    this.draw = async function (n) {
        n.save();
        n.beginPath();
        n.translate(this.x, this.y);
        n.rotate(this.deg);
        n.fillStyle = 'brown';
        n.fillRect(0, 0, this.l, this.w);

        n.closePath();
        n.restore();
    };
    this.rotation = function (obj) {
        let aim = new Vector(Math.cos(this.deg), Math.cos(this.deg - Math.PI / 2));
        let v = aim.mult(30);
        let shotForce = getCurrentShotPower();
        this.rad = this.deg * 180 / Math.PI;
        this.x = obj.x;
        this.y = obj.y;
        this.x += v.x;
        this.y += v.y;
        this.vel.x = -aim.x * shotForce;
        this.vel.y = -aim.y * shotForce;
    }
    this.update = function (c, obj) {
        this.draw(c);
        this.rotation(obj);
    }
}
function Hole(x, y) {
    this.x = x;
    this.y = y;
    this.r = 40;
    this.draw = function (n) {
        n.beginPath();
        n.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        n.fillStyle = 'black';
        n.fill();
        n.closePath();
    }
    this.collider = (obj, arr) => {
        if (circ(this, obj, this.r)) {
            if (obj.name == 'cueball') {
                obj.x = randomIntFromRange(40, 600);
                obj.y = randomIntFromRange(40, 360);
                obj.vel.x = 0;
                obj.vel.y = 0;
                return
            }
            let n = arr.indexOf(obj),
                m = arr.splice(0, n);
            arr.shift();
            m.forEach(e => {
                arr.unshift(e)
            })
        }
    }
}
function shootCueBall() {
    if (!canShoot()) {
        return;
    }
    balls.forEach(ball => {
        if (ball.name == 'cueball') {
            stick.shoot(ball);
            stick.shooting = true;
        }
    })
}

function rackBalls() {
    balls = [];
    let r = ballradius;
    let rowOffset = Math.sqrt(3) * r;
    let rackOrigin = [c.width * 0.62, c.height / 2];
    let rows = 5;
    balls.push(new Ball(c.width * 0.2, c.height / 2, 'cueball', 'beige'))
    for (let row = 0; row < rows; row++) {
        let x = rackOrigin[0] + row * rowOffset;
        let startY = rackOrigin[1] - row * r;
        for (let col = 0; col <= row; col++) {
            let y = startY + col * 2 * r;
            let a = new Ball(x, y, 'other');
            balls.push(a);
        }
    }
}

let balls;
let holes = [];

(function (n) {
    resizeTable();
    rackBalls();
    updateOrientationPrompt();
    updatePowerBar();
})(2);
function draw() {
    holes.forEach(hole => {
        hole.draw(ct)
    });
    for (let i = 0; i < balls.length; i++) {
        balls[i].draw(ct);
    }
    (function () {
        balls.forEach(e => {
            if (e.name == 'cueball') {
                if (stick.shooting && canShoot()) {
                    stick.shooting = false;
                }
                if (!stick.shooting) {
                    stick.update(ct, e);
                } else {
                    stick.rotation(e);
                }
            }
        })
    })();
};

stick = new Stick(balls[0].x, balls[1].y);
(async function loop() {
    collidesWith(balls);
    balls.forEach(e => {
        e.move();
        e.collider();
        friction(e)
    });
    holes.forEach(hole => {
        balls.forEach(bal => {
            hole.collider(bal, balls)
        });
    })
    ct.clearRect(0, 0, c.width, c.height);
    draw();
    updatePowerBar();
    window.requestAnimationFrame(loop);
})();
(function () {
    let e = document.querySelector("button");
    e.innerHTML = "Fullscreen" || undefined;
    e.addEventListener("click", async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (error) {
                console.error('fullscreen failed', error);
            }
            return;
        }
        document.exitFullscreen();
    })
    addEventListener('keydown', e => {
        switch (e.key) {
            case 'ArrowLeft':
                stick.deg += 0.1;
                break;
            case 'ArrowRight':
                stick.deg -= 0.1;
                break;
            case 'ArrowUp':
                shotPower = clamp(shotPower + shotPowerStep, minShotPower, maxShotPower);
                updatePowerBar();
                break;
            case 'ArrowDown':
                shotPower = clamp(shotPower - shotPowerStep, minShotPower, maxShotPower);
                updatePowerBar();
                break;
            case ' ':
                e.preventDefault();
                shootCueBall();
                break;
        }
    })
})();
addEventListener('resize', () => {
    resizeTable();
    updateOrientationPrompt();
    updatePowerBar();
});

addEventListener('orientationchange', () => {
    resizeTable();
    updateOrientationPrompt();
    updatePowerBar();
});

let initialBalls = 15;
setInterval(() => {
    if (balls.length == 1) {
        balls = [balls[0]];
        balls[0].x = c.width * 0.2;
        balls[0].y = c.height / 2;
        balls[0].vel.x = 0;
        balls[0].vel.y = 0;
        for (let i = 0; i < initialBalls; i++) {
            let row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
            let rowStart = row * (row + 1) / 2;
            let col = i - rowStart;
            let x = c.width * 0.62 + row * Math.sqrt(3) * ballradius;
            let y = c.height / 2 - row * ballradius + col * 2 * ballradius;
            balls.push(new Ball(x, y, 'other'))
        }
    }
}, 1000)
