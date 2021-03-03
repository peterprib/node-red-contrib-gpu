const logger = new (require("node-red-contrib-logger"))("gpu");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const { GPU, input, Input } = require('gpu.js');
if(GPU.isGPUSupported) logger.sendInfo("GPU supported")
else logger.sendWarning("GPU not supported");
//const gpu= new GPU({mode:"dev"});
//const gpu= new GPU({mode:"cpu"});

//===============================================================================

const gpu= new GPU();
//const gpu= new GPU({debug:true});

gpu.addFunction(function loadSelectedX(a,elements) {
	const {thread:{x,y}}=this,element=elements[x];
	return a[y][element];
});
gpu.addFunction(	function loadSelectedY(a,elements) {
	const {thread:{x,y}}=this,element=elements[y];
	return a[element][x];
});
gpu.addFunction(function loadBlockedSelectedX(a,elements) {
	const {thread:{x,y,z},constants:{size}}=this,element=elements[x];
	return a[z*size+y][element];
});
gpu.addFunction(function loadBlockedSelectedY(a,elements) {
	const {thread:{x,y,z},constants:{size}}=this,element=elements[y];
	return a[element][z*size+x];
});
gpu.addFunction(function loadDeltaSelectedX(a,elements){ // input array should be 1 greater that dimension
	const {thread:{x,y}}=this,element=elements[x];
	return a[y+1][element]-a[y][element];
});
gpu.addFunction(function loadDeltaSelectedY(a,elements){ // input array should be 1 greater that dimension
	const {thread:{x,y}}=this,element=elements[y];
	return a[element][x+1]-a[element][x];
});
gpu.addFunction(function loadDeltaBlockedSelectedX(a,elements){ // input array should be 1 greater that dimension
	const {thread:{x,y,z},constants:{size}}=this,element=elements[x],ySource=z*size+y;
	return a[ySource+1][element]-a[ySource][element];
});
gpu.addFunction(function loadDeltaBlockedSelectedY(a,elements){ // input array should be 1 greater that dimension
	const {thread:{x,y,z},constants:{size}}=this,element=elements[y],xSource=z*size+x;
	return a[element][xSource+1]-a[element][xSource];
});
gpu.addFunction(function invertArray(a){
	const {thread:{x,y}}=this;
	return a[x][y];
})

//===============================================================================


const inherits=require('util').inherits;
const evalOperand=require("./lib/evalOperand");
function gpuFunctions(f) {
	this.gpu=gpu;
	this.logger=logger;
	if(f) this.bind(f);
	defineFunction.call(this,"matrixMultiple");
	defineColsRows.call(this,'getDetails','gpuFramework','load','loadDelta','matrixAvg','matrixCorrelation','matrixCovariance','matrixMoments'
			,'matrixNormalise','matrixNorms','matrixRange','matrixStats','matrixSum','matrixVariance');
	return this;
};
gpuFunctions.prototype.reset=function() {
		if(this.gpu.immutable) this.gpu.delete();
		this.gpu= new GPU();
};
const gpuFramework=require('./lib/gpuFramework');

function defineFunction(...args){
	if(args.length>1) {
		args.forEach(c=>defineFunction.call(this,c));
		return;
	}
	const baseName=args[0];
	try{
		const baseFunction=require('./lib/'+baseName)
		this[baseName]=baseFunction.bind(this);
	}  catch(ex) {
		logger.error("*** failed loading "+JSON.stringify(baseName) +" error: "+ex.message+" stack: "+ex.stack)
		return;
	}
	logger.info("loaded  "+baseName);
}

function defineColsRows(...args){
	if(args.length>1) {
		args.forEach(c=>defineColsRows.call(this,c));
		return;
	}
	const baseName=args[0];
	try{
		this[baseName]=require('./lib/'+baseName);
		const base=this[baseName];
		let columnsFunction,rowsFunction;
		if("columns" in base) {
			columnsFunction=eval("(a,columns,pipeline,blocks)=>this."+baseName+".columns.call(this,a,columns,pipeline,blocks)").bind(this);
			rowsFunction=eval("(a,rows,pipeline,blocks)=>this."+baseName+".rows.call(this,a,rows,pipeline,blocks)").bind(this);
		} else if("columns2D" in base) {
			columnsFunction=eval("(a,columns,pipeline,blocks)=>gpuFramework.columns.call(this,a,columns,pipeline,blocks,this."+baseName+".columns2D,this."+baseName+".columns3D)").bind(this);
			rowsFunction=eval("(a,rows,pipeline,blocks)=>gpuFramework.rows.call(this,a,rows,pipeline,blocks,this."+baseName+".rows2D,this."+baseName+".rows3D)").bind(this);
		} else throw Error("unknown functions")
		this[baseName+"Columns"]=columnsFunction;
		this[baseName+"Across"]=columnsFunction;
		this[baseName+"Rows"]=rowsFunction;
		this[baseName+"Down"]=rowsFunction;
	}  catch(ex) {
		logger.error("*** failed loading "+JSON.stringify(baseName) +" error: "+ex.message+" stack: "+ex.stack)
		return;
	}
	logger.info("loaded  "+baseName);
}
gpuFunctions.prototype.bind=function(f){this.exec=this.f.bind(this)}

gpuFunctions.prototype.matrixTranspose=require("./lib/matrixTranspose");
gpuFunctions.prototype.arrayDimensions=require("./lib/arrayDimensions") ;

gpuFunctions.prototype.arrayAdd=evalOperand(gpu,"+");
gpuFunctions.prototype.arrayBitwiseAnd=evalOperand(gpu,"&");
gpuFunctions.prototype.arrayBitwiseOr=evalOperand(gpu,"|");
gpuFunctions.prototype.arrayBitwiseXOR=evalOperand(gpu,"^");
gpuFunctions.prototype.arrayDivide=evalOperand(gpu,"/");
gpuFunctions.prototype.arrayCleanse=require("./lib/arrayCleanse");
gpuFunctions.prototype.arrayLeftShift=evalOperand(gpu,"<<");
gpuFunctions.prototype.arrayMinus=evalOperand(gpu,"-");
gpuFunctions.prototype.arrayMultiply=evalOperand(gpu,"*");
gpuFunctions.prototype.arrayPower=evalOperand(gpu,"**");
gpuFunctions.prototype.arrayRemainder=evalOperand(gpu,"%");
gpuFunctions.prototype.arrayRightShift=evalOperand(gpu,">>");
gpuFunctions.prototype.arrayRightShiftZeroFill=evalOperand(gpu,">>>");
gpuFunctions.prototype.destroy=()=>gpu.destroy;
gpuFunctions.prototype.getHeatMap=require("./lib/getHeatMap");
gpuFunctions.prototype.GPUSupported=GPU.isGPUSupported?true:false;
gpuFunctions.prototype.imageToArray=require("./lib/imageToArray");
gpuFunctions.prototype.isGPUSupported=GPU.isGPUSupported?()=>true:()=>false;
gpuFunctions.prototype.isArray=require("./lib/isArray");
gpuFunctions.prototype.load=gpuFunctions.prototype.loadColumns;

gpuFunctions.prototype.setDebug=function(){logger.debug();return this};
gpuFunctions.prototype.setDebugOff=function(){logger.setOff();return this};

module.exports=gpuFunctions;