const logger = new (require("node-red-contrib-logger"))("gpu");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const {GPU}=require('gpu.js');
if(GPU.isGPUSupported) logger.sendInfo("GPU supported")
else logger.sendWarning("GPU not supported");
//const gpu= new GPU({mode:"dev"});
//const gpu= new GPU({mode:"cpu"});
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
function matrixMultiple1DScalar(m,s) {
	return m[this.thread.x]*s;
}
function matrixMultiple2DScalar(m,s) {
	return m[this.thread.x][this.thread.y]*s;
}
function matrixMultiple3DScalar(m,s) {
	return m[this.thread.x][this.thread.y][this.thread.z]*s;
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
		sum+=a[y][i]*b[i][x];
	return sum;
}
function matrixMultiple(a,b) {
	const aIsArray=Array.isArray(a),bIsArray=Array.isArray(b),options={};
	let callFunction;
	if(aIsArray){
		const aDimensions=arrayDimensions(a);
		if(bIsArray){
			const bDimensions=arrayDimensions(b);
			callFunction=bDimensions.y?matrixMultipleMatrix2D:matrixMultipleMatrix1D;
			options.output={x:aDimensions.x,y:bDimensions.y};
			options.output={x:aDimensions.x};
			if(bDimensions.y) options.output.y=bDimensions.y;
			if(aDimensions.z || bDimensions.z) throw Error("3d not supported");
			options.constants={size:bDimensions.y||1};
//			options.argumentTypes={ a: 'Array', b: 'Array'};
		} else {
			options.output={x:aDimensions.x};
			if(aDimensions.y) options.output.y=aDimensions.y;
			if(aDimensions.z) options.output.z=aDimensions.z;
			callFunction=aDimensions.z?matrixMultiple3DScalar:aDimensions.y?matrixMultiple2DScalar:matrixMultiple1DScalar;
		}
	} else if(bIsArray){
		const bDimensions=arrayDimensions(b);
		options.output={x:bDimensions.x};
		if(bDimensions.y) options.output.y=bDimensions.y;
		if(bDimensions.z) options.output.z=bDimensions.z;
		callFunction=bDimensions.z?matrixMultipleScalar3D:bDimensions.y?matrixMultipleScalar2D:matrixMultipleScalar1D;
	} else {
		return a*b;
	}
	const kernel=gpu.createKernel(callFunction,options);
	return kernel(a,b);
}
function matrixTranspose(a) {
	const aDimensions=arrayDimensions(a);
	if(aDimensions.z) throw Error("3d not supported");
	kernel=gpu.createKernel(function matrixTransposeFunction(a) {
		const {thread:{x,y}}=this;
		return a[y][x];
	},
	{output:{x:aDimensions.y,y:aDimensions.x}}
	);
	return kernel(a);
}
function matrixSumAcross(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixSum2DAcrossFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[x][i];
			return sum;
		},
		{output:{x:aDimensions.y},constants:{size:aDimensions.x||1}}
	);
	return kernel(a);
}
function matrixAvgAcross(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixAvgAcross2DFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[x][i];
			return sum/size;
		},
		{output:{x:aDimensions.y},constants:{size:aDimensions.x||1}}
		);
	return kernel(a);
}
function matrixRangeAcross(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixRangeAcross2DFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let min=a[0][0],max=min;
			for(let i=0;i<size; i++) {
				const v=a[x][i];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		},
		{output:{x:aDimensions.y},constants:{size:aDimensions.x||1},returnType:"Array(2)"}
	);
	return kernel(a);
}
function matrixStatsAcross(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixStatsAcross2DFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0,sumSquared=0,min=a[0][0],max=min;
			for(let i=0;i<size; i++) {
				const v=a[x][i];
				sum+=v;
				sumSquared+=v**2;
				if(v<min) min=v
				else if(v>max) max=v;
			}
			const range=max-min,
				average=sum/size,
				variance=(sumSquared/size)-average**2;
			return [min,max,average,Math.sqrt(variance)];
		},
		{output:{x:aDimensions.y},constants:{size:aDimensions.x||1}, returnType: 'Array(4)'}
	);
	return kernel(a);
}
function matrixSumDown(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixSum2DDownFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[i][x];
			return sum;
		},
		{output:{x:aDimensions.x},constants:{size:aDimensions.y||1}}
	);
	return kernel(a);
}
function matrixAvgDown(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixAvg2DDownFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++)
				sum+=a[i][x];
			return sum/size;
		},
		{output:{x:aDimensions.x},constants:{size:aDimensions.y||1}}
	);
	return kernel(a);
}
function matrixRangeDown(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixRange2DDownFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let min=a[0][0],max=min;
			for(let i=0;i<size; i++) {
				const v=a[i][x];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		},
		{output:{x:aDimensions.x},constants:{size:aDimensions.y||1},returnType:"Array(2)"}
	);
	return kernel(a);
}
function matrixStatsDown(a) {
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixStat2DDownFunction(a) {
			const {thread:{x},constants:{size}}=this;
			let sum=0,sumSquared=0,min=a[0][0],max=min;
			for(let i=0;i<size; i++) {
				const v=a[i][x];
				sum+=v;
				sumSquared+=v**2;
				if(v<min) min=v
				else if(v>max) max=v;
			}
			const range=max-min,
				average=sum/size,
				variance=(sumSquared/size)-average**2;
			return [min,max,average,Math.sqrt(variance)];
		},
		{output:{x:aDimensions.x},constants:{size:aDimensions.y||1},returnType: 'Array(4)'}
	);
	return kernel(a);
}
function getDetails(a,columnsIn){
	const dimensions=arrayDimensions(a);
	if(dimensions.x<1) throw Error("array has length zero");
	let columns=columnsIn||[];
	if(columns.length==0)
		for(let i=0;i<dimensions.x;++i) columns.push(i);
	return {dimensions:dimensions,columns:columns}
}

