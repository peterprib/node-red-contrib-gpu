function loadColumns(a,columns,pipeline=false,blocks=1) {
	const details=this.getDetailsColumns(a,columns);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{x:details.columns.length,y:details.dimensions.y}};
		if(this.logger.active) this.logger.send({label:"loadColumns 1",options:options,details:details});
		const kernel=this.gpu.createKernel(function loadColumnFunction(a,columns) {
				const {thread:{x,y}}=this,column=columns[x];
				return a[y][column];
			},
			options
		);
		if(pipeline) kernel.immutable=true;
		return kernel(a,details.columns);
	}
	const size=details.dimensions.y/blocks;
	if(Math.round(size)!==size) throw Error("array column size (number of rows) "+details.dimensions.y +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{x:details.columns.length,y:blocks,z:size},constants:{size:size}};
	if(this.logger.active) this.logger.send({label:"loadColumns",options:options,details:details});
	const kernel=this.gpu.createKernel(function loadColumnsBlockedFunction(a,columns) {
			const {thread:{x,y,z},constants:{size}}=this,column=columns[x];
			return a[z*size+y][column];
		},
		options
	);
	return kernel(a,details.columns);
}
function loadRows(a,rows,pipeline=false,blocks=1) {
	const details=this.getDetailsRows(a,rows);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{y:details.rows.length,x:details.dimensions.x}};
		if(this.logger.active) this.logger.send({label:"loadRows 1",options:options,details:details});
		const kernel=this.gpu.createKernel(function loadRowsFunction(a,rows) {
				const {thread:{x,y}}=this,row=rows[y];
				return a[row][x];
			},
			options
		);
		if(pipeline) kernel.immutable=true;
		return kernel(a,details.rows);
	}
	const size=details.dimensions.x/blocks;
	if(Math.round(size)!==size) throw Error("array row size (number of columns) "+details.dimensions.x +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{y:details.rows.length,x:blocks,z:size},constants:{size:size}};
	if(this.logger.active) this.logger.send({label:"loadRows",options:options,details:details});
	const kernel=this.gpu.createKernel(function loadRowsBlockedFunction(a,rows) {
			const {thread:{x,y,z},constants:{size}}=this,row=rows[y];
			return a[row][z*size+x];
		},
		options
	);
	if(pipeline) kernel.immutable=true;
	return kernel(a,details.rows);
}
module.exports={
		columns:loadColumns,
		rows:loadRows
}