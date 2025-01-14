// utils.js
import { MOBILE, PARAMS } from './constants.js';

export function generateTwoSine(time, count, dnaParams, width, height) {
  let topWave = [];
  let bottomWave = [];

  if (!MOBILE) {
    // ----- DESKTOP: same as before -----
    const marginX = 100; 
    const centerY = height / 2;
    const points = floor(count / 2);
    const { cycles, waveOffset, waveAmplitude } = dnaParams;

    for (let i = 0; i < points; i++) {
      const wavePhase = cycles * (i / (points - 1)) + time;
      const yOffset = waveAmplitude * sin(TWO_PI * wavePhase);

      const x = marginX + (i * (width - 2 * marginX)) / max(points - 1, 1);
      topWave.push(createVector(x, centerY - waveOffset / 2 + yOffset));
      bottomWave.push(createVector(x, centerY + waveOffset / 2 - yOffset));
    }

  } else {
    // ----- MOBILE: Use the same margins as GRID -----
    const marginTop = PARAMS.topMargin*2;       // e.g., window.innerHeight / 20
    const marginBottom = PARAMS.bottomMargin*2; // e.g., window.innerHeight / 20
    const waveHeight = height - (marginTop + marginBottom);

    const centerX = width / 2;
    const points = floor(count / 2);
    const { cycles, waveOffset, waveAmplitude } = dnaParams;

    for (let i = 0; i < points; i++) {
      const wavePhase = cycles * (i / (points - 1)) + time;
      // Instead of yOffset, we do xOffset for side-to-side “DNA” wiggle
      const xOffset = waveAmplitude * sin(TWO_PI * wavePhase);

      // Y goes from marginTop to marginTop + waveHeight
      const y = marginTop + (i * waveHeight) / max(points - 1, 1);

      topWave.push(createVector(centerX - waveOffset / 2 + xOffset, y));
      bottomWave.push(createVector(centerX + waveOffset / 2 - xOffset, y));
    }
  }

  return { topWave, bottomWave };
}
