// js/interactions.js

// Touch Interaction Variables
export const touchPositions = [];

// Handle touch start
export function handleTouchStarted() {
  // Prevent default browser behaviors like scrolling
  return false;
}

// Handle touch movement
export function handleTouchMoved() {
  // Update touch positions
  touchPositions.length = 0;
  for (let i = 0; i < touches.length; i++) {
    touchPositions.push(createVector(touches[i].x, touches[i].y));
  }
  return false;
}

// Handle touch end
export function handleTouchEnded() {
  touchPositions.length = 0;
  return false;
}
