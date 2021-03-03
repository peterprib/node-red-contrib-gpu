function columns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=this.loadColumns(a,columns,true,blocks);
	const mean=this.matrixAvgColumns(aRevised,details,false,blocks);  // can't have two pipes
	const options={pipeline:pipeline,output:{x:columnCount},constants:{size:details.dimensions.y}}
	let kernel;
	if(blocks==1) {
		options.output.y=columnCount;
		kernel=this.gpu.createKernel(function covarianceColumnFunction(a,mean) {
				const {thread:{x,y},constants:{size}}=this;
				let covariance=0;
				for(let i=0;i<size; i++) covariance+=a[i][x]*a[i][y];
				return covariance/size-mean[x]*mean[y];
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function covarianceBlocksColumnFunction(a,mean) {
			const {thread:{x,y,z},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[z][i][x]*a[y][i][x];
			return covariance/size-mean[z][x]*mean[y][x];
		},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixCovarianceColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,mean);
	return showDetails?{results:results,mean:mean}:results;
}
function rows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=this.loadColumns(a,rows,true,blocks);
	const mean=this.matrixAvgRows(aRevised,details,false,blocks);
	const options={pipeline:pipeline,output:{x:rowCount},constants:{size:details.dimensions.x}}
	let kernel;
	if(blocks==1) {
		options.output.y=rowCount;
		 kernel=this.gpu.createKernel(function matrixCovarianceRows(a,mean) {
			const {thread:{x,y},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[x][i]*a[y][i];
			return covariance/size-mean[x]*mean[y];
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function covarianceBlocksRowFunction(a,mean) {
			const {thread:{x,y,z},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[z][x][i]*a[y][x][i];
			return covariance/size-mean[z][x]*mean[y][x];
		},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixCovarianceRows",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,mean);
	return showDetails?{results:results,mean:mean}:results;
}
module.exports={
		columns:columns,
		rows:rows
	};