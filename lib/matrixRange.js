function rows2D(a,rows) {
	const {thread:{x},constants:{size}}=this,row=rows[x];
	let min=a[row][0],max=min;
	for(let i=0;i<size; i++) {
		const v=a[row][i];
		if(v<min) min=v
		else if(v>max) max=v;
	}
	return [min,max];
}
function rows3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let min=a[0][x],max=min;
	for(let i=0;i<size; i++) {
		const v=a[y][x][i];
		if(v<min) min=v
		else if(v>max) max=v;
	}
	return [min,max];
}
function columns2D(a,columns) {
	const {thread:{x},constants:{size}}=this,column=columns[x];
	let min=a[0][column],max=min;
	for(let i=0;i<size; i++) {
		const v=a[i][column];
		if(v<min) min=v
		else if(v>max) max=v;
	}
	return [min,max];
}
function columns3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let min=a[0][x],max=min;
	for(let i=0;i<size; i++) {
		const v=a[y][i][x];
		if(v<min) min=v
		else if(v>max) max=v;
	}
	return [min,max];
}
module.exports={
		columns2D:columns2D,
		columns3D:columns3D,
		rows2D:rows2D,
		rows3D:rows3D
	};