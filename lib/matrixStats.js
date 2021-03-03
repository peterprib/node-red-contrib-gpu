function columns2D(a,columns) {
	const {thread:{x},constants:{size}}=this,column=columns[x];
	let sum=0,sumSquared=0,min=a[0][column],max=min;
	for(let i=0;i<size; i++) {
		const v=a[i][column];
		sum+=v;
		sumSquared+=v**2;
		if(v<min) min=v
		else if(v>max) max=v;
	}
	const range=max-min,
		average=sum/size,
		variance=(sumSquared/size)-average**2;
	return [min,max,average,Math.sqrt(variance)];
}
function columns3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let sum=0,sumSquared=0,min=a[y][0][x],max=min;
	for(let i=0;i<size; i++) {
		const v=a[y][i][x];
		sum+=v;
		sumSquared+=v**2;
		if(v<min) min=v
		else if(v>max) max=v;
	}
	const range=max-min,
		average=sum/size,
		variance=(sumSquared/size)-average**2;
	return [min,max,average,Math.sqrt(variance)];
}
function rows2D(a,rows) {
	const {thread:{x},constants:{size}}=this,row=rows[x];
	let sum=0,sumSquared=0,min=a[row][0],max=min;
	for(let i=0;i<size; i++) {
		const v=a[row][i];
		sum+=v;
		sumSquared+=v**2;
		if(v<min) min=v
		else if(v>max) max=v;
	}
	const range=max-min,
		average=sum/size,
		variance=(sumSquared/size)-average**2;
	return [min,max,average,Math.sqrt(variance)];
}
function rows3D(a) {
	const {thread:{x,y},constants:{size}}=this;
	let sum=0,sumSquared=0,min=a[y][x][0],max=min;
	for(let i=0;i<size; i++) {
		const v=a[y][x][i];
		sum+=v;
		sumSquared+=v**2;
		if(v<min) min=v
		else if(v>max) max=v;
	}
	const range=max-min,
		average=sum/size,
		variance=(sumSquared/size)-average**2;
	return [min,max,average,Math.sqrt(variance)];
}
module.exports={
		columns2D:columns2D,
		columns3D:columns3D,
		rows2D:rows2D,
		rows3D:rows3D
	};