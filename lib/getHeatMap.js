const getHeatColor=require("./getHeatColor");
function getHeatMap(a,offset=0,factor=1,pipeline=false) {
	const dimensions=this.arrayDimensions(a);
	if(dimensions.z) throw Error("3d not supported");
	kernel=this.gpu.createKernel(function getHeatColorFunction(a) {
			const {thread:{x,y},constants:{offset,factor}}=this;
			const rgb=	getHeatColor((a[x,y]-offset)/factor);
			this.color(rgb[0]/255.0,rgb[1]/255.0,rgb[2]/255.0,1); 	 
		},
		{pipeline:pipeline,output:{x:dimensions.y,y:dimensions.x},constants:{offset:offset,factor:factor}}
	).setFunctions([getHeatColor]).setGraphical(true);
	return kernel(a);
}
module.exports=getHeatMap;