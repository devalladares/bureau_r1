// js/constants.js

// Animation States
export const STATES = {
  LOADING: 'loading',
  GRID: 'grid',
  DNA: 'dna',
  FLOCK: 'flock'
};

// Mobile Detection
export const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// DEBUG / Prototyping
// export const DEBUG_SINGLE_STATE_MODE = true; 
export const DEBUG_SINGLE_STATE_MODE = false; 

// export const DEBUG_STATE = STATES.GRID; // e.g., STATES.GRID, STATES.DNA, STATES.FLOCK
export const DEBUG_STATE = STATES.FLOCK; // e.g., STATES.GRID, STATES.DNA, STATES.FLOCK

// Global Parameters
export let PARAMS = {
  // Particle Configuration
  particleCount: MOBILE ? 50 : 72, // Adjust if needed
  dotSize: MOBILE ? 20 : 10,
  particleColor: 255,
  maxSpeed: MOBILE ? 7 : 5,
  maxForce: 2,

  // Margins/Paddings
  topMargin: window.innerHeight / 20,
  bottomMargin: window.innerHeight / 20,

  // State Durations (in milliseconds)
  stateDuration: {
    loading: 3000,
    grid: 12000,
    dna: 12000,
    flock: 12000
  },

  // Flocking / Visual
  backgroundAlpha: 255,
  flockWind: 0.3,

  // Mouse Interaction
  mouseRepelForce: MOBILE ? 20 : 20,
  mouseRepelRadius: MOBILE ? 400 : 300,
  mouseRepelExponent: MOBILE ? 5 : 5,
  mouseMinSpeed: MOBILE ? 5 : 5,

  // Boundaries
  boundaryMargin: window.innerHeight / 20,
  topBoundary: window.innerHeight * 0.15,
  bottomBoundary: MOBILE ? window.innerHeight * 0.3 : window.innerHeight * 0.15,
  boundaryForce: 0.8,

  // Trail Parameters
  trailParams: {
    maxLengthGrid: 0,
    baseOpacityGrid: 0,
    fadeRateGrid: 0,
    maxLengthFlock: 10,
    baseOpacityFlock: 40,
    fadeRateFlock: 0
  },

  // Flocking Behavior Parameters
  flockParams: {
    separationDist: 150,   // was 150
    alignmentDist: 300,    // was 300
    cohesionDist: 150,     // was 150
    separationForce: 0.75,  // was 1.0
    alignmentForce: 1.0,   // was 0.8
    cohesionForce: 0.3    // was 0.3
  },
 

  // DNA Specific Parameters
  dnaParams: {
    cycles: 1,
    waveOffset: 0,
    waveAmplitude: MOBILE ? 300 : 300,
    animationSpeed: 0.15,
    waveSpeed: MOBILE ? 0.06 : 0.03
  },

  // Loading Parameters
  loadingRotations: 2.5,
  loadingRotationSpeed: 0.07,
  loadingDistance: MOBILE ? 14 : 7
};
