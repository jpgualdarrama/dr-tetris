//          W       
// |-----------------|
// |        |        |
// |  Box1  C  Box2  | H
// |        |        |
// |-----------------|

//      W
//  ---------
// |         |
// |  Box1   |
// |         |
// |         |
// |----C----| H
// |         |
// |  Box2   |
// |         |
// |         |
//  ---------

class Pill {
  constructor(x, y, w, h, c1, c2, dir) {
    this.dir = dir;
    this.width = w
    this.height = h
    this.color1 = c1;
    this.color2 = c2;
    this.isPlayer = false;

    // The x and y arguments passed are the top-left corner of the Pill
    // In Matter.js, all positions are based on the center of the body
    // Calculate the center position of the pill based on the initial direction
    var box1_top_left = {
      x: x,
      y: y
    }
    var box2_top_left = {
      x: (this.isHorizontal()) ? x + this.width / 2 : x,
      y: (this.isHorizontal()) ? y : y + this.height / 2
    };
    var box_size = {
      width: (this.isHorizontal()) ? this.width / 2 : this.width,
      height: (this.isHorizontal()) ? this.height : this.height / 2
    };

    var options = {
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      restitution: 0.0,
    };

    this.box1 = new Box(box1_top_left.x, box1_top_left.y,
      box_size.width, box_size.height,
      c1, options);
    this.box2 = new Box(box2_top_left.x, box2_top_left.y,
      box_size.width, box_size.height,
      c2, options);

    if (this.isHorizontal()) {
      this.east = this.box1;
      this.west = this.box2;
    } else if(this.isVertical()) {
		this.north = this.box1;
		this.south = this.box2;
	}
  }

  // update north/south/east/west designations
  update() {
    var box1_exists = this.box1 !== undefined;
    var box2_exists = this.box2 !== undefined;
    if (this.isHorizontal()) {
      if (box1_exists && box2_exists) {
        if (this.box1.topLeft().x < this.box2.topLeft().x) {
          this.east = this.box1;
          this.west = this.box2;
        } else if (this.box1.topLeft().x > this.box2.topLeft().x) {
          this.east = this.box2;
          this.west = this.box1;
        } else {
          throw ("ERROR - Pill.update - Horizontal pill whose boxes have identical x coordinates")
        }
      } else if (box1_exists && !box2_exists) {
        this.east = this.box1;
        this.west = undefined;
      } else if (!box1_exists && box2_exists) {
        this.east = this.box2;
        this.west = undefined;
      } else {
        this.east = undefined;
        this.west = undefined;
      }
    } else if (this.isVertical()) {
      if (box1_exists && box2_exists) {
        if (this.box1.topLeft().y < this.box2.topLeft().y) {
          this.north = this.box1;
          this.south = this.box2;
        } else if (this.box1.topLeft().y > this.box2.topLeft().y) {
          this.north = this.box2;
          this.south = this.box1;
        } else {
          throw ("ERROR - Pill.update - Vertical pill whose boxes have identical y coordinates")
        }
      } else if (box1_exists && !box2_exists) {
        this.north = this.box1;
        this.south = undefined;
      } else if (!box1_exists && box2_exists) {
        this.north = this.box2;
        this.south = undefined;
      } else {
        this.north = undefined;
        this.south = undefined;
      }
    }
	
  }

  draw() {
    if (this.box1 !== undefined) {
      this.box1.draw();
    }
    if (this.box2 !== undefined) {
      this.box2.draw();
    }

    if (DEBUGGING) {
      this.drawBody();
    }
  }

  drawBody() {
    if (this.box1 !== undefined) {
      this.box1.drawBody();
    }
    if (this.box2 !== undefined) {
      this.box2.drawBody();
    }
  }

  // move down by 1 block
  descend() {
    if (this.box1 !== undefined && !this.box1.isStatic()) {
      this.box1.descend();
    }
    if (this.box2 !== undefined && !this.box2.isStatic()) {
      this.box2.descend();
    }
  }

