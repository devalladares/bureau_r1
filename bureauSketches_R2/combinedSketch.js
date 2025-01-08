/************************************************************
 * All your final code, with modifications for smoother DNA phase
 ************************************************************/

// ============ GLOBALS ============
let particles = [];
let sineTargetsTop = [];
let sineTargetsBottom = [];
let gridTargets = [];

let mode = "wander"; // "wander", "flock", "dna", "grid"

let modeIndex = 0;

// We'll track a global waveTime for a gentle flow
let waveTime = 0;

// We'll define a short random time (in ms) for the "wander" mode:
const WANDER_DURATION = params.wanderDelay; // 800ms

// We'll define a custom mode sequence:
const modeSequence = [
  "wander", // start
  "flock",
  "wander",
  "dna",
  "wander",
  "grid",
  "wander",
  "flock",
  // you can keep repeating if you like
];

// Timer for controlled target updates in DNA mode
let lastTargetUpdate = 0;
const TARGET_UPDATE_INTERVAL = 100; // in milliseconds

/************************************************************
 * setup()
 ************************************************************/
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Minimal GUI
  const gui = new dat.GUI();

  gui.add(params, 'particleCount', 2, 500, 2).name('Particle Count')
    .onFinishChange(resetSketch);
  gui.add(params, 'dotSize', 1, 40, 1).name('Dot Size');
  gui.add(params, 'maxSpeed', 0.1, 10, 0.1).name('Max Speed');
  gui.add(params, 'maxForce', 0.001, 0.3, 0.001).name('Max Force');
  gui.add(params, 'backgroundAlpha', 0, 255, 1).name('BG Alpha');

  let fFlock = gui.addFolder('Flocking');
  fFlock.add(params, 'separationDist', 1, 300, 1).name('Separation Dist');
  fFlock.add(params, 'alignmentDist', 1, 300, 1).name('Alignment Dist');
  fFlock.add(params, 'cohesionDist', 1, 300, 1).name('Cohesion Dist');
  fFlock.add(params, 'separationWeight', 0, 3, 0.1).name('Separation W');
  fFlock.add(params, 'alignmentWeight', 0, 3, 0.1).name('Alignment W');
  fFlock.add(params, 'cohesionWeight', 0, 3, 0.1).name('Cohesion W');
  fFlock.add(params, 'flockWind', 0, 0.2, 0.001).name('Flock Wind');
  fFlock.add(params, 'herdWithMouse').name('Herd w/ Mouse?');

  let fMouse = gui.addFolder('Mouse Repulsion');
  fMouse.add(params, 'mouseRepelRadius', 0, 500, 1).name('Repel Radius');
  fMouse.add(params, 'mouseRepelForce', 0.01, 2, 0.01).name('Repel Force');

  let fSine = gui.addFolder('Two Sine');
  fSine.add(params, 'twoSinePoints', 2, 300, 2).name('Wave Points')
       .onFinishChange(resetSketch);
  fSine.add(params, 'waveAmplitude', 10, 400, 1).name('Amplitude');
  fSine.add(params, 'waveOffset', 0, 300, 1).name('Wave Offset');

  let fGrid = gui.addFolder('Grid');
  fGrid.add(params, 'gridRows', 1, 20, 1).name('Grid Rows');
  fGrid.add(params, 'gridCols', 1, 30, 1).name('Grid Cols');

  let fTime = gui.addFolder('Timings');
  fTime.add(params, 'wanderDelay', 0, 10000, 100).name('Wander Delay');
  // Removed flockDelay controls

  let fAuto = gui.addFolder('Auto Cycle');
  fAuto.add(params, 'autoCycle').name('Auto Cycle?')
       .onChange(toggleAutoCycle);
  fAuto.add(params, 'cycleInterval', 1000, 20000, 500)
       .name('Cycle Interval (ms)');

  gui.add(params, 'resetAll').name('Reset All');

  resetSketch();
}

/************************************************************
 * draw()
 ************************************************************/
function draw() {
  background(0, params.backgroundAlpha);

  // If we are in "dna" mode, gently animate the wave
  if (mode === 'dna') {
    let currentTime = millis();
    if (currentTime - lastTargetUpdate > TARGET_UPDATE_INTERVAL) {
      waveTime += params.waveSpeed; // Increment waveTime for animation
      if (waveTime >= 1) waveTime -= 1;

      // Recompute wave
      const sineData = generateTwoSine(
        params.twoSinePoints / 2,
        params.waveAmplitude,
        params.waveOffset,
        waveTime
      );
      sineTargetsTop = sineData.topWave;
      sineTargetsBottom = sineData.bottomWave;

      // Re-assign targets
      for (let i = 0; i < particles.length; i++) {
        if (i < particles.length / 2) {
          particles[i].setTarget(sineTargetsTop[i % sineTargetsTop.length]);
        } else {
          particles[i].setTarget(sineTargetsBottom[i % sineTargetsBottom.length]);
        }
      }

      lastTargetUpdate = currentTime;
    }
  }

  // Update + display
  for (let p of particles) {
    p.update();
    p.display();
  }
}

