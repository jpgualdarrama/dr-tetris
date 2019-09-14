class PillManager {

    constructor(box_width, box_height) {
	this.pills = [];

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

    length() {
	return this.pills.length;
    }

    draw() {
	for (var i = 0; i < this.pills.length; i++) {
	    this.pills[i].draw();
	}
    }

    addPill(top_left_x, top_left_y, color1, color2, direction) {
	this.pills.push(new Pill(top_left_x, top_left_y,
				 this.pill_sizes[direction].w, this.pill_sizes[direction].h,
				 color1, color2, direction));
    }

    getPill(pill_index) {
	return this.pills[pill_index];
    }

    descend(pill_index) {
	this.pills[pill_index].descend();
    }

    isFlipped(pill_index) {
	return this.pills[pill_index].isFlipped();
    }

    isStatic(pill_index) {
	return this.pills[pill_index].isStatic();
    }

    isHorizontal(pill_index) {
	return this.getDir(pill_index) === Direction.Horizontal;
    }

    isVertical(pill_index) {
	return this.getDir(pill_index) === Direction.Vertical;
    }

    // returns true if the box1 and box2 for the pill at pill_index
    // are both undefined
    isEmpty(pill_index) {
	return this.getBox(pill_index, BoxID.Box1) === undefined &&
	    this.getBox(pill_index, BoxID.Box2) === undefined;
    }

    setStatic(pill_index, stat) {
        this.pills[pill_index].setStatic(stat);
    }

    getDir(pill_index) {
	return this.pills[pill_index].dir;
    }

    getBox(pill_index, box_id) {
	// console.log("getBox(pill_index=", pill_index, ", box_id=", box_id, ")")
	return (box_id === BoxID.Box1) ? this.pills[pill_index].box1 :
	    (box_id === BoxID.Box2) ? this.pills[pill_index].box2 :
	    undefined;
    }

    removeBox(pill_index, box_id) {
	this.pills[pill_index].removeBody(box_id);
	this.pills[pill_index].setStatic(false);
    }

    removePill(pill_index) {
	this.pills[pill_index].removeFromWorld();
	this.pills.splice(pill_index, 1);
    }

    update() {
	for (var i = 0; i < this.pills.length; i++) {
	    this.pills[i].update();
	}
    }

    validIndex(index) {
	return (index >= 0 && index < this.pills.length);
    }

    reset() {
	for(var i = 0; i < this.pills.length; i++) {
	    this.pills[i].removeFromWorld();
	}
	this.pills = [];
    }
}
