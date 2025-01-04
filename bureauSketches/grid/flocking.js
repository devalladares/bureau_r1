// ============ PARAMS ============

let params = {
  // Flocking
  boidCount: 60,
  maxSpeed: 2,
  maxForce: 0.06,
  separationDist: 180,
  alignmentDist: 180,
  cohesionDist: 180,

  // Visual
  circleSize: 8,
  trailAlpha: 70, // 0=full persistent trails, 255= no trails

  // Mouse interaction
  mouseRadius: 200,
  mouseForce: 0.15,
  herdWithMouse: true, // if true, boids align w/ mouse direction

  // Random Wander
  randomWander: false,

  // Functions
  resetBoids() { initBoids(); }
};

// ============ MAIN SKETCH ============

let boids = [];
let gui;
let flockMode = false; // Will be set true after text fade

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  initBoids();

  // ====== DAT.GUI Setup ======
  gui = new dat.GUI();
  gui.add(params, 'boidCount', 1, 200, 1).onFinishChange(initBoids).name('Boid Count');
  gui.add(params, 'maxSpeed', 0.1, 5, 0.1).name('Max Speed');
  gui.add(params, 'maxForce', 0.001, 0.2, 0.001).name('Max Force');
  gui.add(params, 'separationDist', 1, 300, 1).name('Separation Dist');
  gui.add(params, 'alignmentDist', 1, 300, 1).name('Alignment Dist');
  gui.add(params, 'cohesionDist', 1, 300, 1).name('Cohesion Dist');
  gui.add(params, 'circleSize', 1, 30, 1).name('Circle Size');
  gui.add(params, 'trailAlpha', 0, 255, 1).name('Trail Alpha');
  gui.add(params, 'mouseRadius', 10, 600, 10).name('Mouse Radius');
  gui.add(params, 'mouseForce', 0.01, 2, 0.01).name('Mouse Force');
  gui.add(params, 'herdWithMouse').name('Herd w/ Mouse?');
  gui.add(params, 'randomWander').name('Random Wander?');
  gui.add(params, 'resetBoids').name('Reset Boids');

  fadeInTextAndFlock();
}

function draw() {
  // Instead of solid black each frame, use semi-transparent black 
  // for a trailing effect:
  background(0, params.trailAlpha);

  for (let b of boids) {
    b.run(boids, flockMode);
  }
}

function initBoids() {
  boids = [];
  for (let i = 0; i < params.boidCount; i++) {
    boids.push(new Boid(random(width), random(height)));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'g' || key === 'G') {
    const guiContainer = document.querySelector('.dg.ac');
    if (!guiContainer) return;
    guiContainer.style.display = guiContainer.style.display === 'none' ? 'block' : 'none';
  }
}

function fadeInTextAndFlock() {
  setTimeout(() => {
    let textDiv = document.getElementById('textFade');
    if (textDiv) {
      textDiv.style.opacity = 1;  // triggers the 2s CSS fade
    }
    setTimeout(() => {
      flockMode = true;
    }, 2000);
  }, 1000);
}

// ============ BOID CLASS ============

class Boid {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0);
  }

  run(boids, isFlocking) {
    if (isFlocking) {
      this.flock(boids);
      if (params.herdWithMouse) {
        this.herdWithMouseVector();
      } else {
        this.attractToMouse();
      }
    } else if (params.randomWander) {
      this.randomWander();
    }

    this.update();
    this.render();
  }

  flock(boids) {
    let sep = this.separate(boids);
    let ali = this.align(boids);
    let coh = this.cohesion(boids);

    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);

    this.acceleration.add(sep);
    this.acceleration.add(ali);
    this.acceleration.add(coh);
  }

  separate(boids) {
    let desiredSeparation = params.separationDist;
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) {
      steer.div(count);
    }
    if (steer.mag() > 0) {
      steer.setMag(params.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(params.maxForce);
    }
    return steer;
  }

  align(boids) {
    let neighborDist = params.alignmentDist;
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.setMag(params.maxSpeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(params.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  cohesion(boids) {
    let neighborDist = params.cohesionDist;
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < neighborDist) {
        sum.add(other.position);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    return createVector(0, 0);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    desired.setMag(params.maxSpeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(params.maxForce);
    return steer;
  }

  attractToMouse() {
    let mousePos = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(mousePos, this.position);
    let dist = dir.mag();
    if (dist < params.mouseRadius) {
      dir.normalize();
      let force = map(dist, 0, params.mouseRadius, params.mouseForce, 0);
      dir.mult(force);
      this.acceleration.add(dir);
    }
  }

  herdWithMouseVector() {
    let mouseVel = createVector(mouseX - pmouseX, mouseY - pmouseY);
    let mag = mouseVel.mag();
    if (mag > 0.1) {
      mouseVel.normalize();
      mouseVel.mult(params.mouseForce);
      this.acceleration.add(mouseVel);
    }
  }

  randomWander() {
    this.velocity.x += random(-0.1, 0.1);
    this.velocity.y += random(-0.1, 0.1);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(params.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // wrap edges
    if (this.position.x < 0)  this.position.x = width;
    else if (this.position.x > width) this.position.x = 0;
    if (this.position.y < 0)  this.position.y = height;
    else if (this.position.y > height) this.position.y = 0;
  }

  render() {
    noStroke();
    fill(255);
    ellipse(this.position.x, this.position.y, params.circleSize);
  }
}