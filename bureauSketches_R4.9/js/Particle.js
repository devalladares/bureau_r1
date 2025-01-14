// js/Particle.js

import { PARAMS, STATES } from './constants.js';

export default class Particle {
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

  seek(target, currentState) {
    let desired = p5.Vector.sub(target, this.pos);
    let dist = desired.mag();

    if (currentState === STATES.DNA) {
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

  update(currentState, touchPositions) {
    if (currentState !== STATES.LOADING) {
      let repulsionPoints = PARAMS.MOBILE ? touchPositions : [createVector(mouseX, mouseY)];

      for (let point of repulsionPoints) {
        let distanceToPoint = p5.Vector.dist(this.pos, point);
        if (distanceToPoint < PARAMS.mouseRepelRadius) {
          let repelForce = p5.Vector.sub(this.pos, point);
          repelForce.normalize();
          let strength = pow(1 - distanceToPoint / PARAMS.mouseRepelRadius, PARAMS.mouseRepelExponent);
          repelForce.mult(PARAMS.mouseRepelForce * strength);
          this.vel.add(repelForce);
          this.vel.setMag(max(this.vel.mag(), PARAMS.mouseMinSpeed));

          if (PARAMS.MOBILE) {
            this.vel.mult(1.2);
          }
        }
      }
    }

    this.addTrail(
      currentState === STATES.GRID
        ? PARAMS.trailParams.maxLengthGrid
        : currentState === STATES.FLOCK
        ? PARAMS.trailParams.maxLengthFlock
        : 0,
      currentState
    );

    this.vel.add(this.acc);
    this.vel.limit(PARAMS.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    if (currentState === STATES.FLOCK) {
      if (this.pos.y < PARAMS.topBoundary) {
        this.acc.add(createVector(0, PARAMS.boundaryForce * 0.5));
      } else if (this.pos.y > height - PARAMS.bottomBoundary) {
        this.acc.add(createVector(0, -PARAMS.boundaryForce * 0.5));
      }
    }

    if (this.pos.x < 0) {
      this.pos.x = width;
    } else if (this.pos.x > width) {
      this.pos.x = 0;
    }
  }

  display(currentState, stateStartTime) {
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

    if (this.trail.length > 1 && (currentState === STATES.FLOCK || currentState === STATES.GRID)) {
      beginShape();
      noFill();
      for (let i = 0; i < this.trail.length; i++) {
        const startAlpha = this.alpha * (PARAMS.trailParams.baseOpacityFlock / 100);
        const trailAlpha = map(i, 0, this.trail.length - 1, startAlpha, 0);
    
        noStroke(); 
        vertex(this.trail[i].x, this.trail[i].y);
      }
      endShape();
    }

    noStroke();
    fill(PARAMS.particleColor, this.alpha);
    circle(this.pos.x, this.pos.y, PARAMS.dotSize);
  }

  addTrail(maxLength, currentState) {
    if (currentState === STATES.FLOCK || currentState === STATES.GRID) {
      this.trail.unshift(this.pos.copy());
      if (this.trail.length > maxLength) {
        this.trail.pop();
      }
    }
  }

  flock(particles) {
    let separation = this.separate(particles);
    let alignment = this.align(particles);
    let cohesion = this.cohesion(particles);

    separation.mult(PARAMS.flockParams.separationForce);
    alignment.mult(PARAMS.flockParams.alignmentForce);
    cohesion.mult(PARAMS.flockParams.cohesionForce);

    let wind = createVector(PARAMS.flockWind, 0);
    this.applyForce(wind);

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
      return this.seek(average, STATES.DNA);
    }
    return createVector(0, 0);
  }
}
