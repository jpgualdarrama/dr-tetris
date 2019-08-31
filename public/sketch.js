/*jshint esversion: 8 */

const BOARD_HEIGHT = 410;
const BOARD_WIDTH = 400;
const PILL_WIDTH = 40;
const NUM_PILL_X = BOARD_WIDTH / PILL_WIDTH;
const NUM_PILL_Y = NUM_PILL_X;

const RED_INDEX = 0;
const GREEN_INDEX = 1;
const BLUE_INDEX = 2;

const FRAME_RATE = 1;

// matter.js
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  World = Matter.World,
  Composite = Matter.Composite,
  Bodies = Matter.Bodies,
  Body = Matter.Body;
var engine, world;

// my global objects
var board;
var pill_colors = [];
var draw_only;

var DEBUGGING;
var PLAY;

// DOM elements
var debug_checkbox;
var play_checkbox;
var reset_button;

function setup() {
  createCanvas(BOARD_WIDTH, BOARD_HEIGHT);
  frameRate(FRAME_RATE);

  debug_checkbox = createCheckbox('Debugging?', SKETCH.INIT_DEBUG);
  DEBUGGING = debug_checkbox.checked();
  debug_checkbox.changed(checkboxEvent);

  play_checkbox = createCheckbox('Play?', SKETCH.INIT_PLAY);
  PLAY = play_checkbox.checked();
  play_checkbox.changed(playCBEvent);

  reset_button = createButton("Reset")
  reset_button.mousePressed(resetGame)

  pill_colors.push(color(255, 0, 0));
  pill_colors.push(color(0, 255, 0));
  pill_colors.push(color(0, 0, 255));

  engine = Engine.create();
  engine.world.gravity.x = 0;
  engine.world.gravity.y = 0;
  world = engine.world;

  Engine.run(engine);

  board = new Board(BOARD_WIDTH, BOARD_HEIGHT, NUM_PILL_X, NUM_PILL_Y);

  setInitialPills();
  createPlayer();
}

function setInitialPills() {
  board.addPill(0, 19, Direction.Horizontal,
    pill_colors[GREEN_INDEX],
    pill_colors[GREEN_INDEX])
  board.addPill(0, 18, Direction.Horizontal,
    pill_colors[GREEN_INDEX],
    pill_colors[GREEN_INDEX]);
  board.addPill(1, 16, Direction.Vertical,
    pill_colors[GREEN_INDEX],
    pill_colors[GREEN_INDEX]);
}

function createPlayer() {
  const r = int(random(1) * (pill_colors.length));
  const r2 = int(random(1) * (pill_colors.length));
  const dir = (random(2) >= 1) ? Direction.Horizontal : Direction.Vertical;
  const colors = [pill_colors[r], pill_colors[r2]];

  board.createPlayerPill(dir, colors[0], colors[1]);
}

function draw() {
  background(220);
  if (PLAY && !draw_only) {
    update();
  }
  board.draw();
}

// Matter.js' physics engine is too complex for implementing
// the basic physics I need
// Just do it here
// TODO: Investigate using matter's physics
// async function update() {
function update() {
  board.tick();
}

function checkboxEvent() {
  DEBUGGING = this.checked();
}

function playCBEvent() {
  PLAY = this.checked();
}

function keyPressed() {
  if (PLAY) {
    let moved = false;
    if (keyCode === LEFT_ARROW) {
      this.board.movePlayerLeft();
      moved = true;
    } else if (keyCode === RIGHT_ARROW) {
      this.board.movePlayerRight();
      moved = true;
    } else if (keyCode === DOWN_ARROW) {
      this.board.descendPlayer();
      moved = true;
    } else if (keyCode === 65) { // a
      this.board.rotatePlayerCounterClockwise();
      moved = true
    } else if (keyCode === 83) { // s
      this.board.rotatePlayerClockwise();
      moved = true
    }

    // only redraw when necessary
    if (moved) {
      draw_only = true;
      redraw();
      draw_only = false;
    }
  }

  if (keyCode === 80) { // p
      play_checkbox.checked(!play_checkbox.checked());
      PLAY = play_checkbox.checked();
  } else if (keyCode == 68) { // d
      debug_checkbox.checked(!debug_checkbox.checked());
      DEBUGGING = debug_checkbox.checked();
  } else if (keyCode == 82) { // r
      this.resetGame();
  }
  return false;
}

function resetGame() {
  board.reset();
  setInitialPills();

  debug_checkbox.checked(false);
  play_checkbox.checked(false);
  DEBUGGING = false;
  PLAY = false;
  draw_only = false;
}
