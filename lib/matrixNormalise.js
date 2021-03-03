function columns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=this.loadColumns(a,details,true,blocks);
	const stats=this.matrixStatsColumns(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:columnCount,y:details.dimensions.y}};
	let kernel;
	if(blocks==1) {
		kernel=this.gpu.createKernel(function NormaliseColumnFunction(a,stats) {
				const {thread:{x,y}}=this,avg=stats[x][2],range=stats[x][1]-stats[x][0];
				return (a[y][x]-avg)/range;
			},options);
	} else {
		options.output.y=options.output.y/blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function NormaliseBlocksColumnFunction(a,stats) {
				const {thread:{x,y,z}}=this, avg=stats[z][x][2],range=stats[z][x][1]-stats[z][x][0];
				return (a[z][y][x]-avg)/range;
			},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixNormaliseColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,stats);
	return showDetails?{results:results,stats:stats}:results;
}
function rows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=this.getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=this.loadRows(a,details,true,blocks);
	const stats=this.matrixStatsRows(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{y:rowCount,x:details.dimensions.x}};
	let kernel;
	if(blocks==1) {
		kernel=this.gpu.createKernel(function NormaliseRowFunction(a,stats) {
				const {thread:{x,y}}=this,avg=stats[y][2],range=stats[y][1]-stats[y][0];
				return (a[y][x]-avg)/range;
			},options);
	} else {
		options.output.x=options.output.x/blocks;
		options.output.z=blocks;
		kernel=this.gpu.createKernel(function NormaliseBlocksRowFunction(a,stats) {
				const {thread:{x,y,z}}=this, avg=stats[z][y][2],range=stats[z][y][1]-stats[z][y][0];    
				return (a[z][y][x]-avg)/range;
			},options);
	}
	if(this.logger.active) this.logger.send({label:"matrixNormaliseRows",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,stats);
	return showDetails?{results:results,stats:stats}:results;
}
module.exports={
		columns:columns,
		rows:rows,
	};