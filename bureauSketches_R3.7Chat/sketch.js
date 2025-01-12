// --------------------------------------------------------
// Animation States
// --------------------------------------------------------
const STATES = {
  LOADING: 'loading',
  GRID: 'grid',
  DNA: 'dna',
  FLOCK: 'flock'
};

// --------------------------------------------------------
// MOBILE DETECTION
// --------------------------------------------------------
const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --------------------------------------------------------
// DEBUG / Prototyping
// --------------------------------------------------------
const DEBUG_SINGLE_STATE_MODE = false;
// const DEBUG_SINGLE_STATE_MODE = true;
const DEBUG_STATE = STATES.FLOCK; // e.g., STATES.GRID, STATES.DNA, STATES.FLOCK

// --------------------------------------------------------
// Global Parameters
// --------------------------------------------------------
const PARAMS = {
  // Particle Configuration
  particleCount: MOBILE ? 48 : 72, // Adjust if needed
  dotSize: MOBILE ? 20 : 10,
  particleColor: 255,
  maxSpeed: MOBILE ? 6 : 4,
  maxForce: 0.2,

  // Margins/Paddings
  topMargin: window.innerHeight / 20,
  bottomMargin: window.innerHeight / 20,

  // Loading Animation Parameters
  loadingRotations: 1.5,
  loadingRotationSpeed: 0.05,
  loadingDistance: MOBILE ? 25 : 15,
  loadingDuration: 3000,

  // State Durations (in milliseconds)
  stateDuration: {
    loading: 3000,
    grid: 7000,
    dna: 12000,
    flock: 5000
  },

  // Flocking Parameters
  backgroundAlpha: 120,
  flockWind: 0.05,

  // Mouse Interaction
  mouseRepelForce: MOBILE ? 2.5 : 1,        // Increased for mobile
  mouseRepelRadius: MOBILE ? 300 : 200,     // Expanded for mobile
  mouseRepelExponent: MOBILE ? 1.5 : 2,    // Adjusted for smoother falloff on mobile
  mouseMinSpeed: MOBILE ? 2.5 : 1,          // Increased for more responsive feel on mobile

  // Boundaries
  boundaryMargin: window.innerHeight / 20,
  topBoundary: window.innerHeight * 0.15,
  bottomBoundary: MOBILE ? window.innerHeight * 0.3 : window.innerHeight * 0.15,
  boundaryForce: 0.8,

  // Trail Parameters
  trailParams: {
    maxLengthGrid: 25,
    baseOpacityGrid: 35,
    fadeRateGrid: 0.92,
    maxLengthFlock: 20,
    baseOpacityFlock: 30,
    fadeRateFlock: 0.95
  },

  // Flocking Behavior Parameters
  flockParams: {
    separationDist: 300,
    alignmentDist: 300,
    cohesionDist: 300,
    separationForce: 2.0,
    alignmentForce: 1.5,
    cohesionForce: 0.5
  },

  // Trail Transition Timing for FLOCK
  trailTransition: {
    startFadeAt: 0.8,
    fadeDuration: 0.2
  },

  // DNA Specific Parameters
  dnaParams: {
    cycles: MOBILE ? 0.5 : 1,            // Reduced cycles on mobile
    waveOffset: 0,
    waveAmplitude: MOBILE ? 300 : 300,  // Adjusted amplitude for mobile
    animationSpeed: 0.15,
    waveSpeed: 0.03,
    rotationSpeed: 10.4
  }
};

// Array to store particles
let particles = [];
let currentState = STATES.LOADING;
let stateStartTime = 0;
let loadingRotation = 0;
let loadingComplete = false;
let loadingPhase = 'rotate';

// --------------------------------------------------------
// Touch Interaction Variables
// --------------------------------------------------------
let touchPositions = []; // Array to store active touch points