  removeBody(bodyEnum) {
    if (bodyEnum === BoxID.Box1) {
      this.box1.removeFromWorld();
      this.box1 = undefined;
    } else if (bodyEnum === BoxID.Box2) {
      this.box2.removeFromWorld();
      this.box2 = undefined;
    }
  }

  removeFromWorld() {
    if (this.box1 !== undefined) {
      this.box1.removeFromWorld();
    }
    if (this.box2 !== undefined) {
      this.box2.removeFromWorld();
    }
  }

  // helper functions for coordinates
  center() {
    var topLeft;
    if (this.isHorizontal()) {
      topLeft = this.east.topLeft();
    } else if (this.isVertical()) {
      topLeft = this.north.topLeft();
    }
    return {
      x: topLeft.x + this.width / 2,
      y: topLeft.y + this.height / 2
    }
  }

  bottomLeft() {
    if (this.isHorizontal()) {
      if (this.east !== undefined) {
        return this.east.bottomLeft();
      } else if(this.west !== undefined) {
		  return this.west.bottomLeft();
	  }
    } else if (this.isVertical()) {
      if (this.south !== undefined) {
        return this.south.bottomLeft();
      } else if(this.north !== undefined) {
		  return this.north.bottomLeft();
	  }
    }
    // if (this.box2 !== undefined) {
    //   return this.box2.bottomLeft();
    // } else if (this.box1 !== undefined) {
    //   return this.box1.bottomLeft();
    // }
    return XYPair.create(-1, -1)
  }

  topRight() {
    if (this.isHorizontal()) {
      if (this.west !== undefined) {
        return this.west.topRight()
      }
      // if (this.box2 !== undefined) {
      //   return this.box2.topRight();
      // }
      // if (this.box1 !== undefined) {
      //   return this.box1.topRight();
      // }
    } else if (this.isVertical()) {
      if (this.north !== undefined) {
        return this.north.topRight();
      }
      // if (this.box1 !== undefined) {
      //   return this.box1.topRight();
      // }
      // if (this.box2 !== undefined) {
      //   return this.box2.topRight();
      // }
    }
    return XYPair.create(-1, -1);
  }

  topLeft() {
    
    if (this.isHorizontal()) {
      if (this.east !== undefined) {
        return this.east.topLeft();
      } else if(this.west !== undefined) {
        return this.west.topLeft();
      }
    } else if (this.isVertical()) {
      if (this.north !== undefined) {
        return this.north.topLeft();
      } else if(this.south !== undefined) {
        return this.south.topLeft()
      }
    }
    return XYPair.create(-1, -1);
  }

  bottomRight() {
    if (this.isHorizontal()) {
      if (this.west !== undefined) {
        return this.west.bottomRight();
      }
    } else if (this.isVertical()) {
      if (this.south !== undefined) {
        return this.south.bottomRight();
      }
    }
    return XYPair.create(-1, -1);
  }

  isStatic() {
    if (this.box2 !== undefined) {
      return this.box2.isStatic();
    }
    if (this.box1 !== undefined) {
      return this.box1.isStatic();
    }
    return false;
  }

  setStatic(s) {
    if (this.box2 !== undefined) {
      this.box2.setStatic(s);
    }
    if (this.box1 !== undefined) {
      this.box1.setStatic(s);
    }
  }

  moveLeft(x) {
	if(this.isStatic()) { return }
    if (this.box1 !== undefined) {
      this.box1.moveLeft(x);
    }
    if (this.box2 !== undefined) {
      this.box2.moveLeft(x);
    }
  }

  moveRight(x) {
	if(this.isStatic()) { return }
    if (this.box1 !== undefined) {
      this.box1.moveRight(x);
    }
    if (this.box2 !== undefined) {
      this.box2.moveRight(x);
    }
  }

