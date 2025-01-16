import State from './State.js';
import { STATES, PARAMS } from '../constants.js';

export default class FlockState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    // Initialize particles with a rightward bias
    for (let p of this.particles) {
      // Create velocity vector with rightward bias
      const angle = random(-PI/4, PI/4); // Restrict initial angle to -45° to +45°
      const speed = random(3, PARAMS.maxSpeed);
      p.vel = p5.Vector.fromAngle(angle).mult(speed);
      
      // Clear trails and ensure full opacity
      p.trail = [];
      p.alpha = 255;
    }

    // Adjust flocking parameters for better cohesion
    PARAMS.flockParams = {
      separationDist: 100,        // Reduced from 200
      alignmentDist: 200,         // Reduced from 500
      cohesionDist: 150,          // Reduced from 200
      separationForce: 1.2,       // Slightly reduced from 1.5
      alignmentForce: 1.8,        // Increased from 1.5
      cohesionForce: 0.8         // Increased from 0.5
    };

    // Adjust trail parameters
    PARAMS.trailParams = {
      maxLengthFlock: 15,        // Reduced trail length
      baseOpacityFlock: 40,      // Increased base opacity
      fadeRateFlock: 0.95        // Smoother fade
    };

    // Increase rightward momentum
    PARAMS.flockWind = 0.2;      // Increased from 0.1
  }

  update() {
    // Apply flocking behavior
    for (let p of this.particles) {
      p.flock(this.particles);
      
      // Add additional rightward force bias
      const rightwardBias = createVector(PARAMS.flockWind * 2, 0);
      p.applyForce(rightwardBias);
      
      // Ensure minimum rightward velocity
      if (p.vel.x < 1) {
        p.vel.x += 0.1;
      }
    }
  }

  exit() {
    // Reset any modified parameters
    PARAMS.flockWind = 0.1; // Reset to original value
  }
}