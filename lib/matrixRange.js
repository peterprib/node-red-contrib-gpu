function matrixRangeRows(a,rows,pipeline,blocks) {
	return this.frameworkRows(a,rows,pipeline,blocks,
		function matrixRange2DRowFunction(a,rows) {
			const {thread:{x},constants:{size}}=this,row=rows[x];
			let min=a[row][0],max=min;
			for(let i=0;i<size; i++) {
				const v=a[row][i];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		},
		function matrixRange3DRowFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let min=a[0][x],max=min;
			for(let i=0;i<size; i++) {
				const v=a[y][x][i];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		}
	);
}
function matrixRangeColumns(a,columns,pipeline,blocks) {
	return this.frameworkColumns(a,columns,pipeline,blocks,
		function matrixRange2DColumnFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let min=a[0][column],max=min;
			for(let i=0;i<size; i++) {
				const v=a[i][column];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		},
		function matrixRange3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let min=a[0][x],max=min;
			for(let i=0;i<size; i++) {
				const v=a[y][i][x];
				if(v<min) min=v
				else if(v>max) max=v;
			}
			return [min,max];
		}
	);
}
module.exports={
		columns:matrixRangeColumns,
		rows:matrixRangeRows
}