function matrixVarianceAcross(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixVariance2DAcrossFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[column][i];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y||1}}
	);
	return kernel(a,details.columns);
}
function matrixVarianceDown(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixVariance2DDownFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[i][column];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y||1}}
	);
	return kernel(a,details.columns);
}
function matrixNormsAcross(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixNorms2DAcrossFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[column][i],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y||1},returnType: 'Array(3)'}
	);
	return kernel(a,details.columns);
}
function matrixMomentsAcross(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixMoments2DAcrossFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[column][i],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
			return [average,variance,skew];
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y||1},returnType: 'Array(3)'}
	);
	return kernel(a,details.columns);
}
function matrixNormsDown(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixNorms2DDownFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[i][column],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average*average,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y},returnType: 'Array(3)'}
	);
	return kernel(a,details.columns);
}
function matrixMomentsDown(a,columns) {
	const details=getDetails(a,columns);
	const kernel=gpu.createKernel(function matrixMoments2DDownFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[i][column],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
			return [average,variance,skew];
		},
		{output:{x:details.columns.length},constants:{size:details.dimensions.y||1},returnType: 'Array(3)'}
	);
	return kernel(a,details.columns);
}
function matrixCovarianceAcross(a){
	const variances=matrixVarianceAcross(a),
		aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixCovarianceAcross(a,variances) {
			const {thread:{x,y},constants:{size}}=this;
			if(x>=y) return 0;
			let covariance=0;
			for(let i=0;i<size; i++) {
				covariance+=(a[x][i]-variances[x])*(a[y][i]-variances[y])
			}
			return covariance/size;
		},
		{output:{x:variances.length,y:variances.length},constants:{size:aDimensions.y||1}}
	);
	return kernel(a,variances);
}
function matrixCovarianceDown(a){
	const variances=matrixVarianceDown(a),
		aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixCovarianceDown(a,variances) {
			const {thread:{x,y},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) {
				covariance+=(a[i][x]-variances[x])*(a[i][y]-variances[y])
			}
			return covariance/size;
		},
		{output:{x:variances.length,y:variances.length},constants:{size:aDimensions.y||1}}
	);
	return kernel(a,variances);
}
function matrixCorrelationAcross(a,columns){
	const norms=matrixNormsAcross(a,columns),
		aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixCorrelationAcross(a,norms) {
			const {thread:{x,y},constants:{size}}=this;
			let correlation=0;
			for(let i=0;i<size; i++) {
				correlation+=(a[x][i]-norms[x][0])*(a[y][i]-norms[y][0]);
			}
			return correlation/(size*norms[x][1]*norms[y][1]);
		},
		{output:{x:norms.length,y:norms.length},constants:{size:aDimensions.y||1}}
	);
	return kernel(a,norms);
}
function matrixCorrelationDown1(a,columns){
	const details=getDetails(a,columns);
	const aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixCorrelationDown1(a,columns) {
			const {thread:{x,y},constants:{size}}=this,columnX=columns[x],columnY=columns[y];
//			if(columnX>=columnY) return 0;
			let xAvg=0,yAvg=0;
			for(let i=0;i<size; i++) {
				xAvg+=a[i][columnX];
				yAvg+=a[i][columnY];
			}
			xAvg/=size;
			yAvg/=size;
			let sumXY=0,sumXX=0,sumYY=0;
			for(let i=0;i<size; i++) {
				const X=xAvg-a[i][columnX];
				const Y=yAvg-a[i][columnY];
				sumXY+=X*Y;
				sumXX+=X*X;
				sumYY+=Y*Y;
			}
			return sumXY/Math.sqrt(sumXX*sumYY);
		},
		{output:{x:details.columns.length,y:details.columns.length},constants:{size:aDimensions.y||1}}
	);
	return kernel(a,details.columns);
}
function matrixCorrelationDown(a,columns){
	const norms=matrixNormsDown(a,columns),
		aDimensions=arrayDimensions(a),
		kernel=gpu.createKernel(function matrixCorrelationDown(a,norms) {
			const {thread:{x,y},constants:{size}}=this;
//			if(x>=x) return 0;
			let correlation=0;
			for(let i=0;i<size; i++) correlation+=(a[i][x]-norms[x][0])*(a[i][y]-norms[y][0])
			return correlation/(size*norms[x][1]*norms[y][1]);
		},
		{output:{x:norms.length,y:norms.length},constants:{size:aDimensions.y||1}}
	);
	return kernel(a,norms);
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

function evalOperand(operand){
	const function1D=eval("(function(a,b) {const {thread:{x}}=this;return a[x]"+operand+"b[x];})");
	const function2D=eval("(function(a,b) {const {thread:{x,y}}=this;return a[y][x]"+operand+"b[y][x];})");
	const function3D=eval("(function(a,b) {const {thread:{x,y,z}}=this;return a[z][y][x]"+operand+"b[z][y][x];})");

	const function1DSM=eval("(function(s,m) {const {thread:{x}}=this;return s"+operand+"m[x];})");
	const function2DSM=eval("(function(s,m) {const {thread:{x,y}}=this;return s"+operand+"m[y][x];})");
	const function3DSM=eval("(function(s,m) {const {thread:{x,y,z}}=this;return s"+operand+"m[z][y][x];})");

	const function1DMS=eval("(function(m,s) {const {thread:{x}}=this;return m[x]"+operand+"s;})");
	const function2DMS=eval("(function(m,s) {const {thread:{x,y}}=this;return m[y][x]"+operand+"s;})");
	const function3DMS=eval("(function(m,s) {const {thread:{x,y,z}}=this;return m[z][y][x]"+operand+"s;})");
	const functionSS=eval("(function(a,b) {return a"+operand+"b;})");
	return function(a,b) {
		const isAArray=Array.isArray(a),isBArray=Array.isArray(b)
//console.log("isAArray: "+isAArray+" isBArray: "+isBArray)
		let callFunction,dimensions;
		if(isAArray && isBArray) {
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3D:dimensions.y?function2D:function1D;
//console.log("MM "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else if(isAArray){
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3DMS:dimensions.y?function2DMS:function1DMS;
//console.log("MS "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else if(isBArray){
			dimensions=arrayDimensions(b);
			callFunction=dimensions.z?function3DSM:dimensions.y?function2DSM:function1DSM;
//console.log("SM "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else {
//console.log("SS "+" a: "+a+" b: "+b)
			return functionSS(a,b);
		}
		const kernel=gpu.createKernel(callFunction,
			{output:dimensions}
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
//gpuFunctions.prototype.arrayBitwiseNot=evalOperand("~");
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
gpuFunctions.prototype.matrixTranspose=matrixTranspose;
gpuFunctions.prototype.matrixMultiple=matrixMultiple;
gpuFunctions.prototype.matrixSumAcross=matrixSumAcross;
gpuFunctions.prototype.matrixAvgAcross=matrixAvgAcross;
gpuFunctions.prototype.matrixRangeAcross=matrixRangeAcross;
gpuFunctions.prototype.matrixStatsAcross=matrixStatsAcross;
gpuFunctions.prototype.matrixSumDown=matrixSumDown;
gpuFunctions.prototype.matrixAvgDown=matrixAvgDown;
gpuFunctions.prototype.matrixRangeDown=matrixRangeDown;
gpuFunctions.prototype.matrixStatsDown=matrixStatsDown;
gpuFunctions.prototype.matrixNormsAcross=matrixNormsAcross;
gpuFunctions.prototype.matrixNormsDown=matrixNormsDown;
gpuFunctions.prototype.matrixMomentsAcross=matrixMomentsAcross;
gpuFunctions.prototype.matrixMomentsDown=matrixMomentsDown;
gpuFunctions.prototype.matrixVarianceAcross=matrixVarianceAcross;
gpuFunctions.prototype.matrixVarianceDown=matrixVarianceDown;
gpuFunctions.prototype.matrixCovarianceAcross=matrixCovarianceAcross
gpuFunctions.prototype.matrixCovarianceDown=matrixCovarianceDown
gpuFunctions.prototype.matrixCorrelationAcross=matrixCorrelationAcross;
gpuFunctions.prototype.matrixCorrelationDown=matrixCorrelationDown;
gpuFunctions.prototype.matrixCorrelationDown1=matrixCorrelationDown1;
gpuFunctions.prototype.imageToArray=imageToArray;
gpuFunctions.prototype.GPUSupported=GPU.isGPUSupported?true:false;
gpuFunctions.prototype.isGPUSupported=GPU.isGPUSupported?()=>true:()=>false;
gpuFunctions.prototype.destroy=()=>gpu.destroy;
module.exports=gpuFunctions;