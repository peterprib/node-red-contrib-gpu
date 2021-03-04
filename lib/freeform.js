const arrayDimensions=require("./arrayDimensions");

function freeform(gpu,pipeline,statements){
	this.kernels={};
	this.freeSlots=100;
	this.gpu=gpu;
	this.statements=statements;
	this. options={pipeline:pipeline,constants:{}}
}
freeform.prototype.exec=function(value){
	const dimensions=arrayDimensions(value);
	const id="x"+(dimensions.x||"")+"y"+(dimensions.y||"")+"z"+(dimensions.z||"");
	if(this.gpu.logger.active) this.gpu.logger.send({label:"freeform.exec",id:id}) 
	if(!(id in this.kernels)) {
		if(this.freeSlots) {
			this.freeSlots--;
		} else {
			let oldest,oldestId;
			for (const [key, kernalEntry] of Object.entries(this.kernels)) {
				if(oldest && kernalEntry.used<oldest.used) continue
				oldest=kernalEntry;
				oldestId=key;
			}
			if(!oldest) throw Error("oldest failed total slots:"+this.freeSlots)
			oldest.kernel.destroy();
			delete this.kernels[oldestId];
		}
		const options=Object.assign({},this.options,{output:dimensions,constants:{}})
		let statements;
		if(dimensions.z){
			options.constants={xSize:dimensions.x,ySize:dimensions.y,zSize:dimensions.z};
			statements="const {thread:{x,y,z},constants:{xSize,ySize,zSize}}=this;\n"+this.statements.XYZ
		} else if(dimensions.y){
			options.constants={xSize:dimensions.x,ySize:dimensions.y};
			statements="const {thread:{x,y},constants:{xSize,ySize}}=this;\n"+this.statements.XY
		} else
			options.constants={xSize:dimensions.x};
			statements="const {thread:{x},constants:{xSize}}=this;\n"+this.statements.X;
		if(this.gpu.logger.active) this.gpu.logger.send({label:"freeform.exec createKernel",id:id,options:options,statements:statements})
		try{
			const calledFunction=new Function("value",statements);
			const kernel=this.gpu.gpu.createKernel(calledFunction,options);
			if(!kernel) throw Error("failed to build kernel")
			this.kernels[id]={kernel:kernel,options:options,calledFunction:calledFunction,statements:statements};
		} catch(ex) {
			++this.freeSlots;
			this.gpu.logger.error({label:"freeform.exec createKernel",id:id,options:options,statements:statements,error:ex.message,stack:ex.stack})
			delete this.kernels[id]
			throw Error("compile kernel failed");
		}
	}
	const kernalEntry=this.kernels[id];
	kernalEntry.used=new Date();
	try{
		return kernalEntry.kernel(value);
	} catch(ex) {
		++this.freeSlots;
		this.gpu.logger.error({label:"freeform.exec kernel",id:id,calledFunction:kernalEntry.calledFunction.toString(),error:ex.message,stack:ex.stack})
		kernalEntry.kernel.destroy()
		delete this.kernels[id]
		throw ex;
	}
}
module.exports=freeform;