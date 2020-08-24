const assert=require('assert');
const GPU=require("../gpu");
const gpu= new GPU();
const a4=[0,1,2,3];
//const a4b1=[true,false,true,false];
//const a4b2=[false,false,true,true];
const ac4=[[1,2,3,4]];
const ar4=[[1],[2],[3],[4]];
const a33=[[1,2,3],[10,20,30],[100,200,300]];
const a34=[[1,0,0],[1,2,3],[10,20,30],[100,200,300]];
const a43=[[0,0,0,0],[1,2,3,4],[10,20,30,40]];
const a222=[ [[111,112],[121,122]], [[211,212],[221,222]] ];

function log(label,object){
	console.log(label+" "+JSON.stringify(object));
}
function testArrayFunction(f,l="a222,a222,1",a=a222,b=a222,r){
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
	it('transpose', function(done) {
		assertEq(gpu.matrixTranspose(a34),[]);
		done();
	});
	it('add', function(done) {
		assertEq(gpu.arrayAdd(a4,a4),Float32Array.of(0,2,4,6));
		assertEq(gpu.arrayAdd(a33,a33),[Float32Array.of(2,4,6),Float32Array.of(20,40,60),Float32Array.of(200,400,600)]);
		assertEq(gpu.arrayAdd(a222,a222),[[{"0":222,"1":224},{"0":242,"1":244}],[{"0":422,"1":424},{"0":442,"1":444}]]);
		done();
	});
	testArrayFunction("Add","1,a222",1,a222,[[{"0":112,"1":113},{"0":122,"1":123}],[{"0":212,"1":213},{"0":222,"1":223}]]);
	testArrayFunction("Minus","1,a222",1,a222,[[{"0":-110,"1":-111},{"0":-120,"1":-121}],[{"0":-210,"1":-211},{"0":-220,"1":-221}]]);
	testArrayFunction("Minus","a222,1",a222,1,[[{"0":110,"1":111},{"0":120,"1":121}],[{"0":210,"1":211},{"0":220,"1":221}]]);
	testArrayFunction("Minus",undefined,undefined,undefined,[[{"0":0,"1":0},{"0":0,"1":0}],[{"0":0,"1":0},{"0":0,"1":0}]]);
	testArrayFunction("Mulptiply",undefined,undefined,undefined,[[{"0":12321,"1":12544},{"0":14641,"1":14884}],[{"0":44521,"1":44944},{"0":48841,"1":49284}]]);
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
	test("scalar multi 2xa33",gpu.matrixMultiple(2,a33), [{"0":2,"1":20,"2":200},{"0":4,"1":40,"2":400},{"0":6,"1":60,"2":600}]);
	test("multi a33*a33",gpu.matrixMultiple(a33,a33),[{"0":321,"1":642,"2":963},{"0":3210,"1":6420,"2":9630},{"0":32100,"1":64200,"2":96300}]);
	test("multi ac4*ac4",gpu.matrixMultiple(ac4,ac4),[{"0":10},{"0":10},{"0":10},{"0":10}]);
	test("multi ac4*ar4",gpu.matrixMultiple(ac4,ar4),[{"0":1}]);
	test("multi ar4*ac4",gpu.matrixMultiple(ar4,ac4),[{"0":10,"1":20,"2":30,"3":40},{"0":10,"1":20,"2":30,"3":40},{"0":10,"1":20,"2":30,"3":40},{"0":10,"1":20,"2":30,"3":40}]);
	test("multi ar4*ar4",gpu.matrixMultiple(ar4,ar4),[{"0":1,"1":2,"2":3,"3":4}]);
	test("multi ac4*a33",gpu.matrixMultiple(ar4,a33),[{"0":321,"1":642,"2":963,"3":210},{"0":432,"1":864,"2":1296,"3":320},{"0":143,"1":286,"2":429,"3":430}]);
	test("multi ar4*a33",gpu.matrixMultiple(ac4,a33),[{"0":321},{"0":321},{"0":321}]);
	test("multi a33*ar4",gpu.matrixMultiple(a33,ar4),[{"0":1,"1":2,"2":3}]);
	test("multi a33*ac4",gpu.matrixMultiple(a33,ac4), [{"0":16,"1":32,"2":48},{"0":160,"1":320,"2":480},{"0":600,"1":1200,"2":1800},{"0":1,"1":2,"2":3}]);
	test("sum down a33",gpu.matrixSumDown(a33),{"0":111,"1":222,"2":333});
	test("sum down a34",gpu.matrixSumDown(a34),{"0":12,"1":22,"2":33,"3":111});
	test("sum down a43",gpu.matrixSumDown(a43),{"0":11,"1":22,"2":33});
	test("sum across a33",gpu.matrixSumAcross(a33),{"0":6,"1":60,"2":600});
	test("sum across a34",gpu.matrixSumAcross(a34),{"0":2,"1":16,"2":160});
	test("sum across a43",gpu.matrixSumAcross(a43),{"0":0,"1":6,"2":60,"3":0});
	test("avg down a33",gpu.matrixAvgDown(a33),{"0":37,"1":74,"2":111});
	test("avg down a34",gpu.matrixAvgDown(a34),{"0":4,"1":7.333333492279053,"2":11,"3":37});
	test("avg down a43",gpu.matrixAvgDown(a43),{"0":2.75,"1":5.5,"2":8.25});
	test("avg across a33",gpu.matrixAvgAcross(a33),{"0":2,"1":20,"2":200});
	test("avg across a34",gpu.matrixAvgAcross(a34),{"0":0.5,"1":4,"2":40});
	test("avg across a43",gpu.matrixAvgAcross(a43),{"0":0,"1":2,"2":20,"3":0});
	test("range down a33",gpu.matrixRangeDown(a33),[{"0":1,"1":100},{"0":1,"1":200},{"0":1,"1":300}]);
	test("range down a34",gpu.matrixRangeDown(a34),[{"0":1,"1":10},{"0":0,"1":20},{"0":0,"1":30},{"0":1,"1":100}]);
	test("range down a43",gpu.matrixRangeDown(a43),[{"0":0,"1":10},{"0":0,"1":20},{"0":0,"1":30}]);
	test("range across a33",gpu.matrixRangeAcross(a33),[{"0":1,"1":3},{"0":1,"1":30},{"0":1,"1":300}]);
	test("range across a34",gpu.matrixRangeAcross(a34),[{"0":0,"1":1},{"0":1,"1":10},{"0":1,"1":100}]);
	test("range across a43",gpu.matrixRangeAcross(a43),[{"0":0,"1":0},{"0":0,"1":3},{"0":0,"1":30},{"0":0,"1":0}]);
	
	
	test("stats down a33",gpu.matrixStatsDown(a33),[{"0":1,"1":100,"2":37,"3":44.69899368286133},{"0":1,"1":200,"2":74,"3":89.39798736572266},{"0":1,"1":300,"2":111,"3":134.0969696044922}]);
	test("stats down a34",gpu.matrixStatsDown(a34),[{"0":1,"1":10,"2":4,"3":4.242640495300293},{"0":0,"1":20,"2":7.333333492279053,"3":8.99382495880127},{"0":0,"1":30,"2":11,"3":13.490736961364746},{"0":1,"1":100,"2":37,"3":44.69899368286133}]);
	test("stats down a43",gpu.matrixStatsDown(a43),[{"0":0,"1":10,"2":2.75,"3":4.205650806427002},{"0":0,"1":20,"2":5.5,"3":8.411301612854004},{"0":0,"1":30,"2":8.25,"3":12.616952896118164}]);

	test("stats across",gpu.matrixStatsDown([[10, 12, 23, 23, 16, 23, 21, 16]]),[{"0":10,"1":16,"2":15.25,"3":1.9843134880065918}])

	test("stats across a33",gpu.matrixStatsAcross(a33),[{"0":1,"1":3,"2":2,"3":0.8164967894554138},{"0":1,"1":30,"2":20,"3":8.164966583251953},{"0":1,"1":300,"2":200,"3":81.64966583251953}]);
	test("stats across a34",gpu.matrixStatsAcross(a34),[{"0":0,"1":1,"2":0.5,"3":0.5},{"0":1,"1":10,"2":4,"3":3.535533905029297},{"0":1,"1":100,"2":40,"3":35.35533905029297}]);
	test("stats across a43",gpu.matrixStatsAcross(a43),[{"0":0,"1":0,"2":0,"3":0},{"0":0,"1":3,"2":2,"3":0.8164967894554138},{"0":0,"1":30,"2":20,"3":8.164966583251953},{"0":0,"1":0,"2":0,"3":0}]);
	test("norms across a33",gpu.matrixNormsAcross(a33),[{"0":2,"1":0.8164967894554138,"2":44.090782165527344},{"0":20,"1":8.164966583251953,"2":44.090789794921875},{"0":200,"1":81.64966583251953,"2":44.09080505371094}]);
	test("norms across a34",gpu.matrixNormsAcross(a34),[{"0":0.3333333432674408,"1":0.4714045226573944,"2":7.071067810058594},{"0":2,"1":0.8164967894554138,"2":44.090782165527344},{"0":20,"1":8.164966583251953,"2":44.090789794921875},{"0":200,"1":81.64966583251953,"2":44.09080505371094}]);
	test("norms across a43",gpu.matrixNormsAcross(a43),[{"0":0,"1":0,"2":null},{"0":2.5,"1":1.1180340051651,"2":53.66563415527344},{"0":25,"1":11.180339813232422,"2":53.66563415527344}]);
	test("norms down a33",gpu.matrixNormsDown(a33),[{"0":37,"1":44.69899368286133,"2":8.157894134521484},{"0":74,"1":89.39798736572266,"2":8.157894134521484},{"0":111,"1":134.0969696044922,"2":8.1578950881958}]);
	test("norms down a34",gpu.matrixNormsDown(a34),[{"0":4,"1":4.242640495300293,"2":9.454279899597168},{"0":7.333333492279053,"1":8.99382495880127,"2":8.019338607788086},{"0":11,"1":13.490736961364746,"2":8.019340515136719},{"0":37,"1":44.69899368286133,"2":8.157894134521484}]);
	test("norms down a43",gpu.matrixNormsDown(a43),[{"0":2.75,"1":4.205650806427002,"2":11.215349197387695},{"0":5.5,"1":8.411301612854004,"2":11.215349197387695},{"0":8.25,"1":12.616952896118164,"2":11.215349197387695}]);
	test("Moments across a33",gpu.matrixMomentsAcross(a33),[{"0":2,"1":0.6666669845581055,"2":44.090782165527344},{"0":20,"1":66.66668701171875,"2":44.090789794921875},{"0":200,"1":6666.66796875,"2":44.09080505371094}]);
	test("Moments across a34",gpu.matrixMomentsAcross(a34),[{"0":0.3333333432674408,"1":0.2222222238779068,"2":7.071067810058594},{"0":2,"1":0.6666669845581055,"2":44.090782165527344},{"0":20,"1":66.66668701171875,"2":44.090789794921875},{"0":200,"1":6666.66796875,"2":44.09080505371094}]);
	test("Moments across a43",gpu.matrixMomentsAcross(a43),[{"0":0,"1":0,"2":null},{"0":2.5,"1":1.25,"2":53.66563415527344},{"0":25,"1":125,"2":53.66563415527344}]);
	test("Moments down a33",gpu.matrixMomentsDown(a33),[{"0":37,"1":1998,"2":8.157894134521484},{"0":74,"1":7992,"2":8.157894134521484},{"0":111,"1":17982,"2":8.1578950881958}]);
	test("Moments down a34",gpu.matrixMomentsDown(a34),[{"0":4,"1":18,"2":9.454279899597168},{"0":7.333333492279053,"1":80.8888931274414,"2":8.019338607788086},{"0":11,"1":182,"2":8.019340515136719},{"0":37,"1":1998,"2":8.157894134521484}]);
	test("Moments down a43",gpu.matrixMomentsDown(a43),[{"0":2.75,"1":17.6875,"2":11.215349197387695},{"0":5.5,"1":70.75,"2":11.215349197387695},{"0":8.25,"1":159.1875,"2":11.215349197387695}]);
	test("Variance across a33",gpu.matrixVarianceAcross(a33),{"0":0.6666669845581055,"1":66.66668701171875,"2":6666.66796875});
	test("Variance across a34",gpu.matrixVarianceAcross(a34),{"0":0.2222222238779068,"1":0.6666669845581055,"2":66.66668701171875,"3":6666.66796875});
	test("Variance across a43",gpu.matrixVarianceAcross(a43),{"0":0,"1":1.25,"2":125});
	test("Variance down a33",gpu.matrixVarianceDown(a33),{"0":1998,"1":7992,"2":17982});
	test("Variance down a34",gpu.matrixVarianceDown(a34),{"0":18,"1":80.8888931274414,"2":182,"3":1998});
	test("Variance down a43",gpu.matrixVarianceDown(a43),{"0":17.6875,"1":70.75,"2":159.1875});
	test("matrixCovarianceAcross a33",gpu.matrixCovarianceAcross(a33),[{"0":0,"1":0,"2":0},{"0":-55.55556869506836,"1":0,"2":0},{"0":-8555.5556640625,"1":302444.625,"2":0}]);
	test("matrixCovarianceAcross a34",gpu.matrixCovarianceAcross(a34),[{"0":0,"1":0,"2":0,"3":0},{"0":-0.1851852387189865,"1":0,"2":0,"3":0},{"0":-8.51852035522461,"1":-55.55556869506836,"2":0,"3":0},{"0":-751.85205078125,"1":-8555.5556640625,"2":302444.625,"3":0}]);
	test("matrixCovarianceAcross a43",gpu.matrixCovarianceAcross(a43),[{"0":0,"1":0,"2":0},{"0":0,"1":0,"2":0},{"0":0,"1":-112.5,"2":0}]);
	test("matrixCovarianceDown a33",gpu.matrixCovarianceDown(a33),[{"0":3847519,"1":15531194,"2":35051024},{"0":15531194,"1":62702712,"2":141514576},{"0":35051024,"1":141514576,"2":319390624}]);
	test("matrixCovarianceDown a34",gpu.matrixCovarianceDown(a34),[{"0":214,"1":1067.77783203125,"2":2451,"3":27643},{"0":1067.77783203125,"1":5491.3095703125,"2":12699.333984375,"3":144644.46875},{"0":2451,"1":12699.333984375,"2":29423,"3":335934},{"0":27643,"1":144644.46875,"2":335934,"3":3847519}]);
	test("matrixCovarianceDown a43",gpu.matrixCovarianceDown(a43),[{"0":240.81640625,"1":1010.046875,"2":2307.69140625},{"0":1010.046875,"1":4328.3125,"2":9954.796875},{"0":2307.69140625,"1":9954.796875,"2":22941.31640625}]);
	test("matrixCorrelationAcross a33",gpu.matrixCorrelationAcross(a33),[{"0":0.9999995231628418,"1":0.9999996423721313,"2":0.9999995827674866},{"0":0.9999997019767761,"1":0.9999997615814209,"2":0.9999997019767761},{"0":0.9999997019767761,"1":0.9999998211860657,"2":0.9999998211860657}]);
	test("matrixCorrelationAcross a34",gpu.matrixCorrelationAcross(a34),[{"0":0.9999999403953552,"1":-0.8660252094268799,"2":-0.8660253286361694,"3":-0.8660253286361694},{"0":-0.8660252094268799,"1":0.9999995231628418,"2":0.9999996423721313,"3":0.9999995827674866},{"0":-0.8660253286361694,"1":0.9999997019767761,"2":0.9999997615814209,"3":0.9999997019767761},{"0":-0.8660253286361694,"1":0.9999997019767761,"2":0.9999998211860657,"3":0.9999998211860657}]);
	test("matrixCorrelationAcross a43",gpu.matrixCorrelationAcross(a43),[{"0":null,"1":null,"2":null},{"0":null,"1":1,"2":1},{"0":null,"1":1,"2":1}]);
	test("matrixCorrelationAcross a43",gpu.matrixCorrelationAcross(a43,[0,2]),[{"0":null,"1":null},{"0":null,"1":4.060000419616699}]);
//		this.timeout(10000);
	test("matrixCorrelationDown a33",gpu.matrixCorrelationDown(a33),[{"0":0.9999999403953552,"1":0.9999999403953552,"2":1.0000001192092896},{"0":0.9999999403953552,"1":0.9999999403953552,"2":1.0000001192092896},{"0":1,"1":1,"2":1.000000238418579}]);
	test("matrixCorrelationDown a34",gpu.matrixCorrelationDown(a34),[{"0":1,"1":0.9958705902099609,"2":0.9958707094192505,"3":0.9966158866882324},{"0":0.9958707094192505,"1":0.9999998807907104,"2":1,"3":0.9999628663063049},{"0":0.9958706498146057,"1":1,"2":1.0000001192092896,"3":0.9999629259109497},{"0":0.9966158866882324,"1":0.9999628663063049,"2":0.9999629259109497,"3":0.9999999403953552}]);
	test("matrixCorrelationDown a43",gpu.matrixCorrelationDown(a43),[{"0":1.0000001192092896,"1":1.0000001192092896,"2":1},{"0":1.0000001192092896,"1":1.0000001192092896,"2":1},{"0":1,"1":1,"2":1}]);
	test("matrixCorrelationDown a43 c2 ",gpu.matrixCorrelationDown(a43,[0,2]),[{"0":1.0000001192092896,"1":0.6666666865348816},{"0":0.6666666865348816,"1":0.4919513165950775}]);[{"0":1,"1":0.9958705902099609,"2":0.9958707094192505,"3":0.9966158866882324},{"0":0.9958707094192505,"1":0.9999998807907104,"2":1,"3":0.9999628663063049},{"0":0.9958706498146057,"1":1,"2":1.0000001192092896,"3":0.9999629259109497},{"0":0.9966158866882324,"1":0.9999628663063049,"2":0.9999629259109497,"3":0.9999999403953552}]
	test("matrixCorrelationDown a43 c2 v1",gpu.matrixCorrelationDown1(a43,[0,2]),[{"0":1,"1":1},{"0":1,"1":1}]);
}); 