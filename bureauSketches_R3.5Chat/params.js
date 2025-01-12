let params = {
  // Core particle parameters
  particleCount: 80,
  dotSize: 12,
  maxSpeed: 4,
  maxForce: 0.1,
  stopDist: 7.5,
  
  // Background
  backgroundAlpha: 255,
  
  // Margins
  verticalMargin: window.innerHeight / 17, // 1/17th of page height
  
  // Flocking
  separationDist: 300,
  alignmentDist: 300,
  cohesionDist: 300,
  separationWeight: 2.0,
  alignmentWeight: 1.5,
  cohesionWeight: 0.5,
  
  // DNA wave
  waveAmplitude: 400,
  waveOffset: 0,
  waveSpeed: 0.002,
  
  // Grid
  gridRows: 8,
  gridCols: 10,
  
  // Timing
  cycleInterval: 10000, // Base interval for transitions
  
  // Loading animation
  loadingRotations: 2, // Number of rotations in loading sequence
  loadingSpeed: 0.05, // Speed of loading rotation
  
  // Reset function
  resetAll: function() {
    resetSketch();
  }
};