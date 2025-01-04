/************************************************************
 *  sketch60.js
 *
 *  1) Random wander at first
 *  2) After fade, switch to "grid mode"—dots form a neat grid
 *  3) Mouse repels dots if they're close, but they return to their spots
 *  4) Has dat.GUI for easy parameter tweaking
 ************************************************************/

let dots = [];
let gridPositions = [];  // We'll store the target positions in a grid

// We'll track two modes
let randomMode = true;
let gridMode   = false;

// The parameters we expose in dat.GUI
let params = {
  // Visual
  backgroundAlpha: 255,    // if <255, trailing effect
  dotSize: 8,
  dotMaxSpeed: 2,
  // dotMaxSpeed: 20,
  dotMaxForce: 0.05,
  // dotMaxForce: 10.05,
  stopDist: 10,            // how close to target before slowing

  // Random wander
  wanderNudge: 0.1,

  // Mouse repulsion
  mouseRepelRadius: 100,
  mouseRepelForce: 0.2,

  // Grid settings
  gridRows: 11,
  gridCols: 14,
  gridSpacing: 100,  // distance between each dot horizontally/vertically

  // Fade timing
  fadeDelay1: 1000, // wait in ms before fade
  // fadeDelay1: 0, // wait in ms before fade
  fadeDelay2: 2000, // wait in ms after fade starts, then switch mode
  // fadeDelay2: 0, // wait in ms after fade starts, then switch mode

  // If you want a separate #textFade with text2.png or something
  // your HTML can have:
  // <div id="textFade" style="opacity:0;">
  //   <img src="text2.png" />
  // </div>

  // Re-init
  resetSketch: function() {
    resetAll();
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- Set up dat.GUI ---
  const gui = new dat.GUI();
  gui.add(params, 'backgroundAlpha', 0, 255, 1).name('BG Alpha');
  gui.add(params, 'dotSize', 1, 40, 1).name('Dot Size');
  gui.add(params, 'dotMaxSpeed', 0.1, 10, 0.1).name('Dot Max Speed');
  gui.add(params, 'dotMaxForce', 0.001, 0.2, 0.001).name('Dot Max Force');
  gui.add(params, 'stopDist', 0, 30, 1).name('Stop Dist');
  gui.add(params, 'wanderNudge', 0, 1, 0.01).name('Wander Nudge');

  const fMouse = gui.addFolder('Mouse Repulsion');
  fMouse.add(params, 'mouseRepelRadius', 0, 500, 1).name('Repel Radius');
  fMouse.add(params, 'mouseRepelForce', 0.01, 2, 0.01).name('Repel Force');

  const fGrid = gui.addFolder('Grid Settings');
  fGrid.add(params, 'gridRows', 1, 30, 1).name('Grid Rows');
  fGrid.add(params, 'gridCols', 1, 50, 1).name('Grid Cols');
  fGrid.add(params, 'gridSpacing', 10, 200, 1).name('Grid Spacing');

  const fFade = gui.addFolder('Fade Timing (ms)');
  fFade.add(params, 'fadeDelay1', 0, 10000, 100).name('FadeDelay Start');
  fFade.add(params, 'fadeDelay2', 0, 10000, 100).name('FadeDelay End');

  gui.add(params, 'resetSketch').name('Reset Sketch');

  resetAll();
}

function draw() {
  background(0, params.backgroundAlpha);

  // Update + display all dots
  for (let d of dots) {
    d.update();
    d.display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetAll();
}

function keyPressed() {
  if (key === 'g' || key === 'G') {
    const guiContainer = document.querySelector('.dg.ac');
    if (!guiContainer) return;
    guiContainer.style.display = guiContainer.style.display === 'none' ? 'block' : 'none';
  }
}

/** Re-init everything based on current GUI params */
function resetAll() {
  dots = [];
  gridPositions = [];
  randomMode = true;
  gridMode = false;

  // Create the grid positions
  gridPositions = generateGridPositions(params.gridRows, params.gridCols, params.gridSpacing);

  // Create that many Dot objects
  let totalDots = params.gridRows * params.gridCols;
  for (let i = 0; i < totalDots; i++) {
    let x = random(width);
    let y = random(height);
    dots.push(new Dot(x, y));
  }

  // Kick off the fade
  fadeInTextAndSwitchModes();
}

/** We wait fadeDelay1 ms, fade in #textFade, then wait fadeDelay2 and switch mode */
function fadeInTextAndSwitchModes() {
  setTimeout(() => {
    let textDiv = document.getElementById('textFade');
    if (textDiv) {
      textDiv.style.opacity = 1; // fade in
    }
    setTimeout(() => {
      enableGridMode();
    }, params.fadeDelay2);
  }, params.fadeDelay1);
}

/** Switch from random wander to grid seeking */
function enableGridMode() {
  randomMode = false;
  gridMode = true;

  // Assign each dot to a grid position
  for (let i = 0; i < dots.length; i++) {
    if (i < gridPositions.length) {
      dots[i].setTarget(gridPositions[i]);
    } else {
      // If we had more dots than grid positions, they can share or do something else
      dots[i].setTarget(gridPositions[gridPositions.length - 1]);
    }
  }
}

/************************************************************
 *  Dot class
 *    - random wander if randomMode=true
 *    - if gridMode, seek assigned grid position
 *    - mouse repels them if close
 ************************************************************/
class Dot {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(params.dotMaxSpeed);
    this.acc = createVector(0, 0);
    this.target = null;
  }

  setTarget(pt) {
    this.target = pt.copy();
  }

  update() {
    // reset forces
    this.acc.set(0, 0);

    // repel from mouse
    this.repelFromMouse();

    // behavior
    if (randomMode) {
      this.randomWander();
    } else if (gridMode) {
      this.seekTarget();
    }

    // standard physics
    this.vel.add(this.acc);
    this.vel.limit(params.dotMaxSpeed);
    this.pos.add(this.vel);

    // wrap edges
    if (this.pos.x < 0)  this.pos.x = width;
    if (this.pos.x > width)  this.pos.x = 0;
    if (this.pos.y < 0)  this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  display() {
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, params.dotSize);
  }

  randomWander() {
    this.vel.x += random(-params.wanderNudge, params.wanderNudge);
    this.vel.y += random(-params.wanderNudge, params.wanderNudge);
  }

  seekTarget() {
    if (!this.target) return;
    let desired = p5.Vector.sub(this.target, this.pos);
    let d = desired.mag();

    desired.setMag(params.dotMaxSpeed);

    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(params.dotMaxForce);
    this.acc.add(steer);

    // slow down near the target
    if (d < params.stopDist) {
      this.vel.mult(0.9);
    }
  }

  // Mouse repulsion, same as before
  repelFromMouse() {
    let mousePos = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(this.pos, mousePos);
    let dist = dir.mag();

    if (dist < params.mouseRepelRadius) {
      dir.normalize();
      // stronger force if very close
      let force = map(dist, 0, params.mouseRepelRadius, params.mouseRepelForce, 0);
      this.acc.add(dir.mult(force));
    }
  }
}

/************************************************************
 *  generateGridPositions(rows, cols, spacing)
 *   - Returns an array of p5.Vectors in a neat grid
 *   - We'll center the entire grid in the canvas
 ************************************************************/
function generateGridPositions(rows, cols, spacing) {
  let positions = [];

  // total width/height used by the grid
  let totalW = (cols - 1) * spacing;
  let totalH = (rows - 1) * spacing;

  // top-left corner so that the grid is centered
  let offsetX = (width - totalW) / 2;
  let offsetY = (height - totalH) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = offsetX + c * spacing;
      let y = offsetY + r * spacing;
      positions.push(createVector(x, y));
    }
  }

  return positions;
}
