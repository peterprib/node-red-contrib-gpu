const assert=require('assert');
const GPU=require("../gpu");
const gpu= new GPU();
const a4=[0,1,2,3];
//const a4b1=[true,false,true,false];
//const a4b2=[false,false,true,true];
const ac4=[[1,2,3,4]];
const ar4=[[1],[2],[3],[4]];
const ar3c3=[[1,2,3],[10,20,30],[100,200,300]];
const ar4c3=[[1,0,0],[1,2,3],[10,20,30],[100,200,300]];
const ar3c4=[[0,0,0,0],[1,2,3,4],[10,20,30,40]];
const ar6c2=[[0,0],[0,0],[1,2],[3,4],[10,20],[30,40]];
const az2r2c2=[ [[111,112],[121,122]], [[211,212],[221,222]] ];
const ar4c4=[[1,2,3,4],[11,12,13,14],[21,22,23,24],[31,32,33,34]];
function log(label,object){
	console.log(label+" "+JSON.stringify(object));
}
function testArrayFunction(f,l="az2r2c2,az2r2c2,1",a=az2r2c2,b=az2r2c2,r){
	const callFunction="array"+f,label=callFunction+" "+l;
	it(label, function(done) {
		if(r){	//using stringify as compare using Float32Array fails due to prototypes
			assert.equal(JSON.stringify(r),JSON.stringify(gpu[callFunction](a,b)));
		} else {
			log(label,gpu[callFunction](a,b));
		}
		 gpu.destroy();
		done();
	});
}
function test(l,a,e){
	it(l, function(done) {
		assert.equal(JSON.stringify(e),JSON.stringify(a));
		gpu.destroy();
		done();
	});
}
function assertEq(a,e){
	assert.equal(JSON.stringify(e),JSON.stringify(a));
}
describe('matrix', function() {
	it('load Columns', function(done) {
		assertEq(gpu.load(ar4c4),[{"0":1,"1":2,"2":3,"3":4},{"0":11,"1":12,"2":13,"3":14},{"0":21,"1":22,"2":23,"3":24},{"0":31,"1":32,"2":33,"3":34}]);
		assertEq(gpu.loadColumns(ar4c4,[2,3]),[{"0":3,"1":4},{"0":13,"1":14},{"0":23,"1":24},{"0":33,"1":34}]);
		assertEq(gpu.loadColumns(ar4c4,[2,3],false,2),[[{"0":3,"1":4},{"0":13,"1":14}],[{"0":23,"1":24},{"0":33,"1":34}]]);
		done();
	});
	it('load row', function(done) {
		assertEq(gpu.loadRows(ar4c4),[{"0":1,"1":2,"2":3,"3":4},{"0":11,"1":12,"2":13,"3":14},{"0":21,"1":22,"2":23,"3":24},{"0":31,"1":32,"2":33,"3":34}]);
		done();
	});
	it('load row 2,3', function(done) {
		assertEq(gpu.loadRows(ar4c4,[2,3]),[{"0":21,"1":22,"2":23,"3":24},{"0":31,"1":32,"2":33,"3":34}]);
		done();
	});
	it('load row 2,3 block 2', function(done) {
		assertEq(gpu.loadRows(ar4c4,[2,3],false,2),[[{"0":21,"1":22},{"0":31,"1":32}],[{"0":23,"1":24},{"0":33,"1":34}]]);
		done();
	});
	it('transpose', function(done) {
		assertEq(gpu.matrixTranspose(ar4c3),[{"0":1,"1":1,"2":10,"3":100},{"0":0,"1":2,"2":20,"3":200},{"0":0,"1":3,"2":30,"3":300}]);
		done();
	});
	it('add', function(done) {
		assertEq(gpu.arrayAdd(a4,a4),Float32Array.of(0,2,4,6));
		assertEq(gpu.arrayAdd(ar3c3,ar3c3),[Float32Array.of(2,4,6),Float32Array.of(20,40,60),Float32Array.of(200,400,600)]);
		assertEq(gpu.arrayAdd(az2r2c2,az2r2c2),[[{"0":222,"1":224},{"0":242,"1":244}],[{"0":422,"1":424},{"0":442,"1":444}]]);
		done();
	});
	testArrayFunction("Add","1,az2r2c2",1,az2r2c2,[[{"0":112,"1":113},{"0":122,"1":123}],[{"0":212,"1":213},{"0":222,"1":223}]]);
	testArrayFunction("Minus","1,az2r2c2",1,az2r2c2,[[{"0":-110,"1":-111},{"0":-120,"1":-121}],[{"0":-210,"1":-211},{"0":-220,"1":-221}]]);
	testArrayFunction("Minus","az2r2c2,1",az2r2c2,1,[[{"0":110,"1":111},{"0":120,"1":121}],[{"0":210,"1":211},{"0":220,"1":221}]]);
	testArrayFunction("Minus",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
	testArrayFunction("Multiply",undefined,undefined,undefined,[[{"0":12321,"1":12544},{"0":14641,"1":14884}],[{"0":44521,"1":44944},{"0":48841,"1":49284}]]);
	testArrayFunction("Divide",undefined,undefined,undefined,[[{"0":1,"1":1},{"0":1,"1":1}],[{"0":1,"1":1},{"0":1,"1":1}]]);
	testArrayFunction("Remainder",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
	testArrayFunction("Power",undefined,undefined,undefined,[[{"0":null,"1":null},{"0":null,"1":null}],[{"0":null,"1":null},{"0":null,"1":null}]]);
	testArrayFunction("BitwiseAnd",undefined,undefined,undefined,[[{"0":111,"1":112},{"0":121,"1":122}],[{"0":211,"1":212},{"0":221,"1":222}]]);
	testArrayFunction("BitwiseOr",undefined,undefined,undefined,[[{"0":111,"1":112},{"0":121,"1":122}],[{"0":211,"1":212},{"0":221,"1":222}]]);
	testArrayFunction("BitwiseXOR",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
//	testArrayFunction("LogicalOr",a4b1,a4b2);
//	testArrayFunction("LogicalAnd",a4b1,a4b2);
//	testArrayFunction("Equal");
//	testArrayFunction("NotEqual");
//	testArrayFunction("StrictEqual");
//	testArrayFunction("GreaterThan");
//	testArrayFunction("LessThan");
//	testArrayFunction("GreaterOrEqual");
//	testArrayFunction("LessThanOrEqual");
	testArrayFunction("LeftShift",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
	testArrayFunction("RightShift",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
	testArrayFunction("RightShiftZeroFill",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);

	test("scalar multi 2xa4",gpu.matrixMultiple(2,a4),{"0":0,"1":2,"2":4,"3":6});
	test("scalar multi a4x2",gpu.matrixMultiple(a4,2),{"0":0,"1":2,"2":4,"3":6});
	test("scalar multi 2xar3c3",gpu.matrixMultiple(2,ar3c3), [{"0":2,"1":20,"2":200},{"0":4,"1":40,"2":400},{"0":6,"1":60,"2":600}]);

	test("multi ar3c3*ar3c3",gpu.matrixMultiple(ar3c3,ar3c3),[{"0":321,"1":642,"2":963},{"0":3210,"1":6420,"2":9630},{"0":32100,"1":64200,"2":96300}]);
//	testThrow("multi ac4*ac4",gpu.matrixMultiple(ac4,ac4),[{"0":10},{"0":10},{"0":10},{"0":10}]);
	test("multi ac4*ar4",gpu.matrixMultiple(ac4,ar4),[{"0":30,"1":24,"2":22,"3":24}]);
	test("multi ar4*ac4",gpu.matrixMultiple(ar4,ac4),[{"0":1},{"0":2},{"0":3},{"0":4}]);
//	testThrow("multi ar4*ar4",gpu.matrixMultiple(ar4,ar4),[{"0":1,"1":2,"2":3,"3":4}]);
//	testThrow("multi ac4*ar3c3",gpu.matrixMultiple(ar4,ar3c3),[{"0":321,"1":642,"2":963,"3":210},{"0":432,"1":864,"2":1296,"3":320},{"0":143,"1":286,"2":429,"3":430}]);
//	testThrow("multi ar4*ar3c3",gpu.matrixMultiple(ac4,ar3c3),[{"0":321},{"0":321},{"0":321}]);
//	testThrow("multi ar3c3*ar4",gpu.matrixMultiple(ar3c3,ar4),[{"0":1,"1":2,"2":3}]);
//	testThrow("multi ar3c3*ac4",gpu.matrixMultiple(ar3c3,ac4), [{"0":16,"1":32,"2":48},{"0":160,"1":320,"2":480},{"0":600,"1":1200,"2":1800},{"0":1,"1":2,"2":3}]);
	test("multi ar4c3*ar3c4",gpu.matrixMultiple(ar4c3,ar3c4),[{"0":0,"1":0,"2":0},{"0":32,"1":64,"2":96},{"0":320,"1":640,"2":960},{"0":3200,"1":6400,"2":9600}]);
	test("multi ar3c4*ar4c3",gpu.matrixMultiple(ar3c4,ar4c3),[{"0":0,"1":0,"2":0,"3":0},{"0":433,"1":864,"2":1296,"3":325},{"0":4330,"1":8640,"2":12960,"3":3250}]);

	test("sum Columns ar3c3",gpu.matrixSumColumns(ar3c3),{"0":111,"1":222,"2":333});
	test("sum Columns ar4c3",gpu.matrixSumColumns(ar4c3),{"0":112,"1":222,"2":333});
	test("sum Columns ar4c3 b2",gpu.matrixSumColumns(ar4c3,null,null,2),[{"0":2,"1":2,"2":3},{"0":110,"1":220,"2":330}]);
	test("sum Columns ar3c4",gpu.matrixSumColumns(ar3c4),{"0":11,"1":22,"2":33,"3":44});
	test("sum Rows ar3c3",gpu.matrixSumRows(ar3c3),{"0":6,"1":60,"2":600});
	test("sum Rows ar4c3",gpu.matrixSumRows(ar4c3),{"0":1,"1":6,"2":60,"3":600});
	test("sum Rows ar3c4",gpu.matrixSumRows(ar3c4),{"0":0,"1":10,"2":100});

	test("avg Columns ar3c3",gpu.matrixAvgColumns(ar3c3),{"0":37,"1":74,"2":111});
	test("avg Columns ar4c3",gpu.matrixAvgColumns(ar4c3),{"0":28,"1":55.5,"2":83.25});
	test("avg Columns ar3c4",gpu.matrixAvgColumns(ar3c4),{"0":3.6666667461395264,"1":7.333333492279053,"2":11,"3":14.666666984558105});
	test("avg Rows ar3c3",gpu.matrixAvgRows(ar3c3),{"0":2,"1":20,"2":200});
	test("avg Rows ar4c3",gpu.matrixAvgRows(ar4c3),{"0":0.3333333432674408,"1":2,"2":20,"3":200});
	test("avg Rows ar3c4",gpu.matrixAvgRows(ar3c4),{"0":0,"1":2.5,"2":25});

	test("range Columns ar3c3",gpu.matrixRangeColumns(ar3c3),[{"0":1,"1":100},{"0":2,"1":200},{"0":3,"1":300}]);
	test("range Columns ar4c3",gpu.matrixRangeColumns(ar4c3),[{"0":1,"1":100},{"0":0,"1":200},{"0":0,"1":300}]);
	test("range Columns ar3c4",gpu.matrixRangeColumns(ar3c4),[{"0":0,"1":10},{"0":0,"1":20},{"0":0,"1":30},{"0":0,"1":40}]);
	test("range Rows ar3c3",gpu.matrixRangeRows(ar3c3),[{"0":1,"1":3},{"0":10,"1":30},{"0":100,"1":300}]);
	test("range Rows ar4c3",gpu.matrixRangeRows(ar4c3),[{"0":0,"1":1},{"0":1,"1":3},{"0":10,"1":30},{"0":100,"1":300}]);
	test("range Rows ar3c4",gpu.matrixRangeRows(ar3c4),[{"0":0,"1":0},{"0":1,"1":4},{"0":10,"1":40}]);
	
	test("stats Columns ar3c3",gpu.matrixStatsColumns(ar3c3),[{"0":1,"1":100,"2":37,"3":44.69899368286133},{"0":2,"1":200,"2":74,"3":89.39798736572266},{"0":3,"1":300,"2":111,"3":134.0969696044922}]);
	test("stats Columns ar4c3",gpu.matrixStatsColumns(ar4c3),[{"0":1,"1":100,"2":28,"3":41.73128128051758},{"0":0,"1":200,"2":55.5,"3":83.7899169921875},{"0":0,"1":300,"2":83.25,"3":125.68487548828125}]);
	test("stats Columns ar3c4",gpu.matrixStatsColumns(ar3c4),[{"0":0,"1":10,"2":3.6666667461395264,"3":4.496912479400635},{"0":0,"1":20,"2":7.333333492279053,"3":8.99382495880127},{"0":0,"1":30,"2":11,"3":13.490736961364746},{"0":0,"1":40,"2":14.666666984558105,"3":17.98764991760254}]);
	test("stats Rows a8",gpu.matrixStatsRows([[10, 12, 23, 23, 16, 23, 21, 16]]),[{"0":10,"1":23,"2":18,"3":4.898979187011719}])
	test("stats Rows ar3c3",gpu.matrixStatsRows(ar3c3),[{"0":1,"1":3,"2":2,"3":0.8164967894554138},{"0":10,"1":30,"2":20,"3":8.164966583251953},{"0":100,"1":300,"2":200,"3":81.64966583251953}]);
	test("stats Rows ar4c3",gpu.matrixStatsRows(ar4c3),[{"0":0,"1":1,"2":0.3333333432674408,"3":0.4714045226573944},{"0":1,"1":3,"2":2,"3":0.8164967894554138},{"0":10,"1":30,"2":20,"3":8.164966583251953},{"0":100,"1":300,"2":200,"3":81.64966583251953}]);
	test("stats Rows ar3c4",gpu.matrixStatsRows(ar3c4),[{"0":0,"1":0,"2":0,"3":0},{"0":1,"1":4,"2":2.5,"3":1.1180340051651},{"0":10,"1":40,"2":25,"3":11.180339813232422}]);

	test("norms Rows ar3c3",gpu.matrixNormsRows(ar3c3),[{"0":2,"1":0.8164967894554138,"2":44.090782165527344},{"0":20,"1":8.164966583251953,"2":44.090789794921875},{"0":200,"1":81.64966583251953,"2":44.09080505371094}]);
	test("norms Rows ar4c3",gpu.matrixNormsRows(ar4c3),[{"0":0.3333333432674408,"1":0.4714045226573944,"2":7.071067810058594},{"0":2,"1":0.8164967894554138,"2":44.090782165527344},{"0":20,"1":8.164966583251953,"2":44.090789794921875},{"0":200,"1":81.64966583251953,"2":44.09080505371094}]);
	test("norms Rows ar3c4",gpu.matrixNormsRows(ar3c4),[{"0":0,"1":0,"2":null},{"0":2.5,"1":1.1180340051651,"2":53.66563415527344},{"0":25,"1":11.180339813232422,"2":53.66563415527344}]);
	test("norms Columns ar3c3",gpu.matrixNormsColumns(ar3c3),[{"0":37,"1":44.69899368286133,"2":8.157894134521484},{"0":74,"1":89.39798736572266,"2":8.157894134521484},{"0":111,"1":134.0969696044922,"2":8.1578950881958}]);
	test("norms Columns ar4c3",gpu.matrixNormsColumns(ar4c3),[{"0":28,"1":41.73128128051758,"2":11.45873737335205},{"0":55.5,"1":83.7899169921875,"2":11.335136413574219},{"0":83.25,"1":125.68487548828125,"2":11.335137367248535}]);
	test("norms Columns ar3c4",gpu.matrixNormsColumns(ar3c4),[{"0":3.6666667461395264,"1":4.496912479400635,"2":8.019338607788086},{"0":7.333333492279053,"1":8.99382495880127,"2":8.019338607788086},{"0":11,"1":13.490736961364746,"2":8.019340515136719},{"0":14.666666984558105,"1":17.98764991760254,"2":8.019338607788086}]);

	test("Moments Rows ar3c3",gpu.matrixMomentsRows(ar3c3),[{"0":2,"1":0.6666669845581055,"2":44.090782165527344},{"0":20,"1":66.66668701171875,"2":44.090789794921875},{"0":200,"1":6666.66796875,"2":44.09080505371094}]);
	test("Moments Rows ar4c3",gpu.matrixMomentsRows(ar4c3),[{"0":0.3333333432674408,"1":0.2222222238779068,"2":7.071067810058594},{"0":2,"1":0.6666669845581055,"2":44.090782165527344},{"0":20,"1":66.66668701171875,"2":44.090789794921875},{"0":200,"1":6666.66796875,"2":44.09080505371094}]);
	test("Moments Rows ar3c4",gpu.matrixMomentsRows(ar3c4),[{"0":0,"1":0,"2":null},{"0":2.5,"1":1.25,"2":53.66563415527344},{"0":25,"1":125,"2":53.66563415527344}]);
	test("Moments Columns ar3c3",gpu.matrixMomentsColumns(ar3c3),[{"0":37,"1":1998,"2":8.157894134521484},{"0":74,"1":7992,"2":8.157894134521484},{"0":111,"1":17982,"2":8.1578950881958}]);
	test("Moments Columns ar4c3",gpu.matrixMomentsColumns(ar4c3),[{"0":28,"1":1741.5,"2":11.45873737335205},{"0":55.5,"1":7020.75,"2":11.335136413574219},{"0":83.25,"1":15796.6875,"2":11.335137367248535}]);
	test("Moments Columns ar3c4",gpu.matrixMomentsColumns(ar3c4),[{"0":3.6666667461395264,"1":20.22222328186035,"2":8.019338607788086},{"0":7.333333492279053,"1":80.8888931274414,"2":8.019338607788086},{"0":11,"1":182,"2":8.019340515136719},{"0":14.666666984558105,"1":323.5555725097656,"2":8.019338607788086}]);

	test("Variance Rows ar3c3",gpu.matrixVarianceRows(ar3c3),{"0":0.6666669845581055,"1":66.66668701171875,"2":6666.66796875});
	test("Variance Rows ar4c3",gpu.matrixVarianceRows(ar4c3),{"0":0.2222222238779068,"1":0.6666669845581055,"2":66.66668701171875,"3":6666.66796875});
	test("Variance Rows ar3c4",gpu.matrixVarianceRows(ar3c4),{"0":0,"1":1.25,"2":125});
	test("Variance Rows ar6c2",gpu.matrixVarianceRows(ar6c2),{"0":0,"1":0,"2":0.25,"3":0.25,"4":25,"5":25});
	test("Variance Rows ar4c3 blocks 2",gpu.matrixVarianceRows(ar3c4,null,false,2),[{"0":0,"1":0.25,"2":25},{"0":0,"1":0.25,"2":25}]);

	
	test("Variance Columns ar3c3",gpu.matrixVarianceColumns(ar3c3),{"0":1998,"1":7992,"2":17982});
	test("Variance Columns ar4c3",gpu.matrixVarianceColumns(ar4c3),{"0":1741.5,"1":7020.75,"2":15796.6875});
	test("Variance Columns ar4c3 blocks 2",gpu.matrixVarianceColumns(ar4c3,null,false,2),[{"0":0,"1":1,"2":2.25},{"0":2025,"1":8100,"2":18225}]);
	test("Variance Columns ar3c4",gpu.matrixVarianceColumns(ar3c4),{"0":20.22222328186035,"1":80.8888931274414,"2":182,"3":323.5555725097656});

	test("matrixCovarianceRows ar3c3",gpu.matrixCovarianceRows(ar3c3),[{"0":0.6666669845581055,"1":6.666667938232422,"2":66.66668701171875},{"0":6.666667938232422,"1":66.66668701171875,"2":666.6669921875},{"0":66.66668701171875,"1":666.6669921875,"2":6666.66796875}]);
	test("matrixCovarianceRows ar4c3",gpu.matrixCovarianceRows(ar4c3),[{"0":0.2222222238779068,"1":-0.3333333432674408,"2":-3.3333334922790527,"3":-33.333335876464844},{"0":-0.3333333432674408,"1":0.6666669845581055,"2":6.666667938232422,"3":66.66668701171875},{"0":-3.3333334922790527,"1":6.666667938232422,"2":66.66668701171875,"3":666.6669921875},{"0":-33.333335876464844,"1":66.66668701171875,"2":666.6669921875,"3":6666.66796875}]);
	test("matrixCovarianceRows ar3c4",gpu.matrixCovarianceRows(ar3c4),[{"0":0,"1":0,"2":0},{"0":0,"1":1.25,"2":12.5},{"0":0,"1":12.5,"2":125}]);
	test("matrixCovarianceColumns ar3c3",gpu.matrixCovarianceColumns(ar3c3),[{"0":1998,"1":3996,"2":5994},{"0":3996,"1":7992,"2":11988},{"0":5994,"1":11988,"2":17982}]);
	test("matrixCovarianceColumns ar4c3",gpu.matrixCovarianceColumns(ar4c3),[
			{"0":1741.5,"1":3496.5,"2":5244.75},
			{"0":3496.5,"1":7020.75,"2":10531.125},
			{"0":5244.75,"1":10531.125,"2":15796.6875}
	]);
	test("matrixCovarianceColumns ar3c4",gpu.matrixCovarianceColumns(ar3c4),[{"0":20.22222328186035,"1":40.4444465637207,"2":60.666664123535156,"3":80.8888931274414},{"0":40.4444465637207,"1":80.8888931274414,"2":121.33332824707031,"3":161.7777862548828},{"0":60.666664123535156,"1":121.33332824707031,"2":182,"3":242.66665649414062},{"0":80.8888931274414,"1":161.7777862548828,"2":242.66665649414062,"3":323.5555725097656}]);

	test("matrixCorrelationRows ar3c3",gpu.matrixCorrelationRows(ar3c3),[{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1}]);	
//	test("matrixCorrelationRows ar4c3",gpu.matrixCorrelationRows(ar4c3),[{"0":1,"1":-0.866,"2":-0.866,"3":-0.866},{"0":-0.866,"1":1,"2":1,"3":1},{"0":-0.866,"1":1,"2":1,"3":1},{"0":-0.866,"1":1,"2":1,"3":1}]);
// seeems to be a bug so this form
	test("matrixCorrelationRows ar4c3",gpu.matrixCorrelationRows(ar4c3),[{"0":1,"1":-0.8660000562667847,"2":-0.8660000562667847,"3":-0.8660000562667847},{"0":-0.8660000562667847,"1":1,"2":1,"3":1},{"0":-0.8660000562667847,"1":1,"2":1,"3":1},{"0":-0.8660000562667847,"1":1,"2":1,"3":1}]);

	test("matrixCorrelationRows ar3c4",gpu.matrixCorrelationRows(ar3c4),[{"0":null,"1":null,"2":null},{"0":null,"1":1,"2":1},{"0":null,"1":1,"2":1}]);
	test("matrixCorrelationRows ar3c4 c2",gpu.matrixCorrelationRows(ar3c4,[0,2]),[{"0":null,"1":null},{"0":null,"1":1}]);
//		this.timeout(10000);
	test("matrixCorrelationColumns ar3c3",gpu.matrixCorrelationColumns(ar3c3),[{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1}]);
	test("matrixCorrelationColumns ar4c3",gpu.matrixCorrelationColumns(ar4c3),[{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1},{"0":1,"1":1,"2":1}]);
	test("matrixCorrelationColumns ar3c4",gpu.matrixCorrelationColumns(ar3c4),[{"0":1,"1":1,"2":1,"3":1},{"0":1,"1":1,"2":1,"3":1},{"0":1,"1":1,"2":1,"3":1},{"0":1,"1":1,"2":1,"3":1}]);
	test("matrixCorrelationColumns ar3c4 c2 ",gpu.matrixCorrelationColumns(ar3c4,[0,2]),[{"0":1,"1":1},{"0":1,"1":1}]);
	test("loadColumns ar4c2 c2 b2",gpu.loadColumns(ar4c3,[0,2],null,2),[[{"0":1,"1":0},{"0":1,"1":3}],[{"0":10,"1":30},{"0":100,"1":300}]]);
	test("matrixNormsColumns ar4c2 c2 b2",gpu.matrixNormsColumns(ar4c3,[0,2],null,2),[[{"0":1,"1":0,"2":null},{"0":1.5,"1":1.5,"2":4},{"0":5.5,"1":4.5,"2":5.49245548248291}],[{"0":55,"1":45,"2":5.49245548248291},{"0":165,"1":135,"2":5.492455005645752},{"0":55,"1":45,"2":5.49245548248291}]]);
	test("matrixCorrelationColumns ar4c2 c2 b2",gpu.matrixCorrelationColumns(ar4c3,[0,2],null,2),[[{"0":null,"1":1},{"0":null,"1":null}],[{"0":null,"1":null},{"0":null,"1":null}]]);
}); 