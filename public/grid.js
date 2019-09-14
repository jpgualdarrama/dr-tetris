// just a wrapper for an x-y pair without all the stuff in p5.Vector
class XYPair {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static create(x, y) {
        return new XYPair(x, y);
    }
}

// just a wrapper for a grid entry
class GridEntry {
    constructor(index, clr, boxID, direction) {
        this.index = index;
        this.color = clr;
        this.boxID = boxID;
        this.direction = direction;
    }

    copy() {
        return new GridEntry(this.index, this.color, this.boxID, this.direction);
    }

    static blank() {
        return new GridEntry(-1, color(0, 0, 0), BoxID.BoxNA, Direction.Unknown);
    }

    static colorsMatch(ge1, ge2) {
        return (ge1.color.toString('#rrggbb') === ge2.color.toString('#rrggbb'));
          /*return (ge1.index === ge2.index &&
            ge1.direction === ge2.direction);*/
    }
}

// Many functions end up performing similar tasks, using the information
// stored in the grid. Make a class that encapsulates much of this behavior
class Grid {
    constructor(x_divisions, y_divisions, x_width, y_height) {
        this.divisions = {
            x: x_divisions,
            y: y_divisions
        }
        this.properties = {
            divisions: {
                x: x_divisions,
                y: y_divisions
            },
            sizes: {
                x: x_width,
                y: y_height
            }
        }
        this.data = [];
        this.initializeData(x_divisions, y_divisions);
    }

    static create(x_divisions, y_divisions, x_width, y_height) {
        return new Grid(x_divisions, y_divisions, x_width, y_height);
    }

    initializeData(x_divisions, y_divisions) {
        this.data = [];
        for (var i = 0; i < x_divisions; i++) {
            var tmp = [];
            for (var j = 0; j < y_divisions; j++) {
                tmp.push(new GridEntry(-1, color(0, 0, 0), BoxID.BoxNA, Direction.Unknown));
            }
            this.data.push(tmp);
        }
    }

    validColumn(c) {
        return (c >= 0 && c < this.divisions.x)
    }

    validRow(r) {
        return (r >= 0 && r < this.divisions.y)
    }

    validCell(c, r) {
        return this.validColumn(c) && this.validRow(r)
    }

    get(c, r, field) {
        // console.log("GET(c=", c, ", r=", r, ", field=", field)
        if (this.validCell(c, r)) {
            if(field !== undefined) {
                // console.log(this.data[c][r])
                return this.data[c][r][field];
            } else {
		return this.data[c][r];
	    }
	} else {
	    throw ("Grid.get - invalid indices (c=" + c + ",r=" + r + ")")
	}
    }

    set(c, r, pill_index, color, box_id, direction) {
	this.data[c][r] = new GridEntry(pill_index, color, box_id, direction);
    }

    copy() {
	var new_grid = new Grid(this.divisions.x, this.divisions.y, this.properties.sizes.x, this.properties.sizes.y)
	for (var i = 0; i < this.divisions.x; i++) {
	    for (var j = 0; j < this.divisions.y; j++) {
		new_grid.data[i][j] = this.data[i][j].copy();
	    }
	}
	return new_grid;
    }

    clearCell(c, r) {
	this.data[c][r] = GridEntry.blank();
    }

    xPositionToColumn(x) {
	return x / this.properties.sizes.x;
    }

    xColumnToPosition(c) {
	return c * this.properties.sizes.x;
    }

    yPositionToRow(y) {
	return y / this.properties.sizes.y;
    }

    yRowToPosition(r) {
	return r * this.properties.sizes.y;
    }

    positionToCR(x, y) {
	return {
	    c: this.xPositionToColumn(x),
	    r: this.yPositionToRow(y)
	}
    }

    crToPosition(c, r) {
	return {
	    x: this.xColumnToPosition(c),
	    y: this.yRowToPosition(r)
	}
    }

    cellContainsBox(c, r) {
	if(!this.validCell(c, r)) {
	    return false;
	}
	return (this.data[c][r] === undefined ||
		this.data[c][r].index > -1);
    }

    cellsBelowContainBoxes(c, r) {
	const indices_below_player = this.getPillIndicesBelow(c, r);

	// grid entry exists, so can't move
	for(var i = 0; i < indices_below_player.length; i++) {
	    if(this.cellContainsBox(indices_below_player[i].x, indices_below_player[i].y)) {
		return true;
	    }
	}
	return false;
    }

    descendBoxAt(c, r) {
	this.data[c][r] = this.data[c][r - 1].copy();
	this.data[c][r - 1] = GridEntry.blank();
    }

