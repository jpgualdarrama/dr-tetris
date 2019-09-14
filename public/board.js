/*jshint esversion: 8 */

class Board {

    constructor(w, h, num_pills_x, num_pills_y) {
        const floor_height = 10;
        const SCORE_PREFIX = "Score: ";

        this.width = w;
        this.height = h - floor_height;

        var num_boxes_x = num_pills_x * 2;
        var num_boxes_y = num_pills_y * 2;
        var boxes_width = this.width / num_boxes_x;
        var boxes_height = this.height / num_boxes_y;

        // 2-d array [num_boxes_x][num_boxes_y]
        this.grid = Grid.create(num_boxes_x, num_boxes_y, boxes_width, boxes_height);

        // class that contains all the functions related to manupulating the array of pills
        this.pill_manager = new PillManager(boxes_width, boxes_height);

        this.player_manager = new PlayerManager(boxes_width, boxes_height);

        this.bottom = new Box(0, height - floor_height,
                              width, floor_height, color(0, 0, 0));
        Body.setStatic(this.bottom.body, true);

        this.score = 0;

        this.score_para = createP('');
        this.score_prefix = SCORE_PREFIX;
    }

    addPill(grid_i, grid_j, dir, c1, c2) {
        if (BOARD_DEBUG.ADD_PILL) {
            debug("Board.addPill")
            debug("grid_i = ", grid_i)
            debug("grid_j = ", grid_j)
            debug("dir = ", dir)
        }

        const top_left = this.grid.crToPosition(grid_i, grid_j);
        this.pill_manager.addPill(top_left.x, top_left.y,
                                  c1, c2, dir);

        const last_index = this.pill_manager.length() - 1;
        if (BOARD_DEBUG.ADD_PILL) {
            debug("Newly added Pill")
            debug(this.pill_manager.getPill(last_index))
        }
        this.grid.addPill(grid_i, grid_j, last_index, this.pill_manager.getPill(last_index));

        if (BOARD_DEBUG.ADD_PILL) {
            debug("Board.addPill - this.grid at end of function")
            debug(this.grid)
        }
    }

    // creates a pill for the player to place in the board
    createPlayerPill(dir, c1, c2) {
        if (dir === undefined) {
            dir = (random(2) >= 1) ? Direction.Horizontal : Direction.Vertical;
        }

        if (c1 === undefined) {
            const r = int(random(1) * (pill_colors.length));
            c1 = pill_colors[r];
        }

        if (c2 === undefined) {
            const r2 = int(random(1) * (pill_colors.length));
            c2 = pill_colors[r2];
        }

        const player_x = this.grid.properties.sizes.x *
              (this.grid.properties.divisions.x - 2) / 2;
        const player_y = 0;

        this.player_manager.createPlayer(
            player_x, player_y,
            c1, c2, dir
        );
    }

    draw() {
        this.bottom.draw();
        if (this.player_manager.exists()) {
            this.player_manager.draw();
        }
        this.pill_manager.draw();

        if (DEBUGGING) {
            line(0, this.height / 2, this.width, this.height / 2);
            line(this.width / 2, 0, this.width / 2, this.height);
            this.grid.draw();
        } // if DEBUGGING
    } // draw

    // one clock tick
    // move pills down by one box (half-pill) if possible
    tick() {
        this.updateBlocks();
        this.updatePlayer();
        this.removeLines();
        if (BOARD_DEBUG.TICK) {
            debug("Board.tick before descend - grid")
            debug(this.grid)
            debug("Board.tick before descend - pills")
            debug(this.pill_manager.pills)
        }
        
    }

    updatePlayer() {
        this.player_manager.update()
        this.setStaticStateForPlayer();
        this.descendPlayer();
        if (this.player_manager.exists() &&
            this.player_manager.isStatic()) {
            this.convertPlayerToBoardPill();
            this.createPlayerPill();
        }
    }

    updateBlocks() {
        this.pill_manager.update();
        this.setStaticStateForBlocks();
        this.descendBlocks();
    }

