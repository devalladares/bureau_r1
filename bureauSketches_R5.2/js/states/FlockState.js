// js/states/FlockState.js

import State from './State.js';
import { STATES, PARAMS } from '../constants.js';

export default class FlockState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    for (let p of this.particles) {
      p.vel = p5.Vector.random2D().mult(random(2, PARAMS.maxSpeed));
      p.trail = [];
      p.alpha = 255;
    }
  }

  update() {
    for (let p of this.particles) {
      p.flock(this.particles);
    }
  }
}
