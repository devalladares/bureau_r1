// js/states/DNAState.js
import State from './State.js';
import { STATES, PARAMS, MOBILE } from '../constants.js';
import { generateTwoSine } from '../utils.js';

export default class DNAState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    // Generate wave at time=0
    const { topWave, bottomWave } = generateTwoSine(
      0,
      PARAMS.particleCount,
      PARAMS.dnaParams,
      width,
      height
    );

    for (let i = 0; i < this.particles.length; i++) {
      if (i < floor(PARAMS.particleCount / 2)) {
        this.particles[i].setTarget(topWave[i].x, topWave[i].y);
      } else {
        const bottomIndex = i - floor(PARAMS.particleCount / 2);
        this.particles[i].setTarget(
          bottomWave[bottomIndex].x,
          bottomWave[bottomIndex].y
        );
      }
      this.particles[i].alpha = 255;
    }
  }

  update() {
    const time = millis() * 0.001 * PARAMS.dnaParams.waveSpeed;
    const { topWave, bottomWave } = generateTwoSine(
      time,
      PARAMS.particleCount,
      PARAMS.dnaParams,
      width,
      height
    );

    for (let i = 0; i < this.particles.length; i++) {
      if (i < floor(PARAMS.particleCount / 2)) {
        this.particles[i].setTarget(topWave[i].x, topWave[i].y);
      } else {
        const bottomIndex = i - floor(PARAMS.particleCount / 2);
        this.particles[i].setTarget(
          bottomWave[bottomIndex].x,
          bottomWave[bottomIndex].y
        );
      }
      const force = this.particles[i].seek(this.particles[i].target, STATES.DNA);
      this.particles[i].applyForce(force);
    }
  }
}
