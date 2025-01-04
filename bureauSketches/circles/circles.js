/************************************************************
 *  sketch50_gui_mouseRepel.js
 *  
 *  1) Random wander at first, then form 3 overlapping circles.
 *  2) dat.GUI for circle radius, overlap, etc.
 *  3) Mouse repels dots within a certain radius, 
 *     so they fly away but come back to their circle spots.
 *  4) fadeIn uses text2.png.
 ************************************************************/

let dots = [];
let circleTargets = [];    // positions for the 3 circles
let randomMode = true;     // start in random wander mode
let circleMode = false;    // after fadeIn, we switch to circle mode

let params = {
  // Visual
  backgroundAlpha: 255,   // if <255, trailing effect
  dotCount: 180,
  dotSize: 8,             // ellipse size
  dotMaxSpeed: 2,
  dotMaxForce: 0.05,

  // Circle settings
  circleRadius: 250,        // radius of each circle
  circlePointsTotal: 180,   // total circle points
  circleOverlap: 0.25,      // how far left/right circles A & C are from center

  // "Stop distance": how close before we dampen velocity
  stopDist: 10,

  // Random wander nudges
  wanderNudge: 0.1,

  // Mouse repulsion
  mouseRepelRadius: 130,   // how close before repelling
  mouseRepelForce: 0.275,    // how strong the force is near the mouse

  // Fade timing (ms)
  fadeDelay1: 1000,  // wait before starting fade
  fadeDelay2: 2000,  // fade time + buffer before circleMode

  // GUI button
  resetSketch: function() {
    resetAll();
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  // ======= dat.GUI Setup =======
  let gui = new dat.GUI();

  // Basic visuals
  gui.add(params, 'backgroundAlpha', 0, 255, 1).name('BG Alpha');
  gui.add(params, 'dotCount', 1, 1000, 1).name('Dot Count');
  gui.add(params, 'dotSize', 1, 40, 1).name('Dot Size');
  gui.add(params, 'dotMaxSpeed', 0.1, 10, 0.1).name('Dot Max Speed');
  gui.add(params, 'dotMaxForce', 0.001, 0.2, 0.001).name('Dot Max Force');
  gui.add(params, 'stopDist', 0, 30, 1).name('Stop Dist');
  gui.add(params, 'wanderNudge', 0, 1, 0.01).name('Wander Nudge');

  // Circle folder
  let f2 = gui.addFolder('Circle Settings');
  f2.add(params, 'circleRadius', 10, 500, 1).name('Circle Radius');
  f2.add(params, 'circlePointsTotal', 1, 2000, 1).name('Total Circle Pts');
  f2.add(params, 'circleOverlap', 0.0, 1.0, 0.01).name('Circle Overlap');

  // Mouse Repel folder
  let fMouse = gui.addFolder('Mouse Repulsion');
  fMouse.add(params, 'mouseRepelRadius', 0, 500, 1).name('Repel Radius');
  fMouse.add(params, 'mouseRepelForce', 0.01, 2, 0.01).name('Repel Force');

  // Fade Timings
  let f3 = gui.addFolder('Fade Timing (ms)');
  f3.add(params, 'fadeDelay1', 0, 10000, 100).name('FadeDelay Start');
  f3.add(params, 'fadeDelay2', 0, 10000, 100).name('FadeDelay End');

  // Reset
  gui.add(params, 'resetSketch').name('Reset Sketch');

  resetAll();
}

function draw() {
  background(0, params.backgroundAlpha);

  // Update + display all dots
  for (let d of dots) {
    d.update();
    d.display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetAll();
}

// Re-init everything
function resetAll() {
  dots = [];
  circleTargets = [];
  randomMode = true;
  circleMode = false;

  // Create dots
  for (let i = 0; i < params.dotCount; i++) {
    dots.push(new Dot(random(width), random(height)));
  }

  // Precompute circle positions
  circleTargets = generateThreeCircles(params.circlePointsTotal);

  // Kick off fade
  fadeInTextAndSwitchModes();
}

// Fade in #textFade, then switch mode
function fadeInTextAndSwitchModes() {
  setTimeout(() => {
    let textDiv = document.getElementById('textFade');
    if (textDiv) {
      // Ensure your HTML has <img src="text2.png" inside #textFade
      textDiv.style.opacity = 1;
    }

    setTimeout(() => {
      enableCircleMode();
    }, params.fadeDelay2);
  }, params.fadeDelay1);
}

function enableCircleMode() {
  randomMode = false;
  circleMode = true;

  // Assign each dot a circle position
  for (let i = 0; i < dots.length; i++) {
    let idx = i % circleTargets.length;
    dots[i].setTarget(circleTargets[idx]);
  }
}

/************************************************************
 * Dot class
 *  - random wander if randomMode=true
 *  - if circleMode, seek assigned target
 *  - mouse repels them if close
 ************************************************************/
class Dot {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(params.dotMaxSpeed);
    this.acc = createVector(0, 0);
    this.target = null;
  }

  setTarget(p) {
    this.target = p.copy();
  }

  update() {
    // Clear forces each frame
    this.acc.set(0, 0);

    // If mouse is near, repel
    this.repelFromMouse();

    // Behavior
    if (randomMode) {
      this.randomWander();
    } else if (circleMode) {
      this.seekTarget();
    }

    // Physics update
    this.vel.add(this.acc);
    this.vel.limit(params.dotMaxSpeed);
    this.pos.add(this.vel);

    // Wrap edges
    if (this.pos.x < 0)  this.pos.x = width;
    if (this.pos.x > width)  this.pos.x = 0;
    if (this.pos.y < 0)  this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  display() {
    fill(255);
    noStroke();
    ellipse(this.pos.x, this.pos.y, params.dotSize);
  }

  randomWander() {
    // small random nudges
    this.vel.x += random(-params.wanderNudge, params.wanderNudge);
    this.vel.y += random(-params.wanderNudge, params.wanderNudge);
  }

  seekTarget() {
    if (!this.target) return;

    let desired = p5.Vector.sub(this.target, this.pos);
    let d = desired.mag();

    desired.setMag(params.dotMaxSpeed);

    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(params.dotMaxForce);
    this.acc.add(steer);

    // slow down if within stopDist
    if (d < params.stopDist) {
      this.vel.mult(0.9);
    }
  }

  // Mouse repulsion
  repelFromMouse() {
    let mousePos = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(this.pos, mousePos);
    let dist = dir.mag();

    if (dist < params.mouseRepelRadius) {
      dir.normalize();
      // stronger force if very close
      let force = map(dist, 0, params.mouseRepelRadius, params.mouseRepelForce, 0);
      this.acc.add(dir.mult(force));
    }
  }
}

/************************************************************
 * Generate 3 Overlapping Circles
 ************************************************************/
function generateThreeCircles(nTotal) {
  let positions = [];
  let perCircle = floor(nTotal / 3);

  let cxA = width * (0.5 - params.circleOverlap);
  let cxB = width * 0.5;
  let cxC = width * (0.5 + params.circleOverlap);
  let cy  = height * 0.5;

  positions.push(...circlePoints(createVector(cxA, cy), params.circleRadius, perCircle));
  positions.push(...circlePoints(createVector(cxB, cy), params.circleRadius, perCircle));
  positions.push(...circlePoints(createVector(cxC, cy), params.circleRadius, perCircle));

  return positions;
}

function circlePoints(c, r, count) {
  let arr = [];
  for (let i = 0; i < count; i++) {
    let angle = map(i, 0, count, 0, TWO_PI);
    let x = c.x + r * cos(angle);
    let y = c.y + r * sin(angle);
    arr.push(createVector(x, y));
  }
  return arr;
}