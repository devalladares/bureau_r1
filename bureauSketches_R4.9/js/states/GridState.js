// js/states/GridState.js

import State from './State.js';
import { PARAMS, STATES } from '../constants.js';

export default class GridState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  enter() {
    // Calculate grid dimensions based on screen size
    const calculateGridDimensions = () => {
      if (PARAMS.MOBILE) {
        return {
          cols: 4,
          rows: Math.ceil(PARAMS.particleCount / 4)
        };
      }

      // Calculate available space
      const marginX = width * 0.1; // 10% margin on each side
      const marginY = height * 0.15; // 15% margin top/bottom
      const availableWidth = width - (2 * marginX);
      const availableHeight = height - (2 * marginY);

      // Calculate ideal square cell size based on both dimensions
      const totalParticles = PARAMS.particleCount;
      const aspectRatio = availableWidth / availableHeight;
      
      // Calculate rows and columns to maintain square cells
      const idealRows = Math.sqrt(totalParticles / aspectRatio);
      const idealCols = idealRows * aspectRatio;
      
      const rows = Math.round(idealRows);
      const cols = Math.round(idealCols);

      return { 
        cols: Math.max(cols, Math.ceil(totalParticles / rows)),
        rows: rows,
        marginX,
        marginY
      };
    };

    const { cols, rows, marginX, marginY } = calculateGridDimensions();

    // Calculate actual grid size
    const gridWidth = width - (2 * marginX);
    const gridHeight = height - (2 * marginY);

    // Calculate cell size to maintain square proportions
    const cellSize = Math.min(gridWidth / (cols - 1), gridHeight / (rows - 1));

    // Recenter the grid
    const actualGridWidth = cellSize * (cols - 1);
    const actualGridHeight = cellSize * (rows - 1);
    const startX = (width - actualGridWidth) / 2;
    const startY = (height - actualGridHeight) / 2;

    // Position particles in grid with square cells
    for (let i = 0; i < this.particles.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + (col * cellSize);
      const y = startY + (row * cellSize);
      this.particles[i].setTarget(x, y);
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
}