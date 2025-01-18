/*******************************************************
 * Particle.js 
 * 
 * Features:
 *  - Mouse-off-canvas friction
 *  - Only repel if mouse/touch is moving
 *  - Gentle return if mouse is still
 *  - FLOCK-specific extra repulsion radius/force
 *  - Gradient trail
 *  - Unified seek
 *******************************************************/

import { PARAMS, STATES, MOBILE } from './constants.js';
import { touchPositions } from './interactions.js';

export default class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.target = null;
    this.trail = [];
    this.alpha = 255;

    // Position and movement properties
    this.originalPos = createVector(x, y);
    this.lastMousePos = null;
    this.returnSpeed = 0.015;  // Very gentle return
    this.friction = 0.98;      // Smooth deceleration
  }

  setTarget(x, y) {
    this.target = createVector(x, y);
    this.originalPos = createVector(x, y);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  // --------------------------------------------------------
  // UNIFIED SEEK
  // --------------------------------------------------------
  seek(target) {
    const desired = p5.Vector.sub(target, this.pos);
    const dist = desired.mag();
    const approachDist = 100;

    if (dist < approachDist) {
      let speed = map(dist, 0, approachDist, 0, PARAMS.maxSpeed);
      desired.setMag(speed);
    } else {
      desired.setMag(PARAMS.maxSpeed);
    }

    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(PARAMS.maxForce);
    return steer;
  }

  // --------------------------------------------------------
  // UPDATE:
  //  - MOBILE: repel if touches move, otherwise return
  //  - DESKTOP: repel if mouse inside & moving, otherwise return
  //  - If FLOCK, we can also do boundary checks
  // --------------------------------------------------------
  update(currentState, activeTouches) {
    if (currentState === STATES.LOADING) {
      this.integrate();
      return;
    }

    if (MOBILE) {
      if (activeTouches.length > 0) {
        // Check if any touch moved
        const touchMoved = this.lastMousePos
          ? activeTouches.some(touch => p5.Vector.dist(touch, this.lastMousePos) > 2)
          : true;

        if (touchMoved) {
          this.handleRepulsionPoints(activeTouches, currentState);
          this.lastMousePos = activeTouches[0].copy();
        } else {
          this.returnToOriginalPosition();
        }
      } else {
        this.returnToOriginalPosition();
      }
    } else {
      const isMouseInside = (
        mouseX >= 0 && mouseX <= width &&
        mouseY >= 0 && mouseY <= height
      );

      if (isMouseInside) {
        const mouseMoveDist = dist(mouseX, mouseY, pmouseX, pmouseY);
        const currentMousePos = createVector(mouseX, mouseY);

        if (mouseMoveDist > 2) {
          // Only repel when mouse is actually moving
          this.handleRepulsionPoints([currentMousePos], currentState);
          this.lastMousePos = currentMousePos.copy();
        } else {
          // Gentle return when mouse is stationary
          this.returnToOriginalPosition();
        }
      } else {
        // Mouse off-canvas => gentle return
        this.returnToOriginalPosition();
      }
    }

    // Add trail for FLOCK vs GRID
    if (currentState === STATES.FLOCK) {
      this.addTrail(PARAMS.trailParams.maxLengthFlock);
    } else if (currentState === STATES.GRID) {
      this.addTrail(PARAMS.trailParams.maxLengthGrid);
    }

    // Integrate motion
    this.integrate();

    // Boundary push if in FLOCK
    if (currentState === STATES.FLOCK) {
      if (this.pos.y < PARAMS.topBoundary) {
        this.acc.add(createVector(0, PARAMS.boundaryForce * 0.5));
      } else if (this.pos.y > height - PARAMS.bottomBoundary) {
        this.acc.add(createVector(0, -PARAMS.boundaryForce * 0.5));
      }
    }

    // Wrap around horizontally
    if (this.pos.x < -1) {
      this.pos.x = width + 1;
      this.trail = [];
    } else if (this.pos.x > width + 1) {
      this.pos.x = -1;
      this.trail = [];
    }
  }

  // --------------------------------------------------------
  // returnToOriginalPosition(): friction + gentle pull
  // --------------------------------------------------------
  returnToOriginalPosition() {
    let returnForce = p5.Vector.sub(this.originalPos, this.pos);
    let distance = returnForce.mag();

    // Scale return force by distance (slower when closer)
    let scaledSpeed = this.returnSpeed * (distance / 100);
    returnForce.normalize();
    returnForce.mult(scaledSpeed);

    // friction
    this.vel.mult(this.friction);

    // Apply return
    this.applyForce(returnForce);
  }

  // --------------------------------------------------------
  // integrate(): basic velocity + acceleration
  // --------------------------------------------------------
  integrate() {
    this.vel.add(this.acc);
    this.vel.limit(PARAMS.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  // --------------------------------------------------------
  // handleRepulsionPoints: If in FLOCK, boost radius/force
  // --------------------------------------------------------
  handleRepulsionPoints(repulsionPoints, currentState) {
    // Default to global params
    let localRadius = PARAMS.mouseRepelRadius;
    let localForce  = PARAMS.mouseRepelForce;

    // If we want a bigger effect in FLOCK:
    if (currentState === STATES.FLOCK) {
      localRadius += 200; // e.g. bigger radius
      localForce  *= 1.; // e.g. 50% stronger
    }

    for (let point of repulsionPoints) {
      const distanceToPoint = p5.Vector.dist(this.pos, point);
      if (distanceToPoint < localRadius) {
        let repelForce = p5.Vector.sub(this.pos, point);
        repelForce.normalize();

        // Distance-based falloff
        let strength = pow(
          1 - distanceToPoint / localRadius,
          PARAMS.mouseRepelExponent
        );

        repelForce.mult(localForce * strength);
        this.vel.add(repelForce);
        this.vel.setMag(max(this.vel.mag(), PARAMS.mouseMinSpeed));
      }
    }
  }

  // --------------------------------------------------------
  // display(): draws gradient trail in FLOCK
  // --------------------------------------------------------
  display(currentState) {
    // Only in FLOCK
    if (currentState === STATES.FLOCK && this.trail.length > 1) {
      strokeWeight(PARAMS.dotSize);
      noFill();
      for (let i = 0; i < this.trail.length - 1; i++) {
        let p1 = this.trail[i];
        let p2 = this.trail[i + 1];
        let fraction = i / (this.trail.length - 1);
        let c = lerpColor(color(80), color(0), fraction);
        stroke(c);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }

    noStroke();
    fill(PARAMS.particleColor, this.alpha);
    circle(this.pos.x, this.pos.y, PARAMS.dotSize);
  }

  // --------------------------------------------------------
  // addTrail(): store positions for potential gradient line
  // --------------------------------------------------------
  addTrail(maxLength) {
    this.trail.unshift(this.pos.copy());
    if (this.trail.length > maxLength) {
      this.trail.pop();
    }
  }

  // --------------------------------------------------------
  // FLOCK METHODS
  // --------------------------------------------------------
  flock(particles) {
    let separation = this.separate(particles);
    let alignment = this.align(particles);
    let cohesion = this.cohesion(particles);

    separation.mult(PARAMS.flockParams.separationForce);
    alignment.mult(PARAMS.flockParams.alignmentForce);
    cohesion.mult(PARAMS.flockParams.cohesionForce);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
  }

  separate(particles) {
    let desiredSeparation = PARAMS.flockParams.separationDist;
    let sum = createVector(0, 0);
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
    let sum = createVector(0, 0);
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
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of particles) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      let average = sum.div(count);
      return this.seek(average);
    }
    return createVector(0, 0);
  }
}
