function columns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=this.loadColumns(a,details,true,blocks);
	const norms=this.matrixNormsColumns(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:columnCount},constants:{size:details.dimensions.y/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=columnCount;
		kernel=this.gpu.createKernel(function correlationColumnFunction(a,norms) {
				const {thread:{x,y},constants:{size}}=this,avgX=norms[x][0],avgY=norms[y][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[i][x]-avgX)*(a[i][y]-avgY);
//				return correlation/(size*norms[x][1]*norms[y][1])
				return Math.round((correlation/(size*norms[x][1]*norms[y][1]))*1000)/1000;
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function correlationBlocksColumnFunction(a,norms) {
				const {thread:{x,y,z},constants:{size}}=this,avgZX=norms[z][x][0],avgYX=norms[y][x][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[z][i][x]-avgZX)*(a[y][i][x]-avgYX);
//				return [Math.round((correlation/(size*norms[z][x][1]*norms[y][x][1]))*1000)/1000,correlation,a[y][0][x],a[y][1][x]];
				return Math.round((correlation/(size*norms[z][x][1]*norms[y][x][1]))*1000)/1000;
			},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixCorrelationColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,norms);
	return showDetails?{results:results,norms:norms}:results;
}
function rows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=this.loadRows(a,details,true,blocks);
	const norms=this.matrixNormsRows(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:rowCount},constants:{size:details.dimensions.x/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=rowCount;
		kernel=this.gpu.createKernel(function correlationRowFunction(a,norms) {
				const {thread:{x,y},constants:{size}}=this,avgX=norms[x][0],avgY=norms[y][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[x][i]-avgX)*(a[y][i]-avgY);
				return Math.round(correlation/(size*norms[x][1]*norms[y][1])*1000)/1000;
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function correlationBlocksRowFunction(a,norms) {
				const {thread:{x,y,z},constants:{size}}=this,avgZX=norms[z][x][0],avgYX=norms[y][x][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[z][x][i]-avgZX)*(a[y][x][i]-avgYX);
				return Math.round(correlation/(size*norms[z][x][1]*norms[y][x][1])*1000)/1000;
			},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixCorrelationRows",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,norms);
	return showDetails?{results:results,norms:norms}:results;
}
module.exports={
	columns:columns,
	rows:rows,
};