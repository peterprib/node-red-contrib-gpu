function matrixVarianceRows(a,rows,pipeline,blocks) {
	return this.frameworkRows(a,rows,pipeline,blocks,
		function matrixVariance2DRowFunction(a,rows) {
			const {thread:{x,y},constants:{size}}=this,row=rows[x];
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[row][i];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		},
		function matrixVariance3DRowFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[y][x][i];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		}
	);
}
function matrixVarianceColumns(a,columns,pipeline,blocks) {
	return this.frameworkColumns(a,columns,pipeline,blocks,
		function matrixVariance2DColumnFunction(a,columns) {
			const {thread:{x,y},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[i][column];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		},
		function matrixVariance3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0,sumSquared=0;
			for(let i=0;i<size; i++) {
				const v=a[y][i][x];
				sum+=v;
				sumSquared+=v**2;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average**2;
			return variance;
		}
	);
}
module.exports={
		columns:matrixVarianceColumns,
		rows:matrixVarianceRows
}