// js/main.js
import {
  STATES,
  DEBUG_SINGLE_STATE_MODE,
  DEBUG_STATE,
  PARAMS
} from './constants.js';
import Particle from './Particle.js';
import LoadingState from './states/LoadingState.js';
import GridState from './states/GridState.js';
import DNAState from './states/DNAState.js';
import FlockState from './states/FlockState.js';
import {
  handleTouchStarted,
  handleTouchMoved,
  handleTouchEnded,
  touchPositions
} from './interactions.js';

let particles = [];
let currentState;
let stateInstance;
let stateStartTime = 0;

// --------------------------------------------------------
// State Management Functions
// --------------------------------------------------------
function transitionToState(newState) {
  if (stateInstance && stateInstance.exit) {
    stateInstance.exit();
  }

  switch (newState) {
    case STATES.LOADING:
      stateInstance = new LoadingState(particles, transitionToState);
      break;
    case STATES.GRID:
      stateInstance = new GridState(particles, transitionToState);
      break;
    case STATES.DNA:
      stateInstance = new DNAState(particles, transitionToState);
      break;
    case STATES.FLOCK:
      stateInstance = new FlockState(particles, transitionToState);
      break;
    default:
      console.error(`Unknown state: ${newState}`);
      return;
  }

  currentState = newState;
  stateInstance.enter();
  stateStartTime = millis();
}

function checkStateTransition() {
  if (DEBUG_SINGLE_STATE_MODE) return;

  const timeInState = millis() - stateStartTime;
  const duration = PARAMS.stateDuration[currentState];

  if (timeInState >= duration) {
    let nextState;
    if (currentState === STATES.LOADING) {
      nextState = STATES.GRID;
    } else if (currentState === STATES.FLOCK) {
      // Loop back to GRID after FLOCK
      nextState = STATES.GRID;
    } else {
      const states = [STATES.GRID, STATES.DNA, STATES.FLOCK];
      const currentIndex = states.indexOf(currentState);
      nextState = states[(currentIndex + 1) % states.length];
    }
    transitionToState(nextState);
  }
}

// --------------------------------------------------------
// p5.js Lifecycle Functions
// --------------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  // Initialize particles
  particles = [];
  for (let i = 0; i < PARAMS.particleCount; i++) {
    // Avoid corners by 20px or so
    let x = random(20, width - 20);
    let y = random(20, height - 20);
    particles.push(new Particle(x, y));
  }

  if (DEBUG_SINGLE_STATE_MODE) {
    transitionToState(DEBUG_STATE);
  } else {
    transitionToState(STATES.LOADING);
  }

  frameRate(60);
}

function draw() {
  background(0, currentState === STATES.FLOCK ? PARAMS.backgroundAlpha : 255);

  // Update based on current state
  if (stateInstance && stateInstance.update) {
    stateInstance.update();
  }

  // Update and Display Particles
  for (let p of particles) {
    p.update(currentState, touchPositions);
    p.display(currentState);
  }

  // Handle State Transitions
  checkStateTransition();

  // (Optional) Visual feedback for touch
  // if (PARAMS.MOBILE && touchPositions.length > 0) {
  //   noFill();
  //   stroke(255, 100);
  //   strokeWeight(2);
  //   for (let t of touchPositions) {
  //     circle(t.x, t.y, PARAMS.mouseRepelRadius * 2);
  //   }
  // }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recompute margins and boundaries
  PARAMS.topMargin = window.innerHeight / 20;
  PARAMS.bottomMargin = window.innerHeight / 20;
  PARAMS.boundaryMargin = window.innerHeight / 20;
  PARAMS.topBoundary = window.innerHeight * 0.15;
  PARAMS.bottomBoundary = PARAMS.MOBILE
    ? window.innerHeight * 0.3
    : window.innerHeight * 0.15;

  // Reinitialize based on current state
  if (!DEBUG_SINGLE_STATE_MODE && stateInstance && stateInstance.enter) {
    stateInstance.enter();
  }
}

function touchStarted() {
  return handleTouchStarted();
}

function touchMoved() {
  return handleTouchMoved();
}

function touchEnded() {
  return handleTouchEnded();
}

// Attach p5.js lifecycle functions to global scope
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.touchStarted = touchStarted;
window.touchMoved = touchMoved;
window.touchEnded = touchEnded;
