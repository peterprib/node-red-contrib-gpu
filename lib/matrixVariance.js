function rows2D(a,rows) {
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
}
function rows3D(a) {
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
function columns2D(a,columns) {
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
}
function columns3D(a) {
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
module.exports={
		columns2D:columns2D,
		columns3D:columns3D,
		rows2D:rows2D,
		rows3D:rows3D
	};