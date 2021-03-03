function rows2D(a,rows) {
	const {thread:{x},constants:{size}}=this,row=rows[x];
	let sum=0;
	for(let i=0;i<size; i++) sum+=a[row][i];
	return sum;
}
function rows3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let sum=0;
	for(let i=0;i<size; i++) sum+=a[y][x][i];
	return sum;
}
function columns2D(a,columns) {
	const {thread:{x},constants:{size}}=this,column=columns[x];
	let sum=0;
	for(let i=0;i<size; i++) sum+=a[i][column];
	return sum;
}
function columns3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let sum=0;
	for(let i=0;i<size; i++) sum+=a[y][i][x];
	return sum;
}
module.exports={
		columns2D:columns2D,
		columns3D:columns3D,
		rows2D:rows2D,
		rows3D:rows3D
	};