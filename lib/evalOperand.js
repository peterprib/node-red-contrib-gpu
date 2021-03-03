const arrayDimensions=require("./arrayDimensions");
function evalOperand(gpu,operand){
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
	return function(a,b,columns,pipeline=false,blocks=1) {
		const isAArray=Array.isArray(a),isBArray=Array.isArray(b)
		let callFunction,dimensions;
		if(isAArray && isBArray) {
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3D:dimensions.y?function2D:function1D;
		} else if(isAArray){
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3DMS:dimensions.y?function2DMS:function1DMS;
		} else if(isBArray){
			dimensions=arrayDimensions(b);
			callFunction=dimensions.z?function3DSM:dimensions.y?function2DSM:function1DSM;
		} else {
			return functionSS(a,b);
		}
		const kernel=gpu.createKernel(callFunction,
			{pipeline:pipeline,output:dimensions}
		);
		return kernel(a,b);
	}
}
module.exports=evalOperand;