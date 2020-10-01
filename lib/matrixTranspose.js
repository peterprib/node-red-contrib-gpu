function matrixTranspose(a,pipeline=false) {
	const aDimensions=this.arrayDimensions(a);
	if(aDimensions.z) throw Error("3d not supported");
	kernel=this.gpu.createKernel(function matrixTransposeFunction(a) {
		const {thread:{x,y}}=this;
		return a[x][y];
	},
	{pipeline:pipeline,output:{x:aDimensions.y,y:aDimensions.x}}
	);
	return kernel(a);
}
module.exports=matrixTranspose;