    removePillIndex(pill_index) {
	for (var grid_i = 0; grid_i < this.divisions.x; grid_i++) {
	    for (var grid_j = 0; grid_j < this.divisions.y; grid_j++) {
		// update all grid entries to reduce the index by one
		// if it was greater than pill_index
		if (this.data[grid_i][grid_j].index > pill_index) {
		    if (GRID_DEBUG.REMOVE_PILL_INDEX) {
			debug("REDUCING [c=", grid_i, "][r=", grid_j, "]")
		    }
		    this.data[grid_i][grid_j].index--;
		}
	    } // for grid_j
	} // for grid_i
    }

    cellsMatch(c1, r1, c2, r2) {
	if(!this.validCell(c1, r1) || !this.validCell(c2, r2)) {
	    if(GRID_DEBUG.CELLS_MATCH) {
		debug("[c1=", c1, "][r1=", r1, "], [c2=", c2, "][r2=", r2, "] - mismatch")
	    }
	    return false;
	}
	var cellA = this.data[c1][r1];
	var cellB = this.data[c2][r2];

	if(GRID_DEBUG.CELLS_MATCH) {
	    debug("cellA at [", c1, "][", r1, "]:")
	    debug(cellA)
	    debug("cellB at [", c2, "][", r2, "]:")
	    debug(cellB)
	}

	return (GridEntry.colorsMatch(cellA, cellB));

    }

    // checks if (c,r) and (c-1,r) match
    aboveMatchesCurrent(c, r) {
	return this.cellsMatch(c, r, c, r - 1)
    }

    // just a wrapper for cells match. Checks to see if the
    // cell to the right of (c,r),which is (c,r+1) matches (c,r)
    rightMatchesCurrent(c, r) {
	return this.cellsMatch(c, r, c + 1, r);
    }

    findLineEndingWithIndex(lines, c, r, dir) {
	for (var i = 0; i < lines.length; i++) {
	    var num_boxes = lines[i].box_indices.length;
	    if (lines[i].box_indices[num_boxes - 1].x === c &&
		lines[i].box_indices[num_boxes - 1].y === r &&
		lines[i].dir === dir) {
		return i;
	    }
	}
	return -1;
    }


    addNewLine(lines, color, dir) {
	lines.push({
	    box_indices: [],
	    color: color,
	    dir: dir
	});
    }

    appendToLine(line, c, r) {
	line.box_indices.push(
	    XYPair.create(c, r));
    }

    calculateLines() {
	var lines = [];

	if (GRID_DEBUG.CALCULATE_LINES) {
	    debug("Grid.calculateLines")
	}

	// build lines
	for (var r = this.divisions.y - 1; r >= 0; r--) {
	    for (var c = 0; c < this.divisions.x - 1; c++) {
		if (!this.cellContainsBox(c, r)) {
		    continue;
		}

		if (GRID_DEBUG.CALCULATE_LINES) {
		    debug("[c=", c, "][r=", r, "]")
		    debug("aboveMatchesCurrent - ", this.aboveMatchesCurrent(c, r))
		    debug("rightMatchesCurrent - ", this.rightMatchesCurrent(c, r));
		}

		var line_index;
		if (this.aboveMatchesCurrent(c, r)) {
		    line_index = this.findLineEndingWithIndex(lines, c, r, Direction.Vertical);
		    if (line_index > -1) {
			if (GRID_DEBUG.CALCULATE_LINES) {
			    debug("APPND VERT LINE[", line_index, "]: [c][r-1]=[", c, "][", r - 1, "]")
			}
			this.appendToLine(lines[line_index], c, r - 1)
		    } else {
			if (GRID_DEBUG.CALCULATE_LINES) {
			    debug("NEW VERT LINE: [c][r]=[", c, "][", r, "]; [c][r-1]=[", c, "][", r - 1, "]")
			}
			this.addNewLine(lines, this.data[c][r].color, Direction.Vertical)
			this.appendToLine(lines[lines.length - 1], c, r)
			this.appendToLine(lines[lines.length - 1], c, r - 1)
		    } // else
		} // if (aboveMatchesCurrent(c, r))

		if (this.rightMatchesCurrent(c, r)) {
		    line_index = this.findLineEndingWithIndex(lines, c, r, Direction.Horizontal);
		    if (line_index > -1) {
			if (GRID_DEBUG.CALCULATE_LINES) {
			    debug("APPND HRZN LINE[", line_index,
				  "]: [c+1][r]=[", c + 1, "][", r, "]")
			}
			this.appendToLine(lines[line_index], c + 1, r)
		    } else {
			if (GRID_DEBUG.CALCULATE_LINES) {
			    debug("NEW HRZN LINE: [c][r]=[", c, "][",
				  r, "]; [c+1][r]=[", c + 1, "][", r, "]")
			}
			this.addNewLine(lines, this.data[c][r].color, Direction.Horizontal)
			this.appendToLine(lines[lines.length - 1], c, r)
			this.appendToLine(lines[lines.length - 1], c + 1, r)
		    } // else
		} // if (doesRightMatchCurrent(c, r))
	    } // for
	} // for

	return lines;
    } // calculateLines

