const getDetails=require('./getDetails');

function frameworkColumns(a,columns,pipeline=false,blocks=1,function2D,function3D) {
	const details=getDetails.columns(a,columns,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.x},constants:{size:details.dimensions.y}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.x;
			options.output.y=details.dimensions.z;
			if(this.logger.active) this.logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
			const kernel=this.gpu.createKernel(function3D,options);
			return kernel(a);
		}
		if(this.logger.active) this.logger.send({label:"frameworkColumns",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function2D,options);
		return kernel(a,details.columns);
	} else {
		options.output.y=blocks;
		const aRevised=this.loadColumns(a,columns,true,blocks);
		if(this.logger.active) this.logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function3D,options);
		return kernel(aRevised);
	}
}
function frameworkRows(a,rows,pipeline=false,blocks=1,function2D,function3D) {
	const details=getDetails.rows(a,rows,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.y},constants:{size:details.dimensions.x}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.y;
			options.output.y=details.dimensions.z;
			const kernel=this.gpu.createKernel(function3D,options);
			if(this.logger.active) this.logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
			return kernel(a);
		}
		if(this.logger.active) this.logger.send({label:"frameworkRows",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function2D,options);
		return kernel(a,details.rows);
	} else {
		options.output.y=blocks;
		const aRevised=this.loadRows(a,rows,true,blocks);
		if(this.logger.active) this.logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
		const kernel=this.gpu.createKernel(function3D,options);
		return kernel(aRevised);
	}
}
module.exports={
	columns:frameworkColumns,
	rows:frameworkRows
};