    setStaticStateIfAtBottom(pill) {
        if(BOARD_DEBUG.SET_STATIC_STATE_IF_AT_BOTTOM) {
            debug("Board.setStaticStateIfAtBottom");
        }
        const pill_at_bottom = (this.atBottom(pill.bottomLeft()));
        const pill_is_static = (pill.isStatic());
        if(BOARD_DEBUG.SET_STATIC_STATE_IF_AT_BOTTOM) {
            debug("Pill at bottom?=", pill_at_bottom, ", Pill is static?=", pill_is_static)
        }

        if (pill_at_bottom && !pill_is_static) {
            pill.setStatic(true);
        }
    } // setStaticStateIfAtBottom

    setStaticStateIfBelowAreStatic(c, r, pill) {
        if(BOARD_DEBUG.SET_STATIC_STATE_IF_BELOW_ARE_STATIC) {
            debug("Board.setStaticStateIfBelowAreStatic")
        }
        
        var indices_below_player;
        if (pill === undefined) {
            if (!this.grid.cellContainsBox(c, r)) { return }
            const pill_index_at_ij = this.grid.get(c, r, 'index')
            pill = this.pill_manager.getPill(pill_index_at_ij);
            indices_below_player = this.grid.getPillIndicesBelow(c, r);
        } else {
            indices_below_player = this.grid.getPillIndicesBelow(c, r, pill.dir);
        }
        // Set the static flag to false initially so any changes
        // in the loop so no extra checking will have to be done
        // after the loop.
        pill.setStatic(false);
        if(BOARD_DEBUG.SET_STATIC_STATE_IF_BELOW_ARE_STATIC) {
            debug("Indices below [c=", c, "][r=", r, "] = ")
            debug(indices_below_player);
        }

        for (var i = 0; i < indices_below_player.length; i++) {
            var pill_below_index = indices_below_player[i];
            if (pill_below_index > -1) {
                if (this.pill_manager.isStatic(pill_below_index)) {
                    if (BOARD_DEBUG.SET_STATIC_STATE_FOR_GRID_CELL) {
                        debug("Setting pill at [c=", c, "][r=", r, "] to static")
                    }
                    pill.setStatic(true);
                } // if is static
            } // if index > -1
        } // for var i
    } // setStaticStateIfBelowAreStatic

    // this function breaks out the setting of the isStatic field
    // into its own function
    setStaticStateForBlocks() {
        if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
            debug("Board.setStaticStateForBlocks()");
        }
        // Keep track of the pills that are checked, so that when we get
        // to the second block (upper for vertical, right for horizontal)
        // we don't recheck it
        var pill_indices_checked = new Map();

        // Check all rows
        // If any pill has another pill below it that is static,
        // set the pill to static
        // Iterate over the rows from the bottom to the top, so
        // we can be sure that lower pills get marked as static or
        // not static before they are checked
        for (var r = this.grid.properties.divisions.y - 1; r >= 0; r--) {
            for (var c = 0; c <= this.grid.properties.divisions.x - 2; c++) {
                // if there's no pill at this location, just move on
                if (!this.grid.cellContainsBox(c, r)) {
                    continue;
                }

                if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
                    debug("SET_STATIC_BLOCKS = [c=", c, "][r=", r, "]");
                }
                var pill_index_at_ij = this.grid.get(c, r, 'index');
                if (pill_indices_checked.check(pill_index_at_ij)) {
                    if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
                        debug("SET_STATIC_BLOCKS = PILL STATIC STATE ALREADY SET");
                    }
                    continue;
                }

