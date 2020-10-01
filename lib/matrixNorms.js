function matrixNormsColumns(a,columns,pipeline,blocks) {
	return this.frameworkColumns(a,columns,pipeline,blocks,
		function matrixNorm2DColumnFunction(a,columns) {
			const {thread:{x},constants:{size}}=this,column=columns[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[i][column],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average*average,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];		},
		function matrixNorm3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[y][i][x],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average*average,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];
		}
	);
}
function matrixNormsRows(a,rows,pipeline,blocks) {
	return this.frameworkRows(a,rows,pipeline,blocks,
		function matrixNorm2DRowFunction(a,rows) {
			const {thread:{x},constants:{size}}=this,row=rows[x];
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[row][i],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average*average,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];		},
		function matrixNorm3DColumnFunction(a) {
			const {thread:{x,y},constants:{size}}=this;
			let sum=0,sumSquared=0,sumCubed=0;
			for(let i=0;i<size; i++) {
				const v=a[y][x][i],v2=v*v,v3=v2*v;
				sum+=v;
				sumSquared+=v2;
				sumCubed+=v3;
			}
			const average=sum/size,
				variance=(sumSquared/size)-average*average,
				stdDev=Math.sqrt(variance),
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];
		}
	);
}
module.exports={
		columns:matrixNormsColumns,
		rows:matrixNormsRows
}