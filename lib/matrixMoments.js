function columns2D(a,columns) {
	const {thread:{x},constants:{size}}=this,column=columns[x];
	let sum=0,sumSquared=0,sumCubed=0;
	for(let i=0;i<size; i++) {
		const v=a[i][column],v2=v*v,v3=v2*v;
		sum+=v;
		sumSquared+=v2;
		sumCubed+=v3;
	}
	const average=sum/size,
		variance=(sumSquared/size)-average**2,
		stdDev=Math.sqrt(variance),
		skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
	return [average,variance,skew];
}
function columns3D(a) {
	const {thread:{x},constants:{size}}=this;
	let sum=0,sumSquared=0,sumCubed=0;
	for(let i=0;i<size; i++) {
		const v=a[i][x],v2=v*v,v3=v2*v;
		sum+=v;
		sumSquared+=v2;
		sumCubed+=v3;
	}
	const average=sum/size,
		variance=(sumSquared/size)-average**2,
		stdDev=Math.sqrt(variance),
		skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
	return [average,variance,skew];
}
function rows2D(a,rows) {
	const {thread:{x},constants:{size}}=this,row=rows[x];
	let sum=0,sumSquared=0,sumCubed=0;
	for(let i=0;i<size; i++) {
		const v=a[row][i],v2=v*v,v3=v2*v;
		sum+=v;
		sumSquared+=v2;
		sumCubed+=v3;
	}
	const average=sum/size,
		variance=(sumSquared/size)-average**2,
		stdDev=Math.sqrt(variance),
		skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
	return [average,variance,skew];
}
function rows3D(a) {
	const {thread:{x},constants:{size}}=this;
	let sum=0,sumSquared=0,sumCubed=0;
	for(let i=0;i<size; i++) {
		const v=a[x][i],v2=v*v,v3=v2*v;
		sum+=v;
		sumSquared+=v2;
		sumCubed+=v3;
	}
	const average=sum/size,
		variance=(sumSquared/size)-average**2,
		stdDev=Math.sqrt(variance),
		skew=(sumCubed-3*average*variance-average**3)/(variance*stdDev);
	return [average,variance,skew];
}
module.exports={
		columns2D:columns2D,
		columns3D:columns3D,
		rows2D:rows2D,
		rows3D:rows3D
	};