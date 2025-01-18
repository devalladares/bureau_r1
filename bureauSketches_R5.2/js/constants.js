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
export const DEBUG_SINGLE_STATE_MODE = false;
// export const DEBUG_SINGLE_STATE_MODE = true;
export const DEBUG_STATE = STATES.FLOCK; // e.g., STATES.GRID, STATES.DNA, STATES.FLOCK

// Global Parameters
export let PARAMS = {
  directionInfluenceForce: 0.5,
  // Particle Configuration
  particleCount: MOBILE ? 50 : 72, // Adjust if needed
  dotSize: MOBILE ? 20 : 10,
  particleColor: 255,
  maxSpeed: MOBILE ? 6 : 5.5,
  maxForce: 2.0,

  // Margins/Paddings
  topMargin: window.innerHeight / 20,
  bottomMargin: window.innerHeight / 20,

  // Loading Animation Parameters
  loadingRotations: 2.5,
  loadingRotationSpeed: 0.07,
  loadingDistance: MOBILE ? 14 : 7,
  loadingDuration: 3000,

  // State Durations (in milliseconds)
  stateDuration: {
    loading: 3000,
    grid: 12000,
    dna: 12000,
    flock: 12000
  },

  // Flocking Parameters
  backgroundAlpha: 255,
  flockWind: 0.1,

  // Mouse Interaction
  mouseRepelForce: MOBILE ? 5 : 4,        // Increased for mobile
  mouseRepelRadius: MOBILE ? 300 : 300,     // Expanded for mobile
  mouseRepelExponent: MOBILE ? 1.5 : 1,    // Adjusted for smoother falloff on mobile
  mouseMinSpeed: MOBILE ? 2.5 : 2,          // Increased for more responsive feel on mobile

  // Boundaries
  boundaryMargin: window.innerHeight / 20,
  topBoundary: window.innerHeight * 0.15, // Defined as a value
  bottomBoundary: MOBILE ? window.innerHeight * 0.3 : window.innerHeight * 0.15, // Defined as a value
  boundaryForce: 0.8,

  // Trail Parameters
  // trailParams: {
  //   maxLengthGrid: 0,
  //   baseOpacityGrid: 0,
  //   fadeRateGrid: 0,
  //   maxLengthFlock: 0,
  //   baseOpacityFlock: 0,
  //   fadeRateFlock: 0
  // },
 
  // trailParams: {
  //   maxLengthGrid: 0,
  //   baseOpacityGrid: 0,
  //   fadeRateGrid: 0,
  //   maxLengthFlock: 10,
  //   baseOpacityFlock: 10,
  //   fadeRateFlock: 0.15
  // },

  trailParams: {
    maxLengthGrid: 0,
    baseOpacityGrid: 0,
    fadeRateGrid: 0,
    maxLengthFlock: 5,    // Increased from 10
    baseOpacityFlock: 0,   // Reduced from 10
    fadeRateFlock: 0     // Adjusted from 0.15
  },
 

  // Flocking Behavior Parameters
  // flockParams: {
  //   separationDist: 100,
  //   alignmentDist: 500,
  //   cohesionDist: 200,
  //   separationForce: 1.5,
  //   alignmentForce: 1.5,
  //   cohesionForce: 0.5
  // },

  flockParams: {
    separationDist: 150,  // Reduced from 200
    alignmentDist: 300,   // Reduced from 500
    cohesionDist: 150,    // Reduced from 200
    separationForce: 1.0, // Reduced from 1.5
    alignmentForce: 0.8,  // Reduced from 1.5
    cohesionForce: 0.3    // Reduced from 0.5
  },

  // Trail Transition Timing for FLOCK
  trailTransition: {
    startFadeAt: 0.5,
    fadeDuration: 0.5
  },

  // DNA Specific Parameters
  dnaParams: {
    cycles: MOBILE ? 1 : 1,            // Reduced cycles on mobile
    waveOffset: 0,
    waveAmplitude: MOBILE ? 300 : 300,  // Adjusted amplitude for mobile
    animationSpeed: 0.15,
    waveSpeed: MOBILE ? 0.06 : 0.03,
    rotationSpeed: 0.4
  }
};
