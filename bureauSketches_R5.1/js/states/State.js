// js/states/State.js

export default class State {
  constructor(particles, transitionCallback) {
    this.particles = particles;
    this.transitionCallback = transitionCallback;
    this.startTime = millis();
  }

  enter() {
    // Override in subclasses if needed
  }

  update() {
    // Override in subclasses
  }

  exit() {
    // Override in subclasses if needed
  }
}
