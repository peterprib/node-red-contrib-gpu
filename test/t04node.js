const should = require("should");
const helper = require("node-red-node-test-helper");
const GpuNode = require("../gpunode.js");
const helperNodeDef={id :"helperNode",type : "helper"};
const helperErrorNodeDef={id :"helperErrorNode",type : "helper"};
helper.init(require.resolve('node-red'));
function testEqual(a,b,done) {  //needed as bug in test-helper
    try {
    	if(JSON.stringify(a)==JSON.stringify(b)) return;
        throw Error("not equal");
     } catch(ex) {
        done(ex.message+" expected : "+JSON.stringify(b)+" found : "+JSON.stringify(a));
    }
}
function testNodeProperties(o) {
	const n = getNode(o);
	for(let p in o) {
		n.should.have.property(p, o[p]);
	}
	return n;
}
function testFlow(n) { 
	return [Object.assign({},n,{wires : [ [ "helperNode" ] ]}),helperNodeDef,helperErrorNodeDef];
}
function getNode(def) {
	const id=typeof def== "object"?def.id:def;
	const n = helper.getNode(id);
	if(n==null) throw Error("node "+id+" not found");
	if(typeof n== "object")  return n;
	throw Error("get node found not an object for "+id);
	console.log(helper.log().args);	// this hopefully tells why 
}

describe('gpu node', function() {
	const testNodeDef ={
			id : "n1",
			type : "gpunode",
			name: "test name",
//			action:"matrixSumRows",
			action:"arrayAdd",
			blocksProperty:1,
			columnsProperty:"",
			columnsProperty:true,
			hasSecondArgument:true,
			hasColumns:false,
			pipeline:false,
			source1Property:"msg.payload.b",
			source2Property:"msg.payload.b",
			targetProperty:"msg.payload.c"
		} ;

	beforeEach(function(done) {
		helper.startServer(done);
	});
	afterEach(function(done) {
		helper.unload();
		helper.stopServer(done);
	});

	it('test helper load', function(done) {
		helper.load([GpuNode], [helperNodeDef], function() {
			const helperNode = getNode(helperNodeDef);
			done();
		});
	});
	it('test node  load', function(done) {
		helper.load([GpuNode], [testNodeDef], function() {
			const helperNode = getNode(testNodeDef);
			done();
		});
	});

	it('test gpu flow', function(done) {
		helper.load(GpuNode, testFlow(testNodeDef), function() {
			const helperNode = getNode(helperNodeDef)
			helperNode.on("input", function(msg) {
				testEqual(msg.payload.c,[{"0":2,"1":4},{"0":6,"1":8},{"0":10,"1":12}],done)
				done();
			});
			const helperErrorNode = getNode(helperErrorNodeDef)
			helperErrorNode.on("input", function(msg) {
				done("error node called");
			});
			const testNode = testNodeProperties(testNodeDef);
			const anArray = [ [ 1, 2 ],[3 ,4],[5 ,6] ];
			testNode.receive({
				topic:"test",
				payload :{a:1,b: [[ 1, 2 ],[3 ,4],[5 ,6] ]}
			});
		});
	}).timeout(2000);
});