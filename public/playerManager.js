class PlayerManager {
	
  constructor(box_width, box_height) {
	this.player = undefined;
	
	this.pill_sizes = {};
    this.pill_sizes[Direction.Horizontal] = {
      w: box_width * 2,
      h: box_height
    };
    this.pill_sizes[Direction.Vertical] = {
      w: box_width,
      h: box_height * 2
    }
  }
  
  createPlayer(x, y, c1, c2, dir) {
	this.player = new Player(x, y,
      this.pill_sizes[dir].w, this.pill_sizes[dir].h,
	  c1, c2, dir);
  }
	
  exists() {
	  return this.player !== undefined;
  }
  
  direction() {
	return this.player.dir;
  }
  
  isStatic() {
	  return this.player.isStatic();
  }
  
  topLeftColor() {
	  return (!this.player.isFlipped()) ? this.player.color1 : this.player.color2;
  }
  
  bottomRightColor() {
	  return (!this.player.isFlipped()) ? this.player.color2 : this.player.color1;
  }
  
  topLeft() {
	  return this.player.topLeft();
  }
  
  bottomRight() {
	  return this.player.bottomRight();
  }
  
  descend() {
    if(this.player === undefined) { return; }
    this.player.descend()
  }
  
  update() {
    if(this.player === undefined) { return; }
    this.player.update();
  }
  
  removePlayer() {
	  this.player.removeFromWorld()
	  this.player = undefined;
  }
	
  moveLeft() {
    this.player.moveLeft(this.sizes.box.w);
  }
  moveRight() {
	  this.player.moveRight(this.sizes.box.w);
  }
	
  rotateClockwise() {
	  this.player.rotateClockwise();
  }
	
  rotateCounterClockwise() {
	  this.player.rotateCounterClockwise();
  }
  
  draw() {
	  this.player.draw();
  }
}