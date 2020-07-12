const logger = new (require("node-red-contrib-logger"))("gpu");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const {GPU}=require('gpu.js');
if(GPU.isGPUSupported) logger.sendInfo("GPU supported")
else logger.sendWarning("GPU not supported");
const gpu= new GPU();
function arrayDimensions(a) {
	const x=a.length;
	if(Array.isArray(a[0])) {
		const y=a[0].length;
		return Array.isArray(a[0][0])?{x:x,y:y,z:a[0][0].length}:{x:x,y:y};
	}
	return {x:x};
}
function matrixMultipleScalar1D(s,m) {
	return s*m[this.thread.x];
}
function matrixMultipleScalar2D(s,m) {
	return s*m[this.thread.x][this.thread.y];
}
function matrixMultipleScalar3D(s,m) {
	return s*m[this.thread.x][this.thread.y][this.thread.z];
}
function matrixMultipleMatrix1D(a,b) {
	const {thread:{x}}=this,size=this.constants.size;
	var sum=0;
	for(let i= 0;i<size; i++)
		sum+=a[i]*b[i][x];
	return sum;
}
function matrixMultipleMatrix2D(a,b) {
	const {thread:{x,y},constants:{size}}=this;
	var sum=0;
	for(let i= 0;i<size; i++)
		sum+=a[this.thread.y][i]*b[i][this.thread.x];
	return sum;
}
function matrixMultiple(a,b) {
	const bDimensions=arrayDimensions(b),options={};
	let callFunction;
	if(Array.isArray(a)) {
		const aDimensions=arrayDimensions(a);
		callFunction=bDimensions.y?matrixMultipleMatrix2D:matrixMultipleMatrix1D;
		options.output={x:aDimensions.x,y:bDimensions.y};
		options.constants={size:bDimensions.y||1};
		options.argumentTypes={ a: 'Array', b: 'Array'};
	} else {
		options.output=bDimensions;
		callFunction=bDimensions.z?matrixMultipleScalar3D:bDimensions.y?matrixMultipleScalar2D:matrixMultipleScalar1D;
	}
	const kernel=gpu.createKernel(callFunction,options);
	return kernel(a,b);
}
function matrixSumAcross(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixSum2DDownFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[i][this.thread.x];
			return sum;
		},
		{output:{x:aDimensions.y},constants:{size:aDimensions.x||1}}
	);
	return kernel(a);
}
function matrixSumDown(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixSum2DDownFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[this.thread.x][i];
			return sum;
		},
		{output:{x:aDimensions.x},constants:{size:aDimensions.y||1}}
	);
	return kernel(a);
}
function imageToArray(image) {
	const kernel=gpu.createKernel(function(image) {
		const pixel=image[this.thread.y][this.thread.x];
		this.color(pixel.r, pixel.g, pixel.b, pixel.a);
	}, {
		output: [image.width, image.height],
		graphical: true,
		pipeline: true,
	});
	kernel(image);
	const result=kernel.getPixels(true);
	kernel.destroy();
	return result;
}
function gpuFunctions() {
	return this;
};
function evalOperand(operand,returnType){
	const function1D=eval("(function(a,b) {const {thread:{x}}=this;return a[x]"+operand+"b[x];})");
	const function2D=eval("(function(a,b) {const {thread:{x,y}}=this;return a[x][y]"+operand+"b[x][y];})");
	const function3D=eval("(function(a,b) {const {thread:{x,y,z}}=this;return a[x][y][z]"+operand+"b[x][y][z];})");

	const function1DSM=eval("(function(s,m) {const {thread:{x}}=this;return s"+operand+"m[x];})");
	const function2DSM=eval("(function(s,m) {const {thread:{x,y}}=this;return s"+operand+"m[x][y];})");
	const function3DSM=eval("(function(s,m) {const {thread:{x,y,z}}=this;return s"+operand+"m[x][y][z];})");

	const function1DMS=eval("(function(m,s) {const {thread:{x}}=this;return m[x]"+operand+"s;})");
	const function2DMS=eval("(function(m,s) {const {thread:{x,y}}=this;return m[x][y]"+operand+"s;})");
	const function3DMS=eval("(function(m,s) {const {thread:{x,y,z}}=this;return m[x][y][z]"+operand+"s;})");
	const functionSS=eval("(function(a,b) {return a"+operand+"b;})");
	return function(a,b) {
		let callFunction,dimensions;
		if(Array.isArray(a) && Array.isArray(b)) {
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3D:dimensions.y?function2D:function1D;
		} else if(Array.isArray(a)){
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3DMS:dimensions.y?function2DMS:function1DMS;
		} else if(Array.isArray(b)){
			dimensions=arrayDimensions(b);
			callFunction=dimensions.z?function3DSM:dimensions.y?function2DSM:function1DSM;
		} else {
			return functionSS(a,b);
		}
		const kernel=gpu.createKernel(callFunction,
			{output:dimensions,returnType:returnType}
		);
		return kernel(a,b);
	}
}
gpuFunctions.prototype.arrayAdd=evalOperand("+");
gpuFunctions.prototype.arrayMinus=evalOperand("-");
gpuFunctions.prototype.arrayMulptiply=evalOperand("*");
gpuFunctions.prototype.arrayDivide=evalOperand("/");
gpuFunctions.prototype.arrayRemainder=evalOperand("%");
gpuFunctions.prototype.arrayPower=evalOperand("**");
gpuFunctions.prototype.arrayBitwiseAnd=evalOperand("&");
gpuFunctions.prototype.arrayBitwiseOr=evalOperand("|");
gpuFunctions.prototype.arrayBitwiseXOR=evalOperand("^");
////gpuFunctions.prototype.arrayBitwiseNot=evalOperand("~");
//gpuFunctions.prototype.arrayLogicalOr=evalOperand("||","Boolean");
//gpuFunctions.prototype.arrayLogicalAnd=evalOperand("&&");
//gpuFunctions.prototype.arrayLogicalNullish=evalOperand("??");
//gpuFunctions.prototype.arrayEqual=evalOperand("==");
//gpuFunctions.prototype.arrayNotEqual=evalOperand("!=");
//gpuFunctions.prototype.arrayStrictEqual=evalOperand("===");
//gpuFunctions.prototype.arrayGreaterThan=evalOperand(">");
//gpuFunctions.prototype.arrayLessThan=evalOperand("<");
//gpuFunctions.prototype.arrayGreaterOrEqual=evalOperand(">=");
//gpuFunctions.prototype.arrayLessThanOrEqual=evalOperand("<=");
gpuFunctions.prototype.arrayLeftShift=evalOperand("<<");
gpuFunctions.prototype.arrayRightShift=evalOperand(">>");
gpuFunctions.prototype.arrayRightShiftZeroFill=evalOperand(">>>");



