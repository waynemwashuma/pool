let r = new Date().valueOf();
console.log(r);
let c = document.getElementById('D');
c.width = 600;
c.height = 400;
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
        console.log('dt')
    }
})

function friction(obj) {
    let co_e = 0.02;
    if (obj.vel.x > 0) {
        let v = new Vector(obj.vel.x, obj.vel.y);
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

async function collidesWith(bal, obj) {
    obj.forEach(e => {
        if (e !== bal) {
            if (circ(e, bal,2* bal.r)) {
                let uv = new Vector(e.x - bal.x, e.y - bal.y);
                let vv = new Vector(bal.vel.x,bal.vel.y).mag();
                un = uv.normalise();
                e.vel.x = un.x *vv;
                e.vel.y = un.y *vv;
            }
        }
        obj.forEach(f=>{
            f.updateVEL()
        })

    })
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
let ballradius = 15;
function ball(x, y, name, color = 'red') {
    this.strokecolor = 'green';
    this.x = x;
    this.name = name;
    this.color = color;
    this.y = y;
    this.vel = {
        x: 0,
        y: 0,
    }
    this.updateVEL=async()=>{
        this.vel.x = this.vel.x;
        this.vel.y = this.vel.y;
    }
    this.r = ballradius;
    this.draw = function (n) {
        n.beginPath();
        n.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        n.fillStyle = this.color;
        n.fill();
        n.closePath();
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
        x: 10,
        y: 2
    }
    this.shooting = false;
    this.shoot = async function (obj) {
        obj.vel.y += this.vel.y;
        obj.vel.x += this.vel.x;
        this.shooting = true;
        console.log(obj);
        
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
        let v = new Vector(Math.cos(this.deg), Math.cos(this.deg - Math.PI / 2)).mult(30);
        this.rad = this.deg * 180 / Math.PI;
        this.x = obj.x;
        this.y = obj.y;
        this.x += v.x;
        this.y += v.y;
        this.vel.x = -v.mult(1 / 3).x;
        this.vel.y = -v.mult(1 / 3).y;
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
                obj.x = randomIntFromRange(40,600);
                obj.y = randomIntFromRange(40,360);
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
let balls;
let holes = [
    new Hole(0, 0),
    new Hole(c.width / 2, 0),
    new Hole(c.width, 0),
    new Hole(0, c.height / 2),
    new Hole(0, c.height),
    new Hole(c.width, c.height),
    new Hole(c.width, c.height / 2),
    new Hole(c.width / 2, c.height)
];

(function (n) {
    balls = [];
    let r = ballradius,
        l = 2 * r * Math.sin(30),
        op = [460, 200];
    balls.push(new ball(100, 200, 'cueball', 'beige'))
    let pos = [[op[0], op[1]],
    [op[0] + l, op[1] + r],
    [op[0] + l, op[1] - r],[op[0]+2*l,op[1]]];
    for (let i = 0; i < pos.length; i++) {
        let a = new ball(pos[i][0], pos[i][1], 'other');
        balls.push(a);
    }
})(2);
console.log(holes);
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
                if (stick.shooting) {
                    balls.forEach(r => {
                        if (r.vel.x > 0 && r.vel.y > 0) {
                            return
                        }
                    }
                );
                    stick.shooting = false;
                }
                stick.update(ct, e);
            }
        })
    })();
};
console.log(balls);

let stick = new Stick(balls[0].x, balls[1].y);
(async function loop() {
    balls.forEach(e => {
        collidesWith(e, balls);
        e.move();
        e.collider();
        friction(e)
    });
    holes.forEach(hole => {
        balls.forEach(bal => {
            hole.collider(bal, balls)
        });
    })
    ct.clearRect(0, 0, innerWidth, innerHeight);
    draw();
    window.requestAnimationFrame(loop);
})();
console.log(balls);
(function () {
    let e = document.querySelector("button");
    e.innerHTML = "fullscreen" || undefined;
    let onfullscreen = false;
    e.addEventListener("click", async () => {
        if (!c.requestFullscreen()) {
            throw new Error('fullscreen failed');
            alert('fullscreen error');
            return
        }
        onfullscreen = onfullscreen ? false : true;
    })
    addEventListener('keydown', e => {
        switch (e.key) {
            case 'w':
                stick.deg += 0.1;
                break;
            case 's':
                stick.deg -= 0.1;
                console.log('see');
                
                break;

        }
    })
    addEventListener('keypress', e => {
        switch (e.key) {
            case 'm':
                balls.forEach(e => {
                    if (e.name == 'cueball') {
                        stick.shoot(e);
                        stick.shooting = true;
                    }

                })

                break;
        }
    })
})();
console.log(new Date().valueOf() - r);
let initialBalls = 9;
setInterval(()=>{
    if (balls.length == 1) {
            let b;
            for (let i = 0; i <initialBalls ; i++) {
                let x = randomIntFromRange(20, innerHeight);
                let y = randomIntFromRange(20, innerWidth);
                if (i) {
                    for (let j = 0; j < balls.length; j++) {
                        let e = balls[j];
                        y = randomIntFromRange(20, c.width);
                        x = randomIntFromRange(20, c.height);
                        if (getDist(e.x, e.y, x, y) <= e.r * 2) {
                            j = -1;
                        }
                    }
                }
                balls.push(new ball(x, y))
            }
    }
},1000)