    addPill(c, r, pill_index, pill) {
	const dir = pill.dir;
	const c1 = pill.color1;
	const c2 = pill.color2;
	this.set(c, r, pill_index, c1, BoxID.Box1, dir);
	if (dir === Direction.Horizontal) {
	    this.set(c + 1, r, pill_index, c2, BoxID.Box2, dir)
	} else if (dir === Direction.Vertical) {
	    this.set(c, r + 1, pill_index, c2, BoxID.Box2, dir)
	}
    }

    // Two modes:
    // 1. Just pass (c, r) - looks up direction from this.data[c][r]
    // 2. Pass (c, r, dir) - intended for use when looking up grid
    //    indices below the player, which is not part of the grid,
    //    so its direction cannot be looked up
    getPillIndicesBelow(c, r, dir) {
	if(!this.validCell(c, r)) {
	    if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
		debug("Grid.getPillIndicesBelow(c=", c, ",r=", r,
		      ") - [c=", c, "][r=", r, "] not a valid cell");
	    }
	    return [];
	}
	
	if(dir === undefined) {
	    dir = this.data[c][r].direction;
	}

	if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
	    debug("Grid.getPillIndicesBelow(c=", c, ",r=", r,
		  ") - data[c][r] =");
	    debug(this.data[c][r]);
	}

	if(!this.validCell(c, r+1)) {
	    if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
		debug("Grid.getPillIndicesBelow(c=", c, ",r=", r,
		      ") - [c=", c, "][r+1=", (r+1), "] not a valid cell");
	    }
	    return [];
	}

	const pill_index_below_ij = this.get(c, r + 1).index
	if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
	    debug("pill_index_below_ij = ", pill_index_below_ij);
	}

	var indices_below_player = [];
	if (dir === Direction.Horizontal) {
	    indices_below_player.push(pill_index_below_ij);
	    if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
		debug("indices_below_player = ");
		debug(indices_below_player);
	    }
	    if(this.validCell(c+1, r+1)) {
		const pill_index_below_right = this.get(c + 1, r + 1).index
		if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
		    debug("pill_index_below_right = ", pill_index_below_right);
		}
		indices_below_player.push(pill_index_below_right);
		if(GRID_DEBUG.GET_PILL_INDICES_BELOW) {
		    debug("indices_below_player = ");
		    debug(indices_below_player);
		}
	    }
	} else if (dir === Direction.Vertical) {
	    indices_below_player.push(pill_index_below_ij);
	}

	return indices_below_player
    }

    removeBox(c, r, isFlipped, box_indices) {
	const pill_index = this.data[c][r].index;
	const box_id = this.data[c][r].boxID;
	const dir = this.data[c][r].direction;

	// reset grid entry
	this.clearCell(c, r)

	// move the grid entries for the other box for the current pill, if it exists
	if (dir === Direction.Horizontal) {
	    // No need to do anything, the other box of the pill does not
	    // have to move
	} else if (dir === Direction.Vertical) {
	    // only move Box 2 if it above Box 1
	    if (box_id === BoxID.Box1 && isFlipped) {
                /*
		if (box_indices.find(e => (e.x === c && e.y === r - 1)) === undefined) {
		    this.descendBoxAt(c, r - 1);
		}
                */
	    // only have to move Box 1 if Box 2 is below it
	    } else if (box_id === BoxID.Box2 && !isFlipped) {
                /*
                if (box_indices.find(e => (e.x === c && e.y === r - 1)) === undefined) {
                    this.descendBoxAt(c, r - 1);
                }
                */
	    } // else if
	} // if/else if direction
    } // removeBox

    draw() {
	for (var i = 0; i < this.properties.divisions.x; i++) {
	    for (var j = 0; j < this.properties.divisions.y; j++) {
		// vertical
		line(this.xColumnToPosition(i),
		     this.yRowToPosition(j),
		     this.xColumnToPosition(i),
		     this.yRowToPosition(j + 1));
		// vertical
		line(this.xColumnToPosition(i),
		     this.yRowToPosition(j),
		     this.xColumnToPosition(i + 1),
		     this.yRowToPosition(j));
	    } // for j
	} // for i
    }

    reset() {
	this.initializeData(this.properties.divisions.x,
			    this.properties.divisions.y);
    }
}