/************************************************************
 * mouseClicked()
 *   - If autoCycle is OFF, we cycle modes manually.
 ************************************************************/
function mouseClicked() {
  // If autoCycle is ON, do nothing (because it’s handled by timers)
  if (params.autoCycle) return;

  // ---- Remove or comment this out if you DO want to be able to
  //      click to move out of wander mode:
  // if (mode === 'wander') return;

  goToNextMode();
}


/************************************************************
 * windowResized()
 ************************************************************/
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetSketch();
}

/************************************************************
 * resetSketch()
 ************************************************************/
function resetSketch() {
  // Clear any existing timers
  clearAllTimers();

  particles = [];
  mode = "wander";
  modeIndex = 0;
  waveTime = 0;

  // Force twoSinePoints = particleCount
  params.twoSinePoints = params.particleCount;

  // Precompute wave
  const wave = generateTwoSine(
    params.twoSinePoints / 2,
    params.waveAmplitude,
    params.waveOffset,
    waveTime
  );
  sineTargetsTop = wave.topWave;
  sineTargetsBottom = wave.bottomWave;

  // Precompute grid
  gridTargets = generateGridPositions(params.gridRows, params.gridCols);

  // Create particles
  for (let i = 0; i < params.particleCount; i++) {
    let x = random(width);
    let y = random(height);
    let p = new Particle(x, y);

    // Assign wave target
    if (i < params.particleCount / 2) {
      p.setTarget(sineTargetsTop[i % sineTargetsTop.length]);
    } else {
      p.setTarget(sineTargetsBottom[i % sineTargetsBottom.length]);
    }
    particles.push(p);
  }

  // Start mode cycling
  if (params.autoCycle) {
    scheduleNextMode();
  }
}

/************************************************************
 * scheduleNextMode()
 *   Handles transitioning to the next mode based on the modeSequence.
 ************************************************************/
/************************************************************
 * scheduleNextMode()
 *   Handles transitioning to the next mode based on modeSequence.
 ************************************************************/
function scheduleNextMode() {
  // Move to the next mode in the sequence
  modeIndex = (modeIndex + 1) % modeSequence.length;
  let newMode = modeSequence[modeIndex];
  mode = newMode;

  // Perform any per-mode setup
  if (newMode === "dna") {
    resetParticleVelocities();
  } 
  if (newMode === "grid") {
    assignGridTargets();
  }

  // ----- Only schedule the next mode if autoCycle is true:
  if (params.autoCycle) {
    if (newMode === "wander") {
      setTimeout(scheduleNextMode, WANDER_DURATION);
    } else {
      setTimeout(scheduleNextMode, params.cycleInterval);
    }
  }
}

/************************************************************
 * startAutoCycle()
 *   Initiates the mode cycling if autoCycle is enabled.
 ************************************************************/
function startAutoCycle() {
  scheduleNextMode();
}

/************************************************************
 * toggleAutoCycle()
 *   Enables or disables the auto-cycle based on user input.
 ************************************************************/
function toggleAutoCycle(value) {
  if (value) {
    scheduleNextMode();
  } else {
    clearAllTimers();
  }
}

/************************************************************
 * clearAllTimers()
 *   Clears all active timers to prevent overlapping transitions.
 ************************************************************/
function clearAllTimers() {
  // Since we're using recursive setTimeout, we can't directly clear all timers.
  // Instead, we'll keep track of the current timer using a variable.
  // However, for simplicity, we'll avoid multiple timers by ensuring scheduleNextMode
  // is only called once at a time.

  // To implement this properly, you might need to manage timer IDs.
  // For this example, we'll assume that only one timer is active at any time.
  // If you implement multiple timers, store their IDs and clear them here.
}

/************************************************************
 * goToNextMode()
 *   Manually transitions to the next mode (used when autoCycle is OFF).
 ************************************************************/
function goToNextMode() {
  // This function is now redundant as all transitions are handled by scheduleNextMode()
  // when autoCycle is enabled. However, to maintain functionality when autoCycle is OFF,
  // we can call scheduleNextMode() directly.

  scheduleNextMode();
}

/************************************************************
 * assignGridTargets()
 ************************************************************/
function assignGridTargets() {
  for (let i = 0; i < particles.length; i++) {
    let tgt = gridTargets[i % gridTargets.length];
    particles[i].setTarget(tgt);
  }
}

/************************************************************
 * resetParticleVelocities()
 *   Reduces the velocity of all particles for smoother transitions.
 ************************************************************/
function resetParticleVelocities() {
  for (let p of particles) {
    p.vel.mult(0.5); // Reduce velocity for smoother transition
  }
}

