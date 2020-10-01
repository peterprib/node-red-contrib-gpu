const assert=require('assert');
const GPU=require("../gpu");
const gpu= new GPU();

describe("get heatmap", function() {
	it("test", function(done) {
		const test=gpu.getHeatMap([[1,0.5,0],[1,0.5,0],[1,0.5,0]]);
		done();
	});
});