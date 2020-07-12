//const assert=require('assert');
//const {GPU}=require('gpu.js');
const GPU=require("../gpu");
const gpu= new GPU();
const a4=[0,1,2,3];
const a4b1=[true,false,true,false];
const a4b2=[false,false,true,true];
const ac4=[[1,2,3,4]];
const ar4=[[1],[2],[3],[4]];
const a33=[[0,0,0],[1,2,3],[10,20,30]];
const a222=[ [[111,112],[121,122]], [[211,212],[221,222]] ];

function log(label,object){
	console.log(label+" "+JSON.stringify(object));
}
function testArrayFunction(f,a=a222,b=a222){
	const callFunction="array"+f;
	it(callFunction, function(done) {
		log(f,gpu[callFunction](a,a));
		 gpu.destroy();
		done();
	});
}

describe('matrix', function() {
	it('add', function(done) {
		log("add a4",gpu.arrayAdd(a4,a4));
		log("add a4",gpu.arrayAdd(a4,a4));
		log("add a33",gpu.arrayAdd(a33,a33));
		log("add a222",gpu.arrayAdd(a222,a222));
		done();
	});
	testArrayFunction("Minus",1,a222);
	testArrayFunction("Minus",a222,1);
	testArrayFunction("Minus");
	testArrayFunction("Mulptiply");
	testArrayFunction("Divide");
	testArrayFunction("Remainder");
	testArrayFunction("Power");
	testArrayFunction("BitwiseAnd");
	testArrayFunction("BitwiseOr");
	testArrayFunction("BitwiseXOR");
//	testArrayFunction("LogicalOr",a4b1,a4b2);
//	testArrayFunction("LogicalAnd",a4b1,a4b2);
//	testArrayFunction("Equal");
//	testArrayFunction("NotEqual");
//	testArrayFunction("StrictEqual");
//	testArrayFunction("GreaterThan");
//	testArrayFunction("LessThan");
//	testArrayFunction("GreaterOrEqual");
//	testArrayFunction("LessThanOrEqual");
	testArrayFunction("LeftShift");
	testArrayFunction("RightShift");
	testArrayFunction("RightShiftZeroFill");

	it('scalar multi', function(done) {
		log("2xa4",gpu.matrixMultiple(2,a4));
		log("2xa33",gpu.matrixMultiple(2,a33));
		done();
	});
	it('multi', function(done) {
		log("a33*a33",gpu.matrixMultiple(a33,a33));
		log("ac4*ac4",gpu.matrixMultiple(ac4,ac4));
		log("ac4*ar4",gpu.matrixMultiple(ac4,ar4));
		log("ar4*ac4",gpu.matrixMultiple(ar4,ac4));
		log("ar4*ar4",gpu.matrixMultiple(ar4,ar4));
		log("ac4*a33",gpu.matrixMultiple(ar4,a33));
		log("ar4*a33",gpu.matrixMultiple(ac4,a33));
		log("a33*ar4",gpu.matrixMultiple(a33,ar4));
		log("a33*ac4",gpu.matrixMultiple(a33,ac4));

//		log("a4xa4",gpu.matrixMultiple(a4,a4));
//		log("a33*a4",gpu.matrixMultiple(a33,a4));
		done();
	});
	it('sum', function(done) {
		console.log("a33*a33",gpu.matrixSumDown(a33,a33));
		console.log("a33*a33",gpu.matrixSumAcross(a33,a33));
		done();
	});
});