function evalTest(formula,returnType){   //under development
	const function1D=eval("(function(a) {const {thread:{x}}=this;return a[x]"+operand+"b[x];})");
	const function2D=eval("(function(a) {const {thread:{x,y}}=this;return a[x][y]"+operand+"b[x][y];})");
	const function3D=eval("(function(a) {const {thread:{x,y,z},constants:{size}}=this;"+
		"let returnValue=0;"+
		"for(let i= 0;i<size; i++){"+
			"returnValue="+formula+   //"returnValue+a[x][i]"
		"}; return returnValue;})"
	);
	return function(a,b) {
		let callFunction,dimensions;
		if(Array.isArray(a) && Array.isArray(b)) {
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3D:dimensions.y?function2D:function1D;
		} else if(Array.isArray(a)){
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3DMS:dimensions.y?function2DMS:function1DMS;
		} else if(Array.isArray(b)){
			dimensions=arrayDimensions(b);
			callFunction=dimensions.z?function3DSM:dimensions.y?function2DSM:function1DSM;
		} else {
			return functionSS(a,b);
		}
		const kernel=gpu.createKernel(callFunction,
			{output:dimensions,returnType:returnType}
		);
		return kernel(a,b);
	}
}
gpuFunctions.prototype.matrixMultiple=matrixMultiple;
gpuFunctions.prototype.matrixSumAcross=matrixSumAcross;
gpuFunctions.prototype.matrixSumDown=matrixSumDown;
gpuFunctions.prototype.imageToArray=imageToArray;
gpuFunctions.prototype.GPUSupported=GPU.isGPUSupported?true:false;
gpuFunctions.prototype.isGPUSupported=GPU.isGPUSupported?()=>true:()=>false;
gpuFunctions.prototype.destroy=()=>gpu.destroy;
module.exports=gpuFunctions;