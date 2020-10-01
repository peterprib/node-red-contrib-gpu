function matrixSumRows(a,rows,pipeline=false,blocks) {
	return this.frameworkRows(a,rows,pipeline,blocks,
		function matrixSum2DRowFunction(a,rows) {
			const {thread:{x},constants:{size}}=this,row=rows[x];
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[row][i];
			return sum;
		},
		function matrixSum3DRowFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[y][x][i];
			return sum;
		}
	);
}
function matrixSumColumns(a,columns,pipeline=false,blocks) {
	return this.frameworkColumns(a,columns,pipeline,blocks,
		function matrixSum2DColumnFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[i][column];
			return sum;
		},
		function matrixSum3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0;
			for(let i=0;i<size; i++) sum+=a[y][i][x];
			return sum;
		}
	);
}
module.exports={
		columns:matrixSumColumns,
		rows:matrixSumRows
}