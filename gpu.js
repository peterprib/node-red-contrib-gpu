const logger = new (require("node-red-contrib-logger"))("gpu");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const { GPU, input, Input } = require('gpu.js');
if(GPU.isGPUSupported) logger.sendInfo("GPU supported")
else logger.sendWarning("GPU not supported");
//const gpu= new GPU({mode:"dev"});
//const gpu= new GPU({mode:"cpu"});
const gpu= new GPU();
//const gpu= new GPU({debug:true});

const frameworkColumns=require("./lib/gpuFramework").columns;
const frameworkRows=require("./lib/gpuFramework").rows;

function aframeworkColumns(a,columns,pipeline=false,blocks=1,function1,functionMany) {
	const details=this.getDetailsColumns(a,columns,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.x},constants:{size:details.dimensions.y}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.x;
			options.output.y=details.dimensions.z;
			if(logger.active) logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
			const kernel=this.gpu.createKernel(functionMany,options);
			return kernel(a);
		}
		if(logger.active) logger.send({label:"frameworkColumns",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function1,options);
		return kernel(a,details.columns);
	} else {
		options.output.y=blocks;
		const aRevised=this.loadColumns(a,columns,true,blocks);
		if(logger.active) logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(functionMany,options);
		return kernel(aRevised);
	}
}
function aframeworkRows(a,rows,pipeline=false,blocks=1,function1,functionMany) {
	const details=this.getDetailsRows(a,rows,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.y},constants:{size:details.dimensions.x}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.y;
			options.output.y=details.dimensions.z;
			const kernel=this.gpu.createKernel(functionMany,options);
			if(logger.active) logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
			return kernel(a);
		}
		if(logger.active) logger.send({label:"frameworkRows",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function1,options);
		return kernel(a,details.rows);
	} else {
		options.output.y=blocks;
		const aRevised=this.loadRows(a,rows,true,blocks);
		if(logger.active) logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(functionMany,options);
		return kernel(aRevised);
	}
}

const evalOperand=require("./lib/evalOperand");
function gpuFunctions() {
	this.gpu=gpu;
	this.logger=logger;
	return this;
};
gpuFunctions.prototype.reset=function() {
	if(this.gpu.immutable) this.gpu.delete();
//	this.gpu= new GPU();
};
gpuFunctions.prototype.evalOperand=evalOperand;
gpuFunctions.prototype.arrayDimensions=require("./lib/arrayDimensions") ;
gpuFunctions.prototype.getDetailsColumns=require("./lib/getDetails").columns;
gpuFunctions.prototype.getDetailsRows=require("./lib/getDetails").rows;
gpuFunctions.prototype.arrayAdd=evalOperand("+");
gpuFunctions.prototype.arrayBitwiseAnd=evalOperand("&");
gpuFunctions.prototype.arrayBitwiseOr=evalOperand("|");
gpuFunctions.prototype.arrayBitwiseXOR=evalOperand("^");
gpuFunctions.prototype.arrayDivide=evalOperand("/");
gpuFunctions.prototype.arrayCleanse=require("./lib/arrayCleanse");
gpuFunctions.prototype.arrayLeftShift=evalOperand("<<");
gpuFunctions.prototype.arrayMinus=evalOperand("-");
gpuFunctions.prototype.arrayMultiply=evalOperand("*");
gpuFunctions.prototype.arrayPower=evalOperand("**");
gpuFunctions.prototype.arrayRemainder=evalOperand("%");
gpuFunctions.prototype.arrayRightShift=evalOperand(">>");
gpuFunctions.prototype.arrayRightShiftZeroFill=evalOperand(">>>");
gpuFunctions.prototype.destroy=()=>gpu.destroy;
gpuFunctions.prototype.frameworkColumns=frameworkColumns;
gpuFunctions.prototype.frameworkRows=frameworkRows;
gpuFunctions.prototype.getHeatMap=require("./lib/getHeatMap");
gpuFunctions.prototype.GPUSupported=GPU.isGPUSupported?true:false;
gpuFunctions.prototype.imageToArray=require("./lib/imageToArray");
gpuFunctions.prototype.isGPUSupported=GPU.isGPUSupported?()=>true:()=>false;
gpuFunctions.prototype.isArray=require("./lib/isArray");
gpuFunctions.prototype.loadColumns=require("./lib/load").columns;
gpuFunctions.prototype.load=gpuFunctions.prototype.loadColumns;
gpuFunctions.prototype.loadColumnsDelta=require("./lib/loadDelta").columns;
gpuFunctions.prototype.loadRows=require("./lib/load").rows;
gpuFunctions.prototype.loadRowsDelta=require("./lib/loadDelta").rows;
gpuFunctions.prototype.matrixAvgColumns=require("./lib/matrixAvg").columns;
gpuFunctions.prototype.matrixAvgRows=require("./lib/matrixAvg").rows;
gpuFunctions.prototype.matrixCorrelationColumns=require("./lib/matrixCorrelation").columns;
gpuFunctions.prototype.matrixCorrelationRows=require("./lib/matrixCorrelation").rows;
gpuFunctions.prototype.matrixCovarianceColumns=require("./lib/matrixCovariance").columns;
gpuFunctions.prototype.matrixCovarianceRows=require("./lib/matrixCovariance").rows;
gpuFunctions.prototype.matrixMomentsColumns=require("./lib/matrixMoments").columns;
gpuFunctions.prototype.matrixMomentsRows=require("./lib/matrixMoments").rows
gpuFunctions.prototype.matrixNormaliseColumns=require("./lib/matrixNormalise").columns;
gpuFunctions.prototype.matrixNormaliseRows=require("./lib/matrixNormalise").rows;
gpuFunctions.prototype.matrixNormsColumns=require("./lib/matrixNorms").columns;
gpuFunctions.prototype.matrixNormsRows=require("./lib/matrixNorms").rows;
gpuFunctions.prototype.matrixMultiple=require("./lib/matrixMultiple");
gpuFunctions.prototype.matrixRangeColumns=require("./lib/matrixRange").columns;
gpuFunctions.prototype.matrixRangeRows=require("./lib/matrixRange").rows;
gpuFunctions.prototype.matrixStatsColumns=require("./lib/matrixStats").columns;
gpuFunctions.prototype.matrixStatsRows=require("./lib/matrixStats").rows;
gpuFunctions.prototype.matrixSumColumns=require("./lib/matrixSum").columns;
gpuFunctions.prototype.matrixSumRows=require("./lib/matrixSum").rows;
gpuFunctions.prototype.matrixTranspose=require("./lib/matrixTranspose");
gpuFunctions.prototype.matrixVarianceColumns=require("./lib/matrixVariance").columns;
gpuFunctions.prototype.matrixVarianceRows=require("./lib/matrixVariance").rows;
gpuFunctions.prototype.setDebug=function(){logger.debug();return this};
gpuFunctions.prototype.setDebugOff=function(){logger.setOff();return this};
module.exports=gpuFunctions;