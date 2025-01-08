/* =========================
   ALL PARAMETERS at TOP
   ========================= */
   let params = {
    particleCount: 80, // Ensure this is an even number
    dotSize: 12,
    maxSpeed: 4,
    maxForce: 0.1,
    stopDist: 7.5,
  
    // background
    backgroundAlpha: 255,
  
    // random wander
    wanderNudge: 0.05,
  
    // flocking
    herdWithMouse: false,
  
    separationDist: 300,
    alignmentDist: 300,
    cohesionDist: 300,
    separationWeight: 2.0,
    alignmentWeight: 1.5,
    cohesionWeight: 0.5,
    flockWind: 0.05,
  
    // mouse repulsion
    mouseRepelRadius: 200,
    mouseRepelForce: 0.75,
  
    // "DNA" => two sine waves
    twoSinePoints: 80,    // Total wave points (ensure it's divisible by 2)
    waveAmplitude: 400,   // Adjust to control how tall the arcs are
    waveOffset: 0,        // Vertical gap between top/bottom wave
    waveSpeed: 0.002,     // Reduced for smoother animation
  
    // grid
    gridRows: 8,
    gridCols: 10,
  
    // timing
    wanderDelay: 1200,     // Duration for "wander" mode (800ms)
  
    // auto cycle
    autoCycle: true,      // Auto cycle enabled by default
    cycleInterval: 10000, // Cycle interval remains at 10 seconds for other modes
  
    // reset
    resetAll: function() {
      resetSketch();
    }
  };
  
