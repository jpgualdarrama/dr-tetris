//      W
// |---------|
// |         |
// |    C    | H
// |         |
// |---------|
class Box {
  constructor(x, y, w, h, c) {
    // x and y are coordinates of top left
    this.width = w;
    this.height = h;
    this.fill_color = c;

    var center = {
      x: x + this.width / 2,
      y: y + this.height / 2
    };

    this.body = Bodies.rectangle(center.x, center.y, w, h);
    // console.log("Box.Body: ", this.body.position)
    World.add(world, this.body);
  }

  draw() {
    push();
    rectMode(CENTER)
    stroke(0, 0, 0);
    fill(this.fill_color);
    rect(this.body.position.x, this.body.position.y,
      this.width, this.height);
    pop();
  }

  drawBody() {
    const vertices = this.body.vertices;
    const pos = this.body.position;

    push();
    beginShape();
    var x = 0,
      y = 0;
    for (var i = 0; i < vertices.length; i++) {
      x = vertices[i].x;
      y = vertices[i].y;
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
  }

  descend() {
    Body.translate(this.body, {
      x: 0,
      y: this.height
    })
  }

  // helper for getting the bottom-left corner of the box
  bottomLeft() {
    return {
      x: this.body.position.x - this.width / 2,
      y: this.body.position.y + this.height / 2
    }
  }

  topRight() {
    return {
      x: this.body.position.x + this.width / 2,
      y: this.body.position.y - this.height / 2
    }
  }

  topLeft() {
    return {
      x: this.body.position.x - this.width / 2,
      y: this.body.position.y - this.height / 2
    }
  }

  bottomRight() {
    return {
      x: this.body.position.x + this.width / 2,
      y: this.body.position.y + this.height / 2
    }
  }

  moveLeft(x) {
    Body.translate(this.body, {
      x: -x,
      y: 0
    });
  }

  moveRight(x) {
    Body.translate(this.body, {
      x: x,
      y: 0
    });
  }
  
  translate(x, y) {
    Body.translate(this.body, {
      x: x,
      y: y
    });
  }

  isStatic() {
    return this.body.isStatic;
  }

  setStatic(s) {
    Body.setStatic(this.body, s);
  }

  removeFromWorld() {
    World.remove(world, this.body);
  }
}