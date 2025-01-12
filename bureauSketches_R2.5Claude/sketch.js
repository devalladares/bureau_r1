// Animation States
const STATES = {
  LOADING: 'loading',
  GRID: 'grid',
  DNA: 'dna',
  FLOCK: 'flock'
};

// DEBUG / Prototyping: Set this to true, pick a state below, and the sketch
// will remain in that single state indefinitely (no transitions).
const DEBUG_SINGLE_STATE_MODE = false;
// const DEBUG_SINGLE_STATE_MODE = true;

const DEBUG_STATE = STATES.FLOCK; // e.g., STATES.GRID, STATES.DNA, STATES.FLOCK

// DNA specific parameters (updated to simpler, more harmonious configuration)
const DNA_PARAMS = {
  cycles: 1,                  // Keep exactly 1 cycle
  waveOffset: 0,            // Vertical spacing between waves
  waveAmplitude: 300,         // Slightly reduced for better balance
  animationSpeed: 0.15,       // Slower animation for smoother movement
  waveSpeed: 0.03,            // Much slower wave speed for smoother motion
  rotationSpeed: 10.4          // Optional rotational speed factor
};

// Global parameters
const PARAMS = {
  particleCount: 50,           // Number of particles across all states
  maxSpeed: 4,                 // Maximum speed of particles
  maxForce: 0.2,               // Maximum steering force
  dotSize: 10,                 // Size of each particle
  particleColor: 255,          // Color of particles (white)
  
  // Margins/Paddings
  topMargin: window.innerHeight / 20,     // Default top padding (used in some states)
  bottomMargin: window.innerHeight / 20,  // Default bottom padding (used in some states)
  
  // Loading Animation Parameters
  loadingRotations: 1.5,           // Number of full rotations during loading "rotate" phase
  loadingRotationSpeed: 0.05,      // Speed of rotation during loading
  loadingDistance: 15,           
  loadingDuration: 3000,           // Duration of loading state in ms
  
  // State Durations (in milliseconds)
  stateDuration: {
    loading: 3000,
    grid: 7000,
    dna: 12000,
    flock: 5000
  },
  
  // For Flocking (background, wind, etc.)
  backgroundAlpha: 120,
  flockWind: 0.05,
  
  // Mouse Interaction
  mouseRepelForce: 1,       // **Increased** from 10
  mouseRepelRadius: 200,     // **Decreased** from 1200
  mouseRepelExponent: 2,     // **New**: makes force decay quadratically
  mouseMinSpeed: 1,          // **New**: minimum speed when repelling
  
  // Boundaries (vertical push)
  boundaryMargin: window.innerHeight / 20,
  topBoundary: window.innerHeight * 0.15,
  bottomBoundary: window.innerHeight * 0.15,
  boundaryForce: 0.8,
  
  // **Trail Parameters** (updated for longer and more subtle trails)
  trailParams: {
    // Grid
    maxLengthGrid: 25,     // **Increased** from 5
    baseOpacityGrid: 35,   // **Increased** from 20
    fadeRateGrid: 0.92,    // **Increased** from 0.8
    // Flock
    maxLengthFlock: 20,    // **Increased** from 3
    baseOpacityFlock: 30,  // **Increased** from 15
    fadeRateFlock: 0.95    // **Increased** from 0.9
  },
  
  // **Flocking Parameters** (updated as per latest instructions)
  flockParams: {
    separationDist: 300,    // Distance to check for separation
    alignmentDist: 300,     // Distance to check for alignment
    cohesionDist: 300,      // Distance to check for cohesion
    separationForce: 2.0,   // Weight of separation
    alignmentForce: 1.5,    // Weight of alignment
    cohesionForce: 0.5      // Weight of cohesion
  },
  
  // **DNA Parameters (Deprecated in favor of DNA_PARAMS)**
  // Removed complex wave shaping parameters
};



// Debug note: The DNA animation now uses pure sine waves for a more harmonious motion.

let particles = [];
let currentState = STATES.LOADING;
let stateStartTime = 0;
let loadingRotation = 0;
let loadingComplete = false;
let loadingPhase = 'rotate';

