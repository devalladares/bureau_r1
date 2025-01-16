// js/interactions.js

import { PARAMS, MOBILE } from './constants.js';

// Touch Interaction Variables
export const touchPositions = []; // Use 'const' to maintain live binding

// Handle touch start
export function handleTouchStarted() {
  // Prevent default behavior to avoid unintended scrolling or zooming
  return false;
}

// Handle touch movement
export function handleTouchMoved() {
  // Update touch positions without reassigning the array
  touchPositions.length = 0; // Clears the array while maintaining its reference
  for (let i = 0; i < touches.length; i++) {
    touchPositions.push(createVector(touches[i].x, touches[i].y));
  }
  return false;
}

// Handle touch end
export function handleTouchEnded() {
  // Clear touch positions when touch ends
  touchPositions.length = 0; // Clears the array without reassigning
  return false;
}