// --------------------------------------------------------
// Particle Class
// --------------------------------------------------------
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.target = null;
    this.trail = [];
    this.alpha = 255;
    this.lastState = null;
  }

  setTarget(x, y) {
    this.target = createVector(x, y);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let dist = desired.mag();

    if (currentState === STATES.DNA) {
      // Gentler slowdown in DNA mode
      if (dist < 50) {
        let speed = map(dist, 0, 50, PARAMS.maxSpeed * 0.1, PARAMS.maxSpeed);
        desired.setMag(speed);
      } else {
        desired.setMag(PARAMS.maxSpeed);
      }
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(PARAMS.maxForce * 0.5);
      return steer;
    } else {
      // Normal seek behavior
      if (dist < 100) {
        let speed = map(dist, 0, 100, 0, PARAMS.maxSpeed);
        desired.setMag(speed);
      } else {
        desired.setMag(PARAMS.maxSpeed);
      }
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(PARAMS.maxForce);
      return steer;
    }
  }

  update() {
    // Mouse Repulsion (excluding LOADING state)
    if (currentState !== STATES.LOADING) {
      let repulsionPoints = MOBILE ? touchPositions : [createVector(mouseX, mouseY)];
      
      for (let point of repulsionPoints) {
        let distanceToPoint = p5.Vector.dist(this.pos, point);
        if (distanceToPoint < PARAMS.mouseRepelRadius) {
          let repelForce = p5.Vector.sub(this.pos, point);
          repelForce.normalize();
          let strength = pow(1 - distanceToPoint / PARAMS.mouseRepelRadius, PARAMS.mouseRepelExponent);
          repelForce.mult(PARAMS.mouseRepelForce * strength);
          this.vel.add(repelForce);
          this.vel.setMag(max(this.vel.mag(), PARAMS.mouseMinSpeed));
          
          // Add extra immediate boost for mobile touch
          if (MOBILE) {
            this.vel.mult(1.2); // Additional velocity boost on mobile
          }
        }
      }
    }

    // Add Trails
    this.addTrail(
      currentState === STATES.GRID
        ? PARAMS.trailParams.maxLengthGrid
        : currentState === STATES.FLOCK
        ? PARAMS.trailParams.maxLengthFlock
        : 0
    );

    // Update velocity and position
    this.vel.add(this.acc);
    this.vel.limit(PARAMS.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    // Flocking Boundaries
    if (currentState === STATES.FLOCK) {
      if (this.pos.y < PARAMS.topBoundary) {
        this.acc.add(createVector(0, PARAMS.boundaryForce * 0.5));
      } else if (this.pos.y > height - PARAMS.bottomBoundary) {
        this.acc.add(createVector(0, -PARAMS.boundaryForce * 0.5));
      }
    }

    // Horizontal Wrap-Around
    if (this.pos.x < 0) {
      this.pos.x = width;
    } else if (this.pos.x > width) {
      this.pos.x = 0;
    }
  }

  display() {
    // Calculate Fade Multiplier for FLOCK state
    let fadeMultiplier = 1;
    if (currentState === STATES.FLOCK) {
      const timeInFlockState = (millis() - stateStartTime) / PARAMS.stateDuration.flock;
      if (timeInFlockState > PARAMS.trailTransition.startFadeAt) {
        fadeMultiplier = map(
          timeInFlockState,
          PARAMS.trailTransition.startFadeAt,
          1,
          1,
          0,
          true
        );
      }
    }

    // Draw Trails in GRID or FLOCK states
    if (this.trail.length > 1 && (currentState === STATES.FLOCK || currentState === STATES.GRID)) {
      beginShape();
      noFill();
      for (let i = 0; i < this.trail.length; i++) {
        const trailAlpha = map(
          i,
          0,
          this.trail.length - 1,
          this.alpha * (currentState === STATES.GRID ? PARAMS.trailParams.baseOpacityGrid : PARAMS.trailParams.baseOpacityFlock) / 100 * fadeMultiplier,
          0
        );
        stroke(255, trailAlpha);
        strokeWeight(PARAMS.dotSize * 0.3);
        vertex(this.trail[i].x, this.trail[i].y);
      }
      endShape();
    }

    // Draw Main Particle
    noStroke();
    fill(PARAMS.particleColor, this.alpha);
    circle(this.pos.x, this.pos.y, PARAMS.dotSize);
  }

  addTrail(maxLength) {
    if (currentState === STATES.FLOCK || currentState === STATES.GRID) {
      this.trail.unshift(this.pos.copy());
      if (this.trail.length > maxLength) {
        this.trail.pop();
      }
    }
  }

  // Flocking Behaviors
  flock(particles) {
    let separation = this.separate(particles);
    let alignment = this.align(particles);
    let cohesion = this.cohesion(particles);

    separation.mult(PARAMS.flockParams.separationForce);
    alignment.mult(PARAMS.flockParams.alignmentForce);
    cohesion.mult(PARAMS.flockParams.cohesionForce);

    // Optional Wind Force
    let wind = createVector(PARAMS.flockWind, 0);
    this.applyForce(wind);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  separate(particles) {
    let desiredSeparation = PARAMS.flockParams.separationDist;
    let sum = createVector();
    let count = 0;

    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        sum.add(diff);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(PARAMS.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(PARAMS.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  align(particles) {
    let neighborDist = PARAMS.flockParams.alignmentDist;
    let sum = createVector();
    let count = 0;

    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(PARAMS.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(PARAMS.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  cohesion(particles) {
    let neighborDist = PARAMS.flockParams.cohesionDist;
    let sum = createVector();
    let count = 0;

    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      return this.seek(sum);
    }
    return createVector(0, 0);
  }
}

// --------------------------------------------------------
// Initialization for Each State
// --------------------------------------------------------

// LOADING State Initialization
function initializeLoadingParticles() {
  const centerX = width / 2;
  const centerY = height / 2;
  particles = [];

  // Two visible particles for the loading animation
  particles.push(new Particle(centerX, centerY - PARAMS.loadingDistance));
  particles.push(new Particle(centerX, centerY + PARAMS.loadingDistance));

  // Remaining particles start invisible
  for (let i = 2; i < PARAMS.particleCount; i++) {
    const p = new Particle(centerX, centerY);
    p.alpha = 0;
    particles.push(p);
  }

  loadingPhase = 'rotate';
  loadingRotation = 0;
  loadingComplete = false;
}

// GRID State Initialization
function initializeGridParticles() {
  const cols = MOBILE ? 4 : ceil(sqrt(PARAMS.particleCount * 2));
  const rows = ceil(PARAMS.particleCount / cols);

  const marginX = 100;
  const marginY = 0;
  const gridHeight = height - 200 - 200; // Extra margins
  const spacingX = (width - 2 * marginX) / max(cols - 1, 1);
  const spacingY = gridHeight / max(rows - 1, 1);

  for (let i = 0; i < particles.length; i++) {
    const col = i % cols;
    const row = floor(i / cols);
    const x = marginX + col * spacingX;
    const y = 200 + row * spacingY + marginY;
    particles[i].setTarget(x, y);
    particles[i].alpha = 255;
  }
}

// DNA Wave Generation Function
function generateTwoSine(time = 0) {
  let topWave = [];
  let bottomWave = [];

  const marginX = 100;
  const centerY = height * 0.5;
  const points = floor(PARAMS.particleCount / 2);
  const { cycles, waveOffset, waveAmplitude } = PARAMS.dnaParams;

  for (let i = 0; i < points; i++) {
    const wavePhase = cycles * (i / (points - 1)) + time;
    const yOffset = waveAmplitude * sin(TWO_PI * wavePhase);

    const x = marginX + (i * (width - 2 * marginX) / (points - 1));
    topWave.push(createVector(x, centerY - waveOffset / 2 + yOffset));
    bottomWave.push(createVector(x, centerY + waveOffset / 2 - yOffset));
  }

  return { topWave, bottomWave };
}

// DNA State Initialization
function initializeDNAParticles() {
  const { topWave, bottomWave } = generateTwoSine(0);

  for (let i = 0; i < particles.length; i++) {
    if (i < floor(PARAMS.particleCount / 2)) {
      particles[i].setTarget(topWave[i].x, topWave[i].y);
    } else {
      const bottomIndex = i - floor(PARAMS.particleCount / 2);
      particles[i].setTarget(bottomWave[bottomIndex].x, bottomWave[bottomIndex].y);
    }
    particles[i].alpha = 255;
  }
}

// FLOCK State Initialization
function initializeFlockingParticles() {
  for (let p of particles) {
    p.vel = p5.Vector.random2D().mult(random(2, PARAMS.maxSpeed));
    p.trail = [];
    p.alpha = 255;
  }
}

// --------------------------------------------------------
// Update Logic for Each State
// --------------------------------------------------------

// LOADING State Update
function updateLoadingAnimation() {
  if (loadingComplete) return;

  const centerX = width / 2;
  const centerY = height / 2;
  loadingRotation += PARAMS.loadingRotationSpeed;

  if (loadingPhase === 'rotate') {
    // Vertical oscillation
    const yOffset = sin(loadingRotation) * PARAMS.loadingDistance;
    particles[0].pos.y = centerY - yOffset;
    particles[1].pos.y = centerY + yOffset;

    if (loadingRotation >= TWO_PI * PARAMS.loadingRotations) {
      loadingPhase = 'converge';
      loadingRotation = 0;
    }
  } else if (loadingPhase === 'converge') {
    loadingRotation += PARAMS.loadingRotationSpeed;

    // Move particles towards center
    particles[0].pos.y = lerp(particles[0].pos.y, centerY, 0.1);
    particles[1].pos.y = lerp(particles[1].pos.y, centerY, 0.1);

    // Fade in remaining particles
    const progress = min(1, loadingRotation / (PI * 0.5));
    if (progress > 0.5) {
      for (let i = 2; i < particles.length; i++) {
        particles[i].alpha = map(progress, 0.5, 1, 0, 255);
      }
    }

    // Transition to GRID state when loading is complete
    if (abs(particles[0].pos.y - centerY) < 1 && abs(particles[1].pos.y - centerY) < 1) {
      loadingComplete = true;
      transitionToState(STATES.GRID);
    }
  }
}

// GRID State Update
function updateGridFormation() {
  for (let p of particles) {
    if (p.target) {
      const force = p.seek(p.target);
      p.applyForce(force);
    }
  }
}

// DNA State Update
function updateDNAAnimation() {
  const time = millis() * 0.001 * PARAMS.dnaParams.waveSpeed;
  const { topWave, bottomWave } = generateTwoSine(time);

  for (let i = 0; i < particles.length; i++) {
    if (i < floor(PARAMS.particleCount / 2)) {
      particles[i].setTarget(topWave[i].x, topWave[i].y);
    } else {
      const bottomIndex = i - floor(PARAMS.particleCount / 2);
      particles[i].setTarget(bottomWave[bottomIndex].x, bottomWave[bottomIndex].y);
    }
    const force = particles[i].seek(particles[i].target);
    particles[i].applyForce(force);
  }
}

// FLOCK State Update
function updateFlocking() {
  for (let p of particles) {
    p.flock(particles);
  }
}

// --------------------------------------------------------
// State Management
// --------------------------------------------------------
function transitionToState(newState) {
  currentState = newState;
  stateStartTime = millis();

  // Clear trails when transitioning to DNA
  if (newState === STATES.DNA) {
    for (let p of particles) {
      p.trail = [];
    }
  }

  // Initialize particles based on new state
  switch (newState) {
    case STATES.GRID:
      initializeGridParticles();
      break;
    case STATES.DNA:
      initializeDNAParticles();
      break;
    case STATES.FLOCK:
      initializeFlockingParticles();
      break;
  }
}

function checkStateTransition() {
  if (DEBUG_SINGLE_STATE_MODE) return;
  if (currentState === STATES.LOADING && !loadingComplete) return;

  const timeInState = millis() - stateStartTime;
  const duration = PARAMS.stateDuration[currentState];

  if (timeInState >= duration) {
    const states = Object.values(STATES);
    const currentIndex = states.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    transitionToState(states[nextIndex]);
  }
}

// --------------------------------------------------------
// Touch Event Handling
// --------------------------------------------------------

// Handle touch start
function touchStarted() {
  // Prevent default behavior
  return false;
}

// Handle touch movement
function touchMoved() {
  // Update touch positions
  touchPositions = [];
  for (let i = 0; i < touches.length; i++) {
    touchPositions.push(createVector(touches[i].x, touches[i].y));
  }
  return false;
}

// Handle touch end
function touchEnded() {
  // Clear touch positions when touch ends
  touchPositions = [];
  return false;
}

// --------------------------------------------------------
// p5.js Setup & Draw
// --------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);

  if (DEBUG_SINGLE_STATE_MODE) {
    currentState = DEBUG_STATE;
    switch (currentState) {
      case STATES.LOADING:
        initializeLoadingParticles();
        break;
      case STATES.GRID:
        initializeLoadingParticles();
        initializeGridParticles();
        break;
      case STATES.DNA:
        initializeLoadingParticles();
        initializeDNAParticles();
        break;
      case STATES.FLOCK:
        initializeLoadingParticles();
        initializeFlockingParticles();
        break;
    }
    stateStartTime = millis();
  } else {
    // Normal flow starts with LOADING
    initializeLoadingParticles();
    stateStartTime = millis();
  }

  frameRate(60);
}

function draw() {
  background(0, currentState === STATES.FLOCK ? PARAMS.backgroundAlpha : 255);

  // Update based on current state
  switch (currentState) {
    case STATES.LOADING:
      updateLoadingAnimation();
      break;
    case STATES.GRID:
      updateGridFormation();
      break;
    case STATES.DNA:
      updateDNAAnimation();
      break;
    case STATES.FLOCK:
      updateFlocking();
      break;
  }

  // Update and Display Particles
  for (let p of particles) {
    p.update();
    p.display();
  }

  // Handle State Transitions
  checkStateTransition();

  // Visual feedback for touch points
  if (MOBILE && touchPositions.length > 0) {
    noFill();
    stroke(255, 100);
    strokeWeight(2);
    for (let touch of touchPositions) {
      circle(touch.x, touch.y, PARAMS.mouseRepelRadius * 2);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recompute margins and boundaries
  PARAMS.topMargin = window.innerHeight / 20;
  PARAMS.bottomMargin = window.innerHeight / 20;
  PARAMS.boundaryMargin = window.innerHeight / 20;
  PARAMS.topBoundary = window.innerHeight * 0.15;
  PARAMS.bottomBoundary = MOBILE ? window.innerHeight * 0.3 : window.innerHeight * 0.15;

  // Reinitialize based on current state
  if (!DEBUG_SINGLE_STATE_MODE) {
    switch (currentState) {
      case STATES.LOADING:
        initializeLoadingParticles();
        break;
      case STATES.GRID:
        initializeGridParticles();
        break;
      case STATES.DNA:
        initializeDNAParticles();
        break;
      case STATES.FLOCK:
        initializeFlockingParticles();
        break;
    }
  }
}