// Particle Class
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.target = null;
    this.trail = [];
    this.alpha = 255;
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

    // **Modified seek behavior for DNA mode**
    if (currentState === STATES.DNA) {
      // Much gentler slowdown
      if (dist < 50) {
        let speed = map(dist, 0, 50, PARAMS.maxSpeed * 0.1, PARAMS.maxSpeed);
        desired.setMag(speed);
      } else {
        desired.setMag(PARAMS.maxSpeed);
      }

      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(PARAMS.maxForce * 0.5);  // Gentler steering
      return steer;
    } else {
      // Original seek behavior for other modes
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
    // Apply Mouse Repulsion (not in LOADING)
    if (currentState !== STATES.LOADING) {
      let mouse = createVector(mouseX, mouseY);
      let distanceToMouse = p5.Vector.dist(this.pos, mouse);
      if (distanceToMouse < PARAMS.mouseRepelRadius) {
        let repelForce = p5.Vector.sub(this.pos, mouse);
        repelForce.normalize();
        // **Updated Mouse Repulsion with Quadratic Decay**
        let strength = pow(1 - distanceToMouse / PARAMS.mouseRepelRadius, PARAMS.mouseRepelExponent);
        repelForce.mult(PARAMS.mouseRepelForce * strength);
        this.vel.add(repelForce);
        this.vel.setMag(max(this.vel.mag(), PARAMS.mouseMinSpeed));
      }
    }

    // Trails (much longer now)
    if (currentState === STATES.GRID) {
      this.addTrail(PARAMS.trailParams.maxLengthGrid);
    } else if (currentState === STATES.FLOCK) {
      this.addTrail(PARAMS.trailParams.maxLengthFlock);
    }
    // (DNA or LOADING get no trails for clarity, but you can enable if you want.)

    // Update velocity & position
    this.vel.add(this.acc);
    this.vel.limit(PARAMS.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    // **Removed boundary constraints for DNA mode**
    // if (currentState === STATES.DNA || currentState === STATES.FLOCK) {
    //   this.applyBoundaryConstraints();
    // }

    // **Handle Flocking Boundaries with Softer Constraints**
    if (currentState === STATES.FLOCK) {
      if (this.pos.y < PARAMS.topBoundary) {
        // Add downward force when near top
        this.acc.add(createVector(0, PARAMS.boundaryForce * 0.5));
      } else if (this.pos.y > height - PARAMS.bottomBoundary) {
        // Add upward force when near bottom
        this.acc.add(createVector(0, -PARAMS.boundaryForce * 0.5));
      }
    }

    // Horizontal wrap-around (for all states)
    if (this.pos.x < 0) {
      this.pos.x = width;
    } else if (this.pos.x > width) {
      this.pos.x = 0;
    }
  }

  addTrail(maxLength) {
    // **Option A - Clear trails when transitioning to GRID or DNA**
    if (currentState === STATES.GRID || currentState === STATES.DNA) {
      this.trail = [];
      return;
    }
    
    // Normal trail behavior
    this.trail.unshift(this.pos.copy());
    if (this.trail.length > maxLength) {
      this.trail.pop();
    }
  }

  applyBoundaryConstraints() {
    // Top boundary
    if (this.pos.y < PARAMS.topBoundary) {
      this.vel.y *= -0.5;
      let centerForce = createVector(0, PARAMS.boundaryForce);
      this.applyForce(centerForce);
    }
    // Bottom boundary
    else if (this.pos.y > height - PARAMS.bottomBoundary) {
      this.vel.y *= -0.5;
      let centerForce = createVector(0, -PARAMS.boundaryForce);
      this.applyForce(centerForce);
    }
  }

  display() {
    // **Option A - Draw trails only in FLOCK state**
    if (this.trail.length > 1 && currentState === STATES.FLOCK) {
      beginShape();
      noFill();
      for (let i = 0; i < this.trail.length; i++) {
        const trailAlpha = map(
          i,
          0,
          this.trail.length - 1,
          this.alpha * (PARAMS.trailParams.baseOpacityFlock / 100),
          0
        );
        stroke(255, trailAlpha);
        strokeWeight(PARAMS.dotSize * 0.3);
        vertex(this.trail[i].x, this.trail[i].y);
      }
      endShape();
    }

    // Draw main particle
    noStroke();
    fill(PARAMS.particleColor, this.alpha);
    circle(this.pos.x, this.pos.y, PARAMS.dotSize);
  }

  // Flocking behaviors
  flock(particles) {
    let separation = this.separate(particles);
    let alignment = this.align(particles);
    let cohesion = this.cohesion(particles);
    
    // **Updated Flocking Weights for Grid-like Flocking**
    separation.mult(PARAMS.flockParams.separationForce);  // Updated from 2.0
    alignment.mult(PARAMS.flockParams.alignmentForce);    // Updated from 1.5
    cohesion.mult(PARAMS.flockParams.cohesionForce);      // Updated from 0.5
    
    // Optional wind
    let wind = createVector(PARAMS.flockWind, 0);
    this.applyForce(wind);
    
    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  separate(particles) {
    let desiredSeparation = PARAMS.flockParams.separationDist;  // Updated from 50 to 300
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
    let neighborDist = PARAMS.flockParams.alignmentDist;  // Updated from 50 to 300
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
    let neighborDist = PARAMS.flockParams.cohesionDist;  // Updated from 50 to 300
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

// -- Initialization for each state --

// LOADING
function initializeLoadingParticles() {
  const centerX = width / 2;
  const centerY = height / 2;
  particles = [];
  
  // Two visible particles for the loading animation
  particles.push(new Particle(centerX, centerY - PARAMS.loadingDistance));
  particles.push(new Particle(centerX, centerY + PARAMS.loadingDistance));
  
  // Remaining invisible particles
  for (let i = 2; i < PARAMS.particleCount; i++) {
    const p = new Particle(centerX, centerY);
    p.alpha = 0; 
    particles.push(p);
  }
  
  loadingPhase = 'rotate';
  loadingRotation = 0;
  loadingComplete = false;
}

// GRID
function initializeGridParticles() {
  // More vertical margins for the grid to create extra whitespace at top & bottom
  const extraTopMargin = 200;    // Adjust to your liking
  const extraBottomMargin = 200; // Adjust to your liking
  
  // Calculate how many columns/rows
  const cols = ceil(sqrt(PARAMS.particleCount * 2));
  const rows = ceil(PARAMS.particleCount / cols);
  
  // Margins
  const marginX = 100;
  const marginY = 0; // We'll handle top/bottom with extraTop/extraBottom
  // Effective spacing
  const gridHeight = height - extraTopMargin - extraBottomMargin;
  const spacingX = (width - 2 * marginX) / max(cols - 1, 1);
  const spacingY = gridHeight / max(rows - 1, 1);

  for (let i = 0; i < particles.length; i++) {
    const col = i % cols;
    const row = floor(i / cols);
    const x = marginX + col * spacingX;
    const y = extraTopMargin + row * spacingY + marginY;
    particles[i].setTarget(x, y);
    particles[i].alpha = 255;
  }
}

// Simplified generateTwoSine function as per instructions
function generateTwoSine(time = 0) {
  let topWave = [];
  let bottomWave = [];

  const marginX = 100;
  const centerY = height * 0.5;  // Perfect center
  const points = floor(PARAMS.particleCount / 2);
  
  // Ensure exact same wave dimensions for top and bottom
  for (let i = 0; i < points; i++) {
    // Precise x positioning
    const x = marginX + (i * (width - 2 * marginX) / (points - 1));
    
    // Calculate single wave offset - EXACTLY the same for both waves
    const phase = (i / (points - 1)) + time;
    const yOffset = DNA_PARAMS.waveAmplitude * sin(TWO_PI * phase);
    
    // Perfect mirroring - use exact same offset distance for both
    topWave.push(createVector(x, centerY - DNA_PARAMS.waveOffset / 2 + yOffset));
    bottomWave.push(createVector(x, centerY + DNA_PARAMS.waveOffset / 2 - yOffset)); // Note the minus yOffset here
  }

  return { topWave, bottomWave };
}

// DNA
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

// FLOCK
function initializeFlockingParticles() {
  for (let p of particles) {
    p.vel = p5.Vector.random2D().mult(random(2, PARAMS.maxSpeed));
    p.trail = [];
    p.alpha = 255;
  }
}

// -- Update logic for each state --

// LOADING
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

    // Check if rotation phase is complete
    if (loadingRotation >= TWO_PI * PARAMS.loadingRotations) {
      loadingPhase = 'converge';
      loadingRotation = 0;
    }
  } else if (loadingPhase === 'converge') {
    loadingRotation += PARAMS.loadingRotationSpeed;

    // Move top/bottom particles toward center
    particles[0].pos.y = lerp(particles[0].pos.y, centerY, 0.1);
    particles[1].pos.y = lerp(particles[1].pos.y, centerY, 0.1);

    // Fade in others
    const progress = min(1, loadingRotation / (PI * 0.5));
    if (progress > 0.5) {
      for (let i = 2; i < particles.length; i++) {
        particles[i].alpha = map(progress, 0.5, 1, 0, 255);
      }
    }

    // Done?
    if (abs(particles[0].pos.y - centerY) < 1 && abs(particles[1].pos.y - centerY) < 1) {
      loadingComplete = true;
      transitionToState(STATES.GRID);
    }
  }
}

// GRID
function updateGridFormation() {
  for (let p of particles) {
    if (p.target) {
      const force = p.seek(p.target);
      p.applyForce(force);
    }
  }
}

// Simplified DNA Animation Update Function
function updateDNAAnimation() {
  const time = millis() * 0.001 * DNA_PARAMS.waveSpeed;
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

// FLOCK
function updateFlocking() {
  for (let p of particles) {
    p.flock(particles);
  }
}

// -- State Management --
function transitionToState(newState) {
  currentState = newState;
  stateStartTime = millis();

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
  // If we're in DEBUG SINGLE State mode, skip transitions.
  if (DEBUG_SINGLE_STATE_MODE) return;

  // Normal transition logic
  if (currentState === STATES.LOADING && !loadingComplete) return;
  
  const timeInState = millis() - stateStartTime;
  const duration = (currentState === STATES.LOADING)
    ? PARAMS.stateDuration.loading
    : PARAMS.stateDuration[currentState];

  if (timeInState >= duration) {
    const states = Object.values(STATES);
    const currentIndex = states.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    transitionToState(states[nextIndex]);
  }
}

// -- p5.js setup & draw --
function setup() {
  createCanvas(windowWidth, windowHeight);

  if (DEBUG_SINGLE_STATE_MODE) {
    // If debugging a single state, jump directly to that state
    currentState = DEBUG_STATE;
    if (currentState === STATES.LOADING) {
      initializeLoadingParticles();
    } else if (currentState === STATES.GRID) {
      initializeLoadingParticles(); // Ensure we have 'particles' array
      initializeGridParticles();
    } else if (currentState === STATES.DNA) {
      initializeLoadingParticles();
      initializeDNAParticles();
    } else if (currentState === STATES.FLOCK) {
      initializeLoadingParticles();
      initializeFlockingParticles();
    }
    stateStartTime = millis();
  } else {
    // Normal flow: start with LOADING
    initializeLoadingParticles();
    stateStartTime = millis();
  }

  frameRate(60);
}

function draw() {
  background(0, currentState === STATES.FLOCK ? PARAMS.backgroundAlpha : 255);

  // Update logic based on state
  switch(currentState) {
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

  // Update & Display
  for (let p of particles) {
    p.update();
    p.display();
  }

  // Check transitions unless debugging a single state
  checkStateTransition();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recompute bounding margins
  PARAMS.topMargin = window.innerHeight / 20;
  PARAMS.bottomMargin = window.innerHeight / 20;
  PARAMS.boundaryMargin = window.innerHeight / 20;
  PARAMS.topBoundary = window.innerHeight * 0.15;
  PARAMS.bottomBoundary = window.innerHeight * 0.15;
  
  // Re-initialize based on current state if not in debug single-state mode
  if (!DEBUG_SINGLE_STATE_MODE) {
    switch(currentState) {
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
