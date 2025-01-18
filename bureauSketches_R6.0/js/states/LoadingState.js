// js/states/LoadingState.js
import State from './State.js';
import { STATES, PARAMS } from '../constants.js';
import Particle from '../Particle.js';

export default class LoadingState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
    this.loadingRotation = 0;
    this.loadingPhase = 'rotate';
    this.loadingComplete = false;
  }

  enter() {
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear existing particles
    this.particles.length = 0;

    // 1) Visible "oscillating" pair
    this.particles.push(new Particle(centerX, centerY - PARAMS.loadingDistance));
    this.particles.push(new Particle(centerX, centerY + PARAMS.loadingDistance));

    // 2) Remaining invisible particles
    const totalInvisible = PARAMS.particleCount - 2; 
    const half = floor(totalInvisible / 2);

    // (A) Center Group
    for (let i = 0; i < half; i++) {
      let p = new Particle(centerX, centerY);
      p.alpha = 0; 
      p.isCorner = false; // Mark them as "center" group
      this.particles.push(p);
    }

    // (B) Corner Group
    const remaining = totalInvisible - half;
    for (let i = 0; i < remaining; i++) {
      // Place particle at a random corner
      let cornerPos = this.randomCornerPosition();
      let p = new Particle(cornerPos.x, cornerPos.y);
      p.alpha = 0;
      p.isCorner = true; // Mark as "corner" group
      this.particles.push(p);
    }

    this.loadingPhase = 'rotate';
    this.loadingRotation = 0;
    this.loadingComplete = false;
  }

  // Choose one of the 4 corners:
  // 0 => top-left, 1 => top-right, 2 => bottom-right, 3 => bottom-left
  randomCornerPosition() {
    const corner = floor(random(4));
    switch (corner) {
      case 0:
        return createVector(0, 0); 
      case 1:
        return createVector(width, 0);
      case 2:
        return createVector(width, height);
      default:
        return createVector(0, height);
    }
  }

  update() {
    if (this.loadingComplete) return;

    const centerX = width / 2;
    const centerY = height / 2;
    this.loadingRotation += PARAMS.loadingRotationSpeed;

    if (this.loadingPhase === 'rotate') {
      // Oscillating the first 2 dots
      const yOffset = sin(this.loadingRotation) * PARAMS.loadingDistance;
      this.particles[0].pos.y = centerY - yOffset;
      this.particles[1].pos.y = centerY + yOffset;

      if (this.loadingRotation >= TWO_PI * PARAMS.loadingRotations) {
        this.loadingPhase = 'converge';
        this.loadingRotation = 0;
      }

    } else if (this.loadingPhase === 'converge') {
      // Move the main two loading dots to center
      this.particles[0].pos.y = lerp(this.particles[0].pos.y, centerY, 0.1);
      this.particles[1].pos.y = lerp(this.particles[1].pos.y, centerY, 0.1);

      // Fade in & converge the rest
      const progress = min(1, this.loadingRotation / (PI * 0.5));
      if (progress > 0.5) {
        for (let i = 2; i < this.particles.length; i++) {
          this.particles[i].alpha = map(progress, 0.5, 1, 0, 255);
          if (this.particles[i].isCorner) {
            // Gently nudge corner group toward center
            // (or keep them in corners if you prefer—just remove these lines)
            this.particles[i].pos.x = lerp(this.particles[i].pos.x, centerX, 0.1);
            this.particles[i].pos.y = lerp(this.particles[i].pos.y, centerY, 0.1);
          }
        }
      }
      this.loadingRotation += PARAMS.loadingRotationSpeed;

      // Once the two main dots are near center, switch states
      if (
        abs(this.particles[0].pos.y - centerY) < 1 && 
        abs(this.particles[1].pos.y - centerY) < 1
      ) {
        this.loadingComplete = true;
        this.transitionCallback(STATES.GRID);
      }
    }
  }
}
