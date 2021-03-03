const arrayDimensions=require("./arrayDimensions");
function matrixMultipleScalar1D(s,m) {return s*m[this.thread.x];}
function matrixMultipleScalar2D(s,m) {return s*m[this.thread.x][this.thread.y];}
function matrixMultipleScalar3D(s,m) {return s*m[this.thread.x][this.thread.y][this.thread.z];}
function matrixMultiple1DScalar(m,s) {return m[this.thread.x]*s;}
function matrixMultiple2DScalar(m,s) {return m[this.thread.y][this.thread.x]*s;}
function matrixMultiple3DScalar(m,s) {return m[this.thread.y][this.thread.x][this.thread.z]*s;}
function matrixMultipleMatrix2D(a,b) {
	const {thread:{x,y},constants:{size}}=this;
	let sum=0;
	for(let i= 0;i<size; i++)
		sum+=a[y][i]*b[i][x];
	return sum;
}
function matrixMultiple(a,b,pipeline=false) {
	if(this.logger.active) this.logger.send({label:"matrixMultiple"})
	const aIsArray=Array.isArray(a),bIsArray=Array.isArray(b),options={pipeline:pipeline};
	let callFunction;
	if(aIsArray){
		const aDimensions=arrayDimensions(a);
		if(bIsArray){
			const bDimensions=arrayDimensions(b);
			if(aDimensions.z || bDimensions.z) throw Error("3d not supported");
			if(aDimensions.x !== bDimensions.y) throw Error("Rows in first argument != columns in second argument");
			if(aDimensions.y && bDimensions.y) {
				options.output={x:aDimensions.x,y:bDimensions.x};
				options.constants={size:aDimensions.x};
				callFunction=matrixMultipleMatrix2D;
			} else {
				 throw Error("Both arguements must be dimension")
			}
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
	const kernel=this.gpu.createKernel(callFunction,options);
	return kernel(a,b);
}
module.exports=matrixMultiple;