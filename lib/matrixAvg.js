function matrixAvgRows(a,rows,pipeline,blocks) {
	return this.frameworkRows(a,rows,pipeline,blocks,
		function matrixAvg2DRowFunction(a,rows) {
			const {thread:{x},constants:{size}}=this,row=rows[x];
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[row][i];
			return sum/size;
		},
		function matrixAvg3DRowFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[y][x][i];
			return sum/size;
		}
	);
}
function matrixAvgColumns(a,columns,pipeline,blocks) {
	return this.frameworkColumns(a,columns,pipeline,blocks,
		function matrixAvg2DColumnFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[i][column];
			return sum/size;
		},
		function matrixAvg3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[y][i][x];
			return sum/size;
		}
	);
}
module.exports={
		columns:matrixAvgColumns,
		rows:matrixAvgRows
}