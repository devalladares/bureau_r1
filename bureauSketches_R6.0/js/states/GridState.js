// js/states/GridState.js
import State from './State.js';
import { PARAMS, STATES } from '../constants.js';

export default class GridState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    const { cols, rows, marginX, marginY } = this.calculateGridDimensions();

    const gridWidth = width - (2 * marginX);
    const gridHeight = height - (2 * marginY);

    // Calculate cell size to maintain near-square proportions
    const cellSize = Math.min(
      gridWidth / (cols - 1),
      gridHeight / (rows - 1)
    );

    // Recenter the grid
    const actualGridWidth = cellSize * (cols - 1);
    const actualGridHeight = cellSize * (rows - 1);
    const startX = (width - actualGridWidth) / 2;
    const startY = (height - actualGridHeight) / 2;

    // Create array of all possible grid positions
    let gridPositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        gridPositions.push({
          x: startX + col * cellSize,
          y: startY + row * cellSize
        });
      }
    }

    // Shuffle the grid positions
    for (let i = gridPositions.length - 1; i > 0; i--) {
      const j = floor(random(i + 1));
      [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
    }

    // Assign random grid positions to particles
    for (let i = 0; i < this.particles.length; i++) {
      const pos = gridPositions[i % gridPositions.length];
      this.particles[i].setTarget(pos.x, pos.y);
      this.particles[i].alpha = 255;
    }
  }

  update() {
    for (let p of this.particles) {
      if (p.target) {
        const force = p.seek(p.target, STATES.GRID);
        p.applyForce(force);
      }
    }
  }

  calculateGridDimensions() {
    if (PARAMS.MOBILE) {
      return {
        cols: 4,
        rows: ceil(PARAMS.particleCount / 4),
        marginX: 0,
        marginY: 0
      };
    }

    const marginX = width * 0.1; 
    const marginY = height * 0.15; 
    const availableWidth = width - 2 * marginX;
    const availableHeight = height - 2 * marginY;

    const totalParticles = PARAMS.particleCount;
    const aspectRatio = availableWidth / availableHeight;
    const idealRows = sqrt(totalParticles / aspectRatio);
    const idealCols = idealRows * aspectRatio;
    const rows = round(idealRows);
    const cols = round(idealCols);

    // Ensure correct # of columns if rounding changed it
    return { 
      cols: max(cols, ceil(totalParticles / rows)),
      rows: rows,
      marginX,
      marginY
    };
  }
}