  // This function *assumes* that it is being called on a pill with both boxes.
  // This assumption makes sense because only a player pill should be rotated
  rotateClockwise() {

    // rotations keep Box 1 location constant and
    // move Box 2 around it
    //  E W             E W     N 2     E W
    //  1-2 --> N 1 --> 2-1 --> S 1 --> 1-2
    //          S 2
	
	if (this.isStatic()) { return }

    if (this.isHorizontal()) {
      if (this.box2 !== undefined) {
        // if box2 is west of box1, move box2 box down below box1
        if(this.box2 === this.west) {
        this.box2.translate(
          this.box2.width * -1,
          this.box2.height
        );
        }
        // if box2 is east of box1, move box2 up above box1
        else if(this.box2 === this.east) {
          this.box2.translate(
          this.box2.width,
          this.box2.height * -1
        );
        }
        // set the direction to vertical
        this.dir = Direction.Vertical
      }
    } else if (this.isVertical()) {
      if (this.box2 !== undefined) {
        // if box2 is below box1, move box2 to the easet of box1
        if(this.box2 === this.south) {
        this.box2.translate(
          this.box2.width * -1,
          this.box2.height * -1
        );
        }
        // if box2 is above box1, move box2 to the west of box1
        else if(this.box2 === this.north) {
          this.box2.translate(
            this.box2.width,
            this.box2.height
            );
        }
        // set the direction to horizontal
        this.dir = Direction.Horizontal
      } // box2 !== undefined
    } // vertical
    this.update()
  } // rotateClockwise

  // This function *assumes* that it is being called on a pill with both boxes.
  // This assumption makes sense because only a player pill should be rotated
  rotateCounterClockwise() {

    // rotations keep Box 1 location constant and
    // move Box 2 around it
    //  E W     N 2     E W             E W
    //  1-2 --> S 1 --> 2-1 --> N 1 --> 1-2
    //                          S 2
	
	if (this.isStatic()) { return }
    
    if (this.isHorizontal()) {
      if (this.box2 !== undefined) {
        // if box2 is west of box1, move box2 box up above box1
        if(this.box2 === this.west) {
        this.box2.translate(
          this.box2.width * -1,
          this.box2.height * -1
        );
        }
        // if box2 is east of box1, move box2 down below box1
        else if(this.box2 === this.east) {
          this.box2.translate(
          this.box2.width,
          this.box2.height
        );
        }
        // set the direction to vertical
        this.dir = Direction.Vertical
      }
    } else if (this.isVertical()) {
      if (this.box2 !== undefined) {
        // if box2 is below box1, move box2 to the west of box1
        if(this.box2 === this.south) {
        this.box2.translate(
          this.box2.width,
          this.box2.height * -1
        );
        }
        // if box2 is above box1, move box2 to the east of box1
        else if(this.box2 === this.north) {
          this.box2.translate(
            this.box2.width * -1,
            this.box2.height
            );
        }
        // set the direction to horizontal
        this.dir = Direction.Horizontal
      } // box2 !== undefined
    } // vertical
    this.update()
  } // rotateCounterclockwise
  
  // helper for easily checking direction
  isVertical() {
	  return (this.dir === Direction.Vertical);
  }
  
  isHorizontal() {
	  return (this.dir === Direction.Horizontal);
  }
  
  // returns true if box2 and box1 are in the opposite positions of 
  // where they were when the pill was created
  isFlipped() {
    if(this.isHorizontal()) {
      if(this.east === undefined || this.west === undefined) {
        return false;
      }
      return (!(this.east === this.box1 && this.west === this.box2));
    }
    else if(this.isVertical()) {
      if(this.north === undefined || this.south === undefined) {
        return false;
      }
      return (!(this.north === this.box1 && this.south === this.box2));
    }
    throw("Pill.isFlipped - Pill instance with invalid Direction value")
  }
} // class Pill

class Player extends Pill {
	constructor(x, y, w, h, c1, c2, dir) {
		super(x, y, w, h, c1, c2, dir)
		this.isPlayer = true
	}
	
}