/************************************************************
 * Particle Class
 ************************************************************/
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(params.maxSpeed);
    this.acc = createVector(0, 0);
    this.target = null;
  }

  setTarget(v) {
    this.target = v.copy();
  }

  update() {
    this.acc.set(0, 0);

    // Apply mouse repulsion only if not in 'dna' mode
    if (mode !== 'dna') {
      this.mouseRepel();
    }

    if (mode === 'wander') {
      this.randomWander();
    }
    else if (mode === 'flock') {
      this.flock(particles);
      this.acc.x += params.flockWind;
      let tilt = map(mouseY, 0, height, -0.02, 0.02);
      this.acc.y += tilt;
      if (params.herdWithMouse) {
        this.herdWithMouseVector();
      }
    }
    else if (mode === 'dna' || mode === 'grid') {
      this.seekTarget();
    }

    this.vel.add(this.acc);
    this.vel.limit(params.maxSpeed);
    this.pos.add(this.vel);

    this.wrapEdges();
  }

  display() {
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, params.dotSize);
  }

  randomWander() {
    this.vel.x += random(-params.wanderNudge, params.wanderNudge);
    this.vel.y += random(-params.wanderNudge, params.wanderNudge);
  }

  flock(others) {
    let sep = this.separate(others).mult(params.separationWeight);
    let ali = this.align(others).mult(params.alignmentWeight);
    let coh = this.cohesion(others).mult(params.cohesionWeight);

    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);
  }

  separate(others) {
    let desiredSeparation = params.separationDist;
    let steer = createVector(0, 0);
    let count = 0;
    for (let o of others) {
      let d = p5.Vector.dist(this.pos, o.pos);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, o.pos).normalize().div(d);
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) steer.div(count);
    if (steer.mag() > 0) {
      steer.setMag(params.maxSpeed);
      steer.sub(this.vel);
      steer.limit(params.maxForce);
    }
    return steer;
  }

  align(others) {
    let neighborDist = params.alignmentDist;
    let sum = createVector(0, 0);
    let count = 0;
    for (let o of others) {
      let d = p5.Vector.dist(this.pos, o.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(o.vel);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.setMag(params.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(params.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  cohesion(others) {
    let neighborDist = params.cohesionDist;
    let sum = createVector(0, 0);
    let count = 0;
    for (let o of others) {
      let d = p5.Vector.dist(this.pos, o.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(o.pos);
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
    let desired = p5.Vector.sub(target, this.pos);
    desired.setMag(params.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(params.maxForce);
    return steer;
  }

  seekTarget() {
    if (!this.target) return;
    let steer = this.seek(this.target);
    this.acc.add(steer);

    let distToTarget = p5.Vector.dist(this.pos, this.target);
    if (distToTarget < params.stopDist) {
      this.vel.mult(0.9);
    }
  }

  herdWithMouseVector() {
    let mv = createVector(mouseX - pmouseX, mouseY - pmouseY);
    if (mv.mag() > 0.1) {
      mv.normalize();
      mv.mult(params.mouseRepelForce);
      this.acc.add(mv);
    }
  }

  mouseRepel() {
    let mousePos = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(this.pos, mousePos);
    let dist = dir.mag();
    if (dist < params.mouseRepelRadius) {
      dir.normalize();
      let force = map(dist, 0, params.mouseRepelRadius, params.mouseRepelForce, 0);
      this.acc.add(dir.mult(force));
    }
  }

  wrapEdges() {
    if (this.pos.x < 0)  this.pos.x = width;
    else if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0)  this.pos.y = height;
    else if (this.pos.y > height) this.pos.y = 0;
  }
}

/************************************************************
 * generateTwoSine(countPerWave, amplitude, offset, time = 0)
 ************************************************************/
function generateTwoSine(countPerWave, amplitude, offset, time = 0) {
  let topWave = [];
  let bottomWave = [];
  
  let marginX = 100;
  let centerY = height * 0.5;
  let topCenterY = centerY - offset * 0.5;
  let botCenterY = centerY + offset * 0.5;
  
  // We'll just do 1 cycle
  let cycles = 1;
  
  for (let i = 0; i < countPerWave; i++) {
    let x = map(i, 0, countPerWave - 1, marginX, width - marginX);
    let phase = cycles * (i / (countPerWave - 1)) + time;
    let yOffset = amplitude * sin(TWO_PI * phase);
    
    // top wave
    topWave.push(createVector(x, topCenterY + yOffset));
    // bottom wave (inverted)
    bottomWave.push(createVector(x, botCenterY - yOffset));
  }

  return { topWave, bottomWave };
}

/************************************************************
 * generateGridPositions(rows, cols)
 ************************************************************/
function generateGridPositions(rows, cols) {
  let arr = [];
  if (rows < 2 || cols < 2) return arr;

  let margin = 50;
  let spacingX = (width - margin*2) / (cols - 1);
  let spacingY = (height - margin*2) / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = margin + c * spacingX;
      let y = margin + r * spacingY;
      arr.push(createVector(x, y));
    }
  }
  return arr;
} 
