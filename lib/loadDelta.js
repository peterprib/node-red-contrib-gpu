function loadColumnsDelta(a,columns,pipeline=false,blocks=1) {
	const details=this.getDetailsColumns(a,columns);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{x:details.columns.length,y:details.dimensions.y-1}};
		if(this.logger.active) this.logger.send({label:"loadColumnsDelta 1",options:options,details:details});
		const kernel=this.gpu.createKernel(function loadColumnsDeltaFunction(a,columns) {
				const {thread:{x,y}}=this,column=columns[x];
				return a[y+1][column]-a[y][column];
			},
			options
		);
		return kernel(a,details.columns);
	}
	const size=details.dimensions.y/blocks;
	if(Math.round(size)!==size) throw Error("array column size (number of rows) "+details.dimensions.y +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{x:details.columns.length,y:blocks-1,z:size},constants:{size:size}};
	if(this.logger.active) this.logger.send({label:"loadColumnsDeltaBlocked",options:options,details:details});
	const kernel=this.gpu.createKernel(function loadColumnsDeltaBlockedFunction(a,columns) {
			const {thread:{x,y,z},constants:{size}}=this,column=columns[x],row=z*size+y;
			return a[row+1][column]-a[row][column];
		},
		options
	);
	return kernel(a,details.columns);
}

function loadRowsDelta(a,rows,pipeline=false,blocks=1) {
	const details=this.getDetailsRows(a,rows);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{y:details.rows.length,x:details.dimensions.x-1}};
		if(this.logger.active) this.logger.send({label:"loadRowsDelta 1",options:options,details:details});
		const kernel=this.gpu.createKernel(function loadRowsDeltaFunction(a,rows) {
				const {thread:{x,y}}=this,row=rows[y];
				return a[row][x+1]-a[row][x];
			},
			options
		);
		return kernel(a,details.rows);
	}
	const size=details.dimensions.x/blocks;
	if(Math.round(size)!==size) throw Error("array row size (number of columns) "+details.dimensions.x +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{y:details.rows.length,x:blocks-1,z:size},constants:{size:size}};
	if(this.logger.active) this.logger.send({label:"loadRowsDleta",options:options,details:details});
	const kernel=this.gpu.createKernel(function loadRowsDeltaBlockedFunction(a,rows) {
			const {thread:{x,y,z},constants:{size}}=this,row=rows[y],column=z*size+x;
			return a[row][column+1]-a[row][column];
		},
		options
	);
	return kernel(a,details.rows);
}

module.exports={
		columns:loadColumnsDelta,
		rows:loadRowsDelta
}
