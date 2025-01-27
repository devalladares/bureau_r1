import State from './State.js';
import { PARAMS, STATES } from '../constants.js';

export default class GridState extends State {
  constructor(particles, transitionCallback) {
    super(particles, transitionCallback);
  }

  calculateGridDimensions() {
    const totalParticles = this.particles.length;

    if (PARAMS.MOBILE) {
      // Mobile: 5 columns (instead of 4)
      return {
        cols: 5,
        rows: totalParticles / 5,
        marginX: 0,
        marginY: 0
      };
    }

    // For desktop, find factors that create the most pleasing grid
    const marginX = width * 0.1;
    const marginY = height * 0.15;
    const availableWidth = width - 2 * marginX;
    const availableHeight = height - 2 * marginY;
    const screenRatio = availableWidth / availableHeight;

    // Find all factors of totalParticles
    let factors = [];
    for (let i = 1; i <= Math.sqrt(totalParticles); i++) {
      if (totalParticles % i === 0) {
        factors.push(i);
        if (i !== totalParticles / i) {
          factors.push(totalParticles / i);
        }
      }
    }
    factors.sort((a, b) => a - b);

    // Find the factor pair that gives us the closest to screen ratio
    let bestCols = factors[0];
    let bestRows = totalParticles / bestCols;
    let bestRatioDiff = Math.abs(screenRatio - (bestCols / bestRows));

    for (let cols of factors) {
      const rows = totalParticles / cols;
      const ratioDiff = Math.abs(screenRatio - (cols / rows));
      
      if (ratioDiff < bestRatioDiff) {
        bestRatioDiff = ratioDiff;
        bestCols = cols;
        bestRows = rows;
      }
    }

    return {
      cols: bestCols,
      rows: bestRows,
      marginX,
      marginY
    };
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
}