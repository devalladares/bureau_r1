// js/states/FlockState.js

import State from './State.js';
import { PARAMS, MOBILE } from '../constants.js';
import { touchPositions } from '../interactions.js';

export default class FlockState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    for (let p of this.particles) {
      // Instead of random2D(), do something aligned to the right
      // p.vel = p5.Vector.random2D().mult(random(2, PARAMS.maxSpeed)); // remove this
  
      // Option A: Everyone starts EXACTLY right
      // p.vel = createVector(1, 0).mult(random(2, PARAMS.maxSpeed));
  
      // Option B: Everyone mostly right with slight angle
      let angle = random(-0.2, 0.2); // small ± angle
      p.vel = p5.Vector.fromAngle(angle).mult(random(2, PARAMS.maxSpeed));
  
      p.trail = [];
      p.alpha = 255;
    }
  }

  update() {
    // 1) Compute the "tilt wind" based on mouse/touch
    const wind = this.calculateWind();

    // 2) For each particle:
    for (let p of this.particles) {
      // Standard flocking forces (separation, alignment, cohesion)
      p.flock(this.particles);

      // 3) Apply tilt wind
      p.applyForce(wind);
    }
  }

  // ----------------------------------------------------------
  // CALCULATE WIND TILT:
  // Always push to the right (positive X),
  // tilt up/down based on mouse or average touch Y.
  // ----------------------------------------------------------
  calculateWind() {
    // Base horizontal push:
    let windX = 0.2;
    let windY = 0; // We'll compute a tilt from -0.1 to +0.1

    if (MOBILE) {
      // On mobile, if there are active touches, tilt based on their average Y
      if (touchPositions.length > 0) {
        let sumY = 0;
        for (let t of touchPositions) {
          sumY += t.y;
        }
        let avgY = sumY / touchPositions.length;
        // Top screen -> negative tilt; bottom -> positive tilt
        windY = map(avgY, 0, height, -0.2, 0.2);
      }
    } else {
      // On desktop, check if mouse is within canvas
      if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        // Map mouseY from top(0) -> -0.2, bottom(height) -> 0.2
        windY = map(mouseY, 0, height, -0.2, 0.2);
      }
    }

    // Return a vector to apply to each particle
    return createVector(windX, windY);
  }
}
