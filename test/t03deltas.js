const assert=require('assert');
const GPU=require("../gpu");
const gpu= new GPU();
gpu.setDebugOff()
const ar3c4=[[0,0,0,0],[1,2,3,4],[10,20,30,40]];
const ar4c4=[[0,0,0,0],[1,2,3,4],[10,20,30,40],[100,200,300,400]];
function test(a,e){
	it(a, function(done) {
		assert.equal(JSON.stringify(e),JSON.stringify(eval(a)));
		gpu.destroy();
		done();
	});
}
describe('matrix', function() {
	test("gpu.loadColumnsDelta(ar3c4)",[{"0":1,"1":2,"2":3,"3":4},{"0":9,"1":18,"2":27,"3":36}]); 
	test("gpu.loadColumnsDelta(ar4c4,null,null,2)",[[{"0":1,"1":2,"2":3,"3":4}],[{"0":90,"1":180,"2":270,"3":360}]]); 
	test("gpu.loadRowsDelta(ar3c4)",[{"0":0,"1":0,"2":0},{"0":1,"1":1,"2":1},{"0":10,"1":10,"2":10}]); 
	test("gpu.loadRowsDelta(ar4c4,null,null,2)",[[{"0":0},{"0":1},{"0":10},{"0":100}],[{"0":0},{"0":1},{"0":10},{"0":100}]]); 
});