                if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
                    debug("SET_STATIC_BLOCKS = PILL STATIC STATE BEFORE IF AT BOTTOM=",
                          this.pill_manager.getPill(pill_index_at_ij).isStatic());
                }
                this.pill_manager.setStatic(pill_index_at_ij, false);
                this.setStaticStateIfAtBottom(this.pill_manager.getPill(pill_index_at_ij));
                if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
                    debug("SET_STATIC_BLOCKS = PILL STATIC STATE AFTER IF AT BOTTOM=",
                          this.pill_manager.getPill(pill_index_at_ij).isStatic());
                }
                // only try setting it if the first function didn't set it
                if (!this.pill_manager.isStatic(pill_index_at_ij)) {
                    this.setStaticStateIfBelowAreStatic(c, r);
                }
                if(BOARD_DEBUG.SET_STATIC_STATE_FOR_BLOCKS) {
                    debug("SET_STATIC_BLOCKS = PILL STATIC STATE AT END=",
                          this.pill_manager.getPill(pill_index_at_ij).isStatic());
                }
            } // for var c
        } // for var r
        return pill_indices_checked;
    } // setStaticStateForBlocks

    // this function breaks out the setting of the isStatic field
    // into its own function
    setStaticStateForPlayer() {
        if(BOARD_DEBUG.SET_STATIC_STATE_FOR_PLAYER) {
            debug("Board.setStaticStateForPlayer");
        }
        
        if(BOARD_DEBUG.SET_STATIC_STATE_FOR_PLAYER) {
            debug("SET_STATIC_PLAYER = PLAYER STATIC STATE BEFORE IF AT BOTTOM=",
                  this.player_manager.player.isStatic());
        }
        
        if (!this.player_manager.exists()) { return }

        this.setStaticStateIfAtBottom(this.player_manager.player);
        if(BOARD_DEBUG.SET_STATIC_STATE_FOR_PLAYER) {
            debug("SET_STATIC_PLAYER = PLAYER STATIC STATE AFTER IF AT BOTTOM=",
                  this.player_manager.player.isStatic());
        }
        
        if (this.player_manager.isStatic()) { return }

        // check if the pills below the player are static
        var player_c = this.grid.xPositionToColumn(this.player_manager.bottomLeft().x)
        var player_r = this.grid.yPositionToRow(this.player_manager.bottomLeft().y);

        this.setStaticStateIfBelowAreStatic(player_c, player_r-1, this.player_manager.player);

        if(BOARD_DEBUG.SET_STATIC_STATE_FOR_PLAYER) {
            debug("SET_STATIC_PLAYER = PLAYER STATIC STATE AT END=",
                  this.player_manager.player.isStatic());
        }

    } // setStaticStateForPlayer

    canHorizontalPillDescend(c, r) {
        // horizontal pills should descend if:
        // 1. The pill is not marked static, and
        // 2. If there is a pill in either of the two grid below
        //    that is not the current pill and is not marked static
        var pill_index_at_CL = this.grid.get(c, r, 'index') // current_left
        var pill_index_at_CR = this.grid.get(c+1, r, 'index') // current_right

        var pill_exists_CL = (pill_index_at_CL > -1);
        var pill_exists_CR = (pill_index_at_CR > -1);

        var pill_CL_is_static = (pill_exists_CL) ? this.pill_manager.isStatic(pill_index_at_CL) : false;
        var pill_CR_is_static = (pill_exists_CR) ? this.pill_manager.isStatic(pill_index_at_CR) : false;

        var pill_exists_BL = this.grid.cellContainsBox(c, r + 1); // below left
        var pill_exists_BR = this.grid.cellContainsBox(c + 1, r + 1); // below right
        var pill_BL_is_static = this.pillBelowIsStatic(c, r);
        var pill_BR_is_static = this.pillBelowIsStatic(c + 1, r);
        
        var pill_CR_same_as_CL = (pill_index_at_CL === pill_index_at_CR);
        var pill_BL_same_as_CL = this.pillBelowIsCurrent(c, r);
        var pill_BR_same_as_CR = this.pillBelowIsCurrent(c + 1, r);

        var pill_can_descend = true;
        if(pill_exists_CL && pill_CL_is_static) {
            pill_can_descend = false;
        } else if(pill_exists_CR && pill_CR_is_static) {
            pill_can_descend = false;
        } else if(pill_exists_CL && !pill_CL_is_static && pill_exists_BL && pill_BL_is_static) {
            pill_can_descend = false;
        } else if(pill_exists_CR && pill_CR_same_as_CL && !pill_CR_is_static && pill_exists_BR &&
                  pill_BR_is_static) {
            pill_can_descend = false;
        }
        return pill_can_descend;

        /*
        var left_box_can_descend = pill_exists_BL && !pill_BL_same_as_CL &&
            !pill_BL_is_static && (pill_index_at_CL != -1);
        var right_box_can_descend = pill_exists_BR && !pill_BR_same_as_CR &&
            !pill_BR_is_static && (pill_index_at_CR != -1);

        if(pill_exists_BL && pill_exists_BR) {
            return left_box_can_descend && right_box_can_descend && !pill_CL_is_static;
        } else if(pill_exists_BL && !pill_exists_BR) {
            return left_box_can_descend && !pill_CL_is_static;
        } else if(!pill_exists_BL && pill_exists_BR) {
            return right_box_can_descend && !pill_CL_is_static;
        } else {
            return !pill_CL_is_static;
        }
        */
    } // canHorizontalPillDescend

    canVerticalPillDescend(c, r) {
        // vertical pills should descend if:
        // 1. The pill is not marked static, and
        // 2. If there is a pill in the grid below that is not the current pill,
        //    the pill below is not marked static
        var pill_index_at_ij = this.grid.get(c, r).index;
        var pill_is_static = this.pill_manager.isStatic(pill_index_at_ij);
        var pill_exists_below_current = this.grid.cellContainsBox(c, r + 1);
        var pill_below_is_current = this.pillBelowIsCurrent(c, r);
        var pill_below_is_static = this.pillBelowIsStatic(c, r);
        let pill_can_descend = false;
        // TODO: Fix this
        if(!pill_exists_below_current && !pill_is_static) {
            pill_can_descend = true;
        } else {
            pill_can_descend = pill_exists_below_current && !pill_below_is_current
                && !pill_below_is_static && !pill_is_static;
        }
        return pill_can_descend;
    } // canVerticalPillDescend

    // this method descends blocks by one block until no more blocks
    // can move
    // returns true if blocks were descended, false otherwise
    descendBlocks() {
        if (BOARD_DEBUG.DESCEND_BLOCKS) {
            debug("Board.descendBlocks")
        }
        // use this object to keep track of pill indices that were already checked
        var pill_indices_checked_map = new Map();
        // use this object to keep track of pill indices that were already moved
        var pill_indices_moved_map = new Map();
        // use this object as the grid to store the updated boxes until the end
        var new_grid = this.grid.copy();

        // check each row for blocks that should descend
        for (var r = this.grid.properties.divisions.y - 1; r >= 0; r--) {
            for (var c = 0; c <= this.grid.properties.divisions.x - 2; c++) {
                // don't do anything if there's no pill at [c][r]
                if(!this.grid.cellContainsBox(c, r)) {
                    continue;
                }
                var pill_index_at_ij = this.grid.get(c, r).index;

                if (BOARD_DEBUG.DESCEND_BLOCKS) {
                    debug("LOOP START - INDEX GOOD: [c=", c, "][r=", r, "].index=", pill_index_at_ij)
                }
                if (pill_indices_checked_map.check(pill_index_at_ij)) {
                    continue;
                }
                // at this point we know that the pill_index_at_ij is not in the
                // checked map, so add it
                if (BOARD_DEBUG.DESCEND_BLOCKS) {
                    debug("LOOP - ADDING INDEX TO MAP  [c=", c, "][r=", r, "].index=", pill_index_at_ij)
                }
                // because this loop is iterating bottom to top and left to right,
                // this will always get to the lower box of a vertical pill first.
                // for that reason, it is okay to just check the box right below
                // [c][r]
                var descend = (this.pill_manager.isHorizontal(pill_index_at_ij)) ?
                    this.canHorizontalPillDescend(c, r) :
                    (this.pill_manager.isVertical(pill_index_at_ij)) ?
                    this.canVerticalPillDescend(c, r) :
                    false;

                if (BOARD_DEBUG.DESCEND_BLOCKS) {
                    debug("LOOP - DESCEND=", descend);
                }

                if(!descend) { continue; }

                // for horizontal pills, check if this.grid[grid_i][grid_j+1]
                // has a pill in it
                // for vertical pills, check if this.grid[grid_i][grid_j+1] has a
                // pill in it. if there is, check to see if it's the same pill,
                // as it will be when we hit the second box of the pill
                if (!pill_indices_moved_map.check(pill_index_at_ij)) {
                    if (BOARD_DEBUG.DESCEND_BLOCKS) {
                        debug("LOOP - DESCENDING PILL: c=", c, "][r=", r, "], index=", pill_index_at_ij)
                    }
                    this.descendBoardPill(new_grid, pill_index_at_ij, c, r);
                    if (BOARD_DEBUG.DESCEND_BLOCKS) {
                        debug("AFTER descendBoardPill - New Grid")
                        debug(new_grid)
                    }
                } else {
                    if (BOARD_DEBUG.DESCEND_BLOCKS) {
                        debug("LOOP - PILL ALREADY MOVED: c=", c, "][r=", r, "], index=", pill_index_at_ij)
                    }
                } // if already moved
            } // for
        } // for

        // set this.grid to the updated grid
        this.grid = new_grid;
    } // descendBlocks

    descendBoardPill(new_grid, pill_index, c, r) {
        if (BOARD_DEBUG.DESCEND_BOARD_PILL) {
            debug("Board.descendBoardPill")
        }
        const box1 = this.pill_manager.getBox(pill_index, BoxID.Box1);
        const box2 = this.pill_manager.getBox(pill_index, BoxID.Box2);
        const has_box1 = box1 !== undefined;
        const has_box2 = box2 !== undefined;

        var pill_boxes_old_positions = {
            box1: (has_box1) ? box1.topLeft() : undefined,
            box2: (has_box2) ? box2.topLeft() : undefined
        }

        this.pill_manager.descend(pill_index);

        var pill_boxes_new_positions = {
            box1: (has_box1) ? box1.topLeft() : undefined,
            box2: (has_box2) ? box2.topLeft() : undefined
        }

        if(has_box1) {
            this.updateBoxLocationInGrid(new_grid, pill_index, BoxID.Box1,
                                         pill_boxes_old_positions.box1, pill_boxes_new_positions.box1)
        }

        if(has_box2) {
            this.updateBoxLocationInGrid(new_grid, pill_index, BoxID.Box2,
                                         pill_boxes_old_positions.box2, pill_boxes_new_positions.box2)
        }

        if (BOARD_DEBUG.DESCEND_BOARD_PILL) {
            debug("new_grid at the end of descendBoardPill")
            debug(new_grid)
        }
    } // descendBoardPill

    // The functionality encapsulated in this function is the movement of data
    // from one cell in the grid to another for a single Box
    updateBoxLocationInGrid(grid, pill_index, box_id, pill_box_old_pos, pill_box_new_pos) {
        const box = this.pill_manager.getBox(pill_index, box_id);
        if (box === undefined) {
            return;
        }

        const dir = this.pill_manager.getDir(pill_index);
        const pill_box_color = box.fill_color;
        const pill_box_old_cr = grid.positionToCR(pill_box_old_pos.x, pill_box_old_pos.y);
        const pill_box_new_cr = grid.positionToCR(pill_box_new_pos.x, pill_box_new_pos.y);

        if (BOARD_DEBUG.DESCEND_BOARD_PILL) {
            debug("descendBoardPill - Updating Box2")
            debug("\tpill_box2_old_c: ", pill_box_old_cr.c, ", pill_box2_old_r: ", pill_box_old_cr.r)
            debug("\pill_box2_new_c: ", pill_box_new_cr.c, ", pill_box2_new_r: ", pill_box_new_cr.r)
        }
        grid.clearCell(pill_box_old_cr.c, pill_box_old_cr.r)
        grid.set(pill_box_new_cr.c, pill_box_new_cr.r, pill_index,
                 color(pill_box_color), box_id, dir);
    } // updateBoxLocationInGrid

    // use this method to descend a single box from a
    //  pill in the pill_manager without relying on the grid
    descendPillBox(grid_c, grid_r, box_id, pill_index) {
        // console.log("DPB1")
        if(pill_index === undefined) {
           let pill_index = this.grid.get(grid_c, grid_r, 'index')
        }
        // console.log("DPB2")
        const pill_below_is_static = this.pillBelowIsStatic(grid_c, grid_r)
        // console.log("DPB3")
        const pill_below_is_current = this.pillBelowIsCurrent(grid_c, grid_r);
        // console.log("DPB4")
        const box_at_bottom = this.pillBoxIsAtBottom(grid_c, grid_r, box_id);
        // console.log("DPB5")
        if (!box_at_bottom && !pill_below_is_static && !pill_below_is_current) {
            // console.log("DPB6")          
            this.pill_manager.descend(pill_index)
        }
    } // descendPillBox

    pillBelowIsStatic(grid_c, grid_r) {
        const pill_exists_below = this.grid.cellContainsBox(grid_c, grid_r + 1);
        if(!pill_exists_below) {
            return false;
        }
        
        const pill_below_is_static = (pill_exists_below &&
                                      this.pill_manager.isStatic(this.grid.get(grid_c, grid_r + 1, 'index')));
        return pill_below_is_static;
    }

    pillBelowIsCurrent(grid_c, grid_r) {
        const pill_index = this.grid.get(grid_c, grid_r, 'index')
        const pill_exists_below = this.grid.cellContainsBox(grid_c, grid_r + 1);
        if(!pill_exists_below) {
            return false;
        }
        const pill_below_is_current = (pill_exists_below &&
                                       this.grid.get(grid_c, grid_r + 1, 'index') === pill_index);
        return pill_below_is_current;
    }

    pillBoxIsAtBottom(grid_c, grid_r, box_id) {
        // console.log("PBIAB(grid_c=", grid_c, ", grid_r=", grid_r, ", box_id=", box_id)
        const pill_index = this.grid.get(grid_c, grid_r, 'index')
        if(!this.pill_manager.validIndex(pill_index)) {
            return false;
        }
        // console.log("pill_index=", pill_index)
        const box = this.pill_manager.getBox(pill_index, box_id);
        const box_at_bottom = (box !== undefined && this.atBottom(box.bottomLeft()));
        return box_at_bottom;
    }

    atBottom(xy_pair) {
        return (xy_pair.y >= this.height);
    }

    // this method checks if there are any lines of 4 or more
    // blocks of the same color and clears them
    removeLines() {
        if (BOARD_DEBUG.REMOVE_LINES) {
            debug("Board.removeLines")
        }
        
        // get all lines
        var lines = this.grid.calculateLines();

        if (BOARD_DEBUG.REMOVE_LINES) {
            debug(lines)
        }

        for (var i = lines.length - 1; i >= 0; i--) {
            var box_indices = lines[i].box_indices;
            if (BOARD_DEBUG.REMOVE_LINES) {
                debug("lines[", i, "].#boxes=", box_indices.length)
            }

            // Only remove lines that are at least 4 boxes long
            if (box_indices.length >= 4) {
                this.removeLine(lines[i]);

                // remove the line from this.lines
                lines.splice(i, 1);

                this.addScore(box_indices.length - 3);
            } // if length >= 4
        } // for each line

        if (BOARD_DEBUG.REMOVE_LINES) {
            debug("AFTER LINE REMOVAL:")
            debug("GRID:")
            debug(this.grid)
            debug("PILLS:")
            debug(this.pill_manager.pills)
            debug("LINES:")
            debug(lines)
        }
    } // removeLines
    
    // remove a single line
    removeLine(line) {
        const box_indices = line.box_indices;
        if (BOARD_DEBUG.REMOVE_LINE) {
            debug("Removing the following grid entries")
            debug(box_indices)
        }
        // Remove boxes in pill objects that are part of the line
        for (var box_index = 0; box_index < box_indices.length; box_index++) {
            const grid_c = box_indices[box_index].x
            const grid_r = box_indices[box_index].y
            const pill_index = this.grid.get(grid_c, grid_r, 'index')
            const box_id = this.grid.get(grid_c, grid_r, 'boxID')

            if (BOARD_DEBUG.REMOVE_LINE) {
                debug("Box Index=", box_index,
                      "[c=", grid_c, "][r=", grid_r,
                      "], pill_index=", pill_index, ", box_id=", box_id)
            }

            this.grid.removeBox(grid_c, grid_r, this.pill_manager.isFlipped(pill_index), box_indices);
            this.pill_manager.removeBox(pill_index, box_id);
            // NOTE to self: I don't know why I was trying to descend a box after deleting it...
            // this.descendPillBox(grid_c, grid_r, box_id, pill_index);

            // if the pill has no boxes, remove it
            if(this.pill_manager.isEmpty(pill_index)) {
                this.pill_manager.removePill(pill_index);
                this.grid.removePillIndex(pill_index);
	    }

	} // for box_index
    } // removeLine

    // move the player independently of the other blocks, since the player
    // could move at a faster speed
    descendPlayer() {
	if (BOARD_DEBUG.DESCEND_PLAYER) {
	    debug("Board.descendPlayer")
	}

	if (!this.player_manager.exists() || this.player_manager.isStatic()) {
	    return false;
	}

	var player_c = this.grid.xPositionToColumn(this.player_manager.topLeft().x);
	var player_r = this.grid.yPositionToRow(this.player_manager.topLeft().y)

	// check to see if there's a box in any of the grid indices
	// below player
	if(this.grid.cellsBelowContainBoxes(player_c, player_r)) {
	    return false;
	}

	// if all the checks pass, move the player down
	this.player_manager.descend();
	return true;
    }

    convertPlayerToBoardPill() {
	const player_dir = this.player_manager.direction();
	const player_c = this.grid.xPositionToColumn(this.player_manager.topLeft().x);
	const player_r = this.grid.yPositionToRow(this.player_manager.topLeft().y);
	const player_c1 = this.player_manager.topLeftColor();
	const player_c2 = this.player_manager.bottomRightColor();

	if (this.grid.cellContainsBox(player_c, player_r)) {
	    throw ("ERROR: Board.convertPlayerToBoardPill - Attempting",
		   "to place pill at [c=", player_c, "][r=", player_r, ".",
		   " Another pill already exists there");
	}

	this.player_manager.removePlayer();
	this.addPill(player_c, player_r, player_dir,
		     player_c1, player_c2);
	
    }

    movePlayerLeft() {
	const player_c = this.grid.xPositionToColumn(this.player_manager.topLeft().x);
	if (this.grid.validColumn(player_c-1)) {
	    this.player_manager.moveLeft();
	}
    }

    movePlayerRight() {
	const player_c = this.grid.xPositionToColumn(this.player_manager.bottomRight().x);
	if (this.grid.validColumn(player_c)) {
	    this.player_manager.moveRight();
	}
    }

    rotatePlayerClockwise() {
	this.player_manager.rotateClockwise();
    }

    rotatePlayerCounterClockwise() {
	this.player_manager.rotateCounterClockwise();
    }

    addScore(scoreIncrements) {
	this.score += 10*scoreIncrements;
	this.score_para.html(this.score_prefix + this.score);
    }

    resetScore() {
	this.score = 0;
	this.score_para.html(this.score_prefix);
    }

    reset() {
	this.player_manager.reset();
	this.createPlayerPill();

	this.pill_manager.reset()

	this.grid.reset();

	this.resetScore();
    }
}
