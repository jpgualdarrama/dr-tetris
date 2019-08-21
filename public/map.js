class Map {
	constructor() {
		this.data = {};
	}
	
	check(index) {
		if (this.data[index] !== undefined) {
			return true;
		}
		this.data[index] = 1;
		return false;
	}
}