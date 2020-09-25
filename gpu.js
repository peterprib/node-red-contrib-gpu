const logger = new (require("node-red-contrib-logger"))("gpu");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const { GPU, input, Input } = require('gpu.js');
if(GPU.isGPUSupported) logger.sendInfo("GPU supported")
else logger.sendWarning("GPU not supported");
//const gpu= new GPU({mode:"dev"});
//const gpu= new GPU({mode:"cpu"});
const gpu= new GPU();

function getColor(t) {
	if(t>=0 && t<=0.25)		return [255 + (0 - 255) * t / 0.25, 255 + (0 - 255) * t / 0.25, 255];
	if(t>=0.25 && t<=0.55)	return [0, 255 * (t - 0.25) / 0.3, 255 + (0 - 255) * (t - 0.25) / 0.3];
	if(t>=0.55 && t<= 0.85)	return [255 * (t - 0.55) / 0.3, 255, 0];
	if(t>=0.85 && t<=1)		return [255, 255 + (0 - 255) * (t - 0.85) / 0.15, 0];
	return [255,255,255];
}
function isArray(a) {
	return a instanceof Array
		|| a instanceof Float32Array
		|| a instanceof Float32Array
		|| a instanceof Int16Array
		|| a instanceof Int8Array
		|| a instanceof Uint16Array
		|| a instanceof Uint8Array;
}
function checkObject(a) {
	if(a instanceof Array) {
		const l=Math.min(20,a.length);
		for(let i=0;i<l;i++)
			if(typeof a[i] !== "number") throw Error("column "+i+" is not a number, cells must be numbers, value: "+a[i]);
		return a.length;
	}
	if(isArray(a)) return a.length;
	throw Error("columns must be array");
}
function arrayCleanse(a) {
	if(!a) return a;
	if(a instanceof Array) 	return a.map(c=>arrayCleanse(c));
	if(isArray(a)) {
		const r=[]; 
		for(let i=0;i<a.length;i++) r.push(a[i]);
		return r;
	}
	if(typeof a =="object") {
		const r={}; 
		for (const p in a) r[p]=arrayCleanse(a[p]);
		return r;
	}
	return a;
}
function sizeBlocked(v,blocks) {
	const r=v/blocks;
	if(Number.isInteger(r)) return r; 
	throw Error("Blocks "+blocks+" not evenly divisable into array size "+v)
}
function arrayDimensions(a,blocks=1,yBlocks=1) {
	if(isArray(a)) {
		if(isArray(a[0])) {
			if(isArray(a[0][0])) {
				if(blocks>1||yBlocks>1) throw Error("blocks>1 but already at 3D")
				return {z:a.length,y:a[0].length,x:checkObject(a[0][0])}
			}
			const x=checkObject(a[0]);
			if(blocks>1) return {z:blocks,y:sizeBlocked(a.length,blocks),x:x};
			if(yBlocks>1) return {z:yBlocks,y:a.length,x:sizeBlocked(x,yBlocks)};
			return {y:a.length,x:x}
		}
		const x=checkObject(a);
		if(blocks>1) return {x:blocks,y:sizeBlocked(y,blocks)}; 
		if(yBlocks>1) return {y:yBlocks,x:sizeBlocked(y,yBlocks)}; 
		return {x:x};
	};
	throw Error("Not an array ");
}
function frameworkColumns(a,columns,pipeline=false,blocks=1,function1,functionMany) {
	const details=getDetailsColumns(a,columns,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.x},constants:{size:details.dimensions.y}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.x;
			options.output.y=details.dimensions.z;
			if(logger.active) logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
			const kernel=gpu.createKernel(functionMany,options);
			return kernel(a);
		}
		if(logger.active) logger.send({label:"frameworkColumns",blocks:blocks,options:options,details:details});
		const kernel=gpu.createKernel(function1,options);
		return kernel(a,details.columns);
	} else {
		options.output.y=blocks;
		const aRevised=loadColumns(a,columns,true,blocks);
		if(logger.active) logger.send({label:"frameworkColumns many",blocks:blocks,options:options,details:details});
		const kernel=gpu.createKernel(functionMany,options);
		return kernel(aRevised);
	}
}
function frameworkRows(a,rows,pipeline=false,blocks=1,function1,functionMany) {
	const details=getDetailsRows(a,rows,blocks);
	const options={pipeline:pipeline,output:{x:details.dimensions.y},constants:{size:details.dimensions.x}}
	if(blocks==1) {
		if(details.dimensions.z) {
			options.output.x=details.dimensions.y;
			options.output.y=details.dimensions.z;
			const kernel=gpu.createKernel(functionMany,options);
			if(logger.active) logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
			return kernel(a);
		}
		if(logger.active) logger.send({label:"frameworkRows",blocks:blocks,options:options,details:details});
		const kernel=gpu.createKernel(function1,options);
		return kernel(a,details.rows);
	} else {
		options.output.y=blocks;
		const aRevised=loadRows(a,rows,true,blocks);
		if(logger.active) logger.send({label:"frameworkRows many",blocks:blocks,options:options,details:details});
		const kernel=gpu.createKernel(functionMany,options);
		return kernel(aRevised);
	}
}
function getDetailsColumns(a,columnsIn,blocks){
	if(columnsIn=="pipe") {
		if(!("output" in a)) throw ("array not a pipe")
		const columns=[],cl=a.output[0];
		for(let i=0;i<cl;++i) columns.push(i);
		return {dimensions:{x:a.output[0],y:a.output[1],z:a.output[2]==1?null:a.output[2]},columns:columns}
	}
	if(!Array.isArray(columnsIn||[])) return columnsIn;
	const dimensions=arrayDimensions(a,blocks);
	if(dimensions.x<1) throw Error("array has length zero");
	const columns=columnsIn||[];
	if(columns.length==0)
		for(let i=0;i<dimensions.x;++i) columns.push(i);
	else for(let i in columns) if(i>=dimensions.x) throw(i+" greater than last column offset "+dimensions.x-1)
	return {dimensions:dimensions,columns:columns}
}
function getDetailsRows(a,rowsIn,blocks){
	if(rowsIn=="pipe") {
		if(!("output" in a)) throw ("array not a pipe")
		const rows=[],rl=a.output[1];
		for(let i=0;i<rl;++i) rows.push(i);
		const details={dimensions:{x:a.output[0],y:a.output[1],z:a.output[2]==1?null:a.output[2]},rows:rows};
		if(logger.active) logger.send({label:"getDetailsRows pipe ",output:a.output,details:details});
		return details
	}
	if(!Array.isArray(rowsIn||[])) return rowsIn;
	const dimensions=arrayDimensions(a,null,blocks);
	if(dimensions.y<1) throw Error("array has length zero");
	const rows=rowsIn||[];
	if(rows.length==0)
		for(let i=0;i<dimensions.y;++i) rows.push(i);
	else for(let i in rows) if(i>=dimensions.y) throw(i+" greater than last row offset "+dimensions.y-1)
	return {dimensions:dimensions,rows:rows}
}
function loadColumns(a,columns,pipeline=false,blocks=1) {
	const details=getDetailsColumns(a,columns);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{x:details.columns.length,y:details.dimensions.y}};
		if(logger.active) logger.send({label:"loadColumns 1",options:options,details:details});
		const kernel=gpu.createKernel(function loadColumnFunction(a,columns) {
				const {thread:{x,y}}=this,column=columns[x];
				return a[y][column];
			},
			options
		);
		return kernel(a,details.columns);
	}
	const size=details.dimensions.y/blocks;
	if(Math.round(size)!==size) throw Error("array column size (number of rows) "+details.dimensions.y +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{x:details.columns.length,y:blocks,z:size},constants:{size:size}};
	if(logger.active) logger.send({label:"loadColumns",options:options,details:details});
	const kernel=gpu.createKernel(function loadColumnsBlockedFunction(a,columns) {
			const {thread:{x,y,z},constants:{size}}=this,column=columns[x];
			return a[z*size+y][column];
		},
		options
	);
	return kernel(a,details.columns);
}
function loadColumnsDelta(a,columns,pipeline=false,blocks=1) {
	const details=getDetailsColumns(a,columns);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{x:details.columns.length,y:details.dimensions.y-1}};
		if(logger.active) logger.send({label:"loadColumnsDelta 1",options:options,details:details});
		const kernel=gpu.createKernel(function loadColumnsDeltaFunction(a,columns) {
				const {thread:{x,y}}=this,column=columns[x];
				return a[y+1][column]-a[y][column];
			},
			options
		);
		return kernel(a,details.columns);
	}
	const size=details.dimensions.y/blocks;
	if(Math.round(size)!==size) throw Error("array column size (number of rows) "+details.dimensions.y +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{x:details.columns.length,y:blocks-1,z:size},constants:{size:size}};
	if(logger.active) logger.send({label:"loadColumnsDeltaBlocked",options:options,details:details});
	const kernel=gpu.createKernel(function loadColumnsDeltaBlockedFunction(a,columns) {
			const {thread:{x,y,z},constants:{size}}=this,column=columns[x],row=z*size+y;
			return a[row+1][column]-a[row][column];
		},
		options
	);
	return kernel(a,details.columns);
}
function loadRows(a,rows,pipeline=false,blocks=1) {
	const details=getDetailsRows(a,rows);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{y:details.rows.length,x:details.dimensions.x}};
		if(logger.active) logger.send({label:"loadRows 1",options:options,details:details});
		const kernel=gpu.createKernel(function loadRowsFunction(a,rows) {
				const {thread:{x,y}}=this,row=rows[y];
				return a[row][x];
			},
			options
		);
		return kernel(a,details.rows);
	}
	const size=details.dimensions.x/blocks;
	if(Math.round(size)!==size) throw Error("array row size (number of columns) "+details.dimensions.x +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{y:details.rows.length,x:blocks,z:size},constants:{size:size}};
	if(logger.active) logger.send({label:"loadRows",options:options,details:details});
	const kernel=gpu.createKernel(function loadRowsBlockedFunction(a,rows) {
			const {thread:{x,y,z},constants:{size}}=this,row=rows[y];
			return a[row][z*size+x];
		},
		options
	);
	return kernel(a,details.rows);
}
function loadRowsDelta(a,rows,pipeline=false,blocks=1) {
	const details=getDetailsRows(a,rows);
	if(blocks==1) {
		const options={pipeline:pipeline,output:{y:details.rows.length,x:details.dimensions.x-1}};
		if(logger.active) logger.send({label:"loadRowsDelta 1",options:options,details:details});
		const kernel=gpu.createKernel(function loadRowsDeltaFunction(a,rows) {
				const {thread:{x,y}}=this,row=rows[y];
				return a[row][x+1]-a[row][x];
			},
			options
		);
		return kernel(a,details.rows);
	}
	const size=details.dimensions.x/blocks;
	if(Math.round(size)!==size) throw Error("array row size (number of columns) "+details.dimensions.x +" not evenly divisible by "+blocks);
	const options={pipeline:pipeline,output:{y:details.rows.length,x:blocks-1,z:size},constants:{size:size}};
	if(logger.active) logger.send({label:"loadRowsDleta",options:options,details:details});
	const kernel=gpu.createKernel(function loadRowsDeltaBlockedFunction(a,rows) {
			const {thread:{x,y,z},constants:{size}}=this,row=rows[y],column=z*size+x;
			return a[row][column+1]-a[row][column];
		},
		options
	);
	return kernel(a,details.rows);
}
function matrixMultipleScalar1D(s,m) {return s*m[this.thread.x];}
function matrixMultipleScalar2D(s,m) {return s*m[this.thread.x][this.thread.y];}
function matrixMultipleScalar3D(s,m) {return s*m[this.thread.x][this.thread.y][this.thread.z];}
function matrixMultiple1DScalar(m,s) {return m[this.thread.x]*s;}
function matrixMultiple2DScalar(m,s) {return m[this.thread.y][this.thread.x]*s;}
function matrixMultiple3DScalar(m,s) {return m[this.thread.y][this.thread.x][this.thread.z]*s;}
function matrixMultipleMatrix2D(a,b) {
	const {thread:{x,y},constants:{size}}=this;
	var sum=0;
	for(let i= 0;i<size; i++)
		sum+=a[y][i]*b[i][x];
	return sum;
}
function matrixMultiple(a,b,pipeline=false) {
	const aIsArray=Array.isArray(a),bIsArray=Array.isArray(b),options={pipeline:pipeline};
	let callFunction;
	if(aIsArray){
		const aDimensions=arrayDimensions(a);
		if(bIsArray){
			const bDimensions=arrayDimensions(b);
			if(aDimensions.z || bDimensions.z) throw Error("3d not supported");
			if(aDimensions.x !== bDimensions.y) throw Error("Rows in first argument != columns in second argument");
			if(aDimensions.y && bDimensions.y) {
				options.output={x:aDimensions.x,y:bDimensions.x};
				options.constants={size:aDimensions.x};
				callFunction=matrixMultipleMatrix2D;
			} else {
				 throw Error("Both arguements must be dimension")
			}
		} else {
			options.output={x:aDimensions.x};
			if(aDimensions.y) options.output.y=aDimensions.y;
			if(aDimensions.z) options.output.z=aDimensions.z;
			callFunction=aDimensions.z?matrixMultiple3DScalar:aDimensions.y?matrixMultiple2DScalar:matrixMultiple1DScalar;
		}
	} else if(bIsArray){
		const bDimensions=arrayDimensions(b);
		options.output={x:bDimensions.x};
		if(bDimensions.y) options.output.y=bDimensions.y;
		if(bDimensions.z) options.output.z=bDimensions.z;
		callFunction=bDimensions.z?matrixMultipleScalar3D:bDimensions.y?matrixMultipleScalar2D:matrixMultipleScalar1D;
	} else {
		return a*b;
	}
	const kernel=gpu.createKernel(callFunction,options);
	return kernel(a,b);
}
function matrixTranspose(a,pipeline=false) {
	const aDimensions=arrayDimensions(a);
	if(aDimensions.z) throw Error("3d not supported");
	kernel=gpu.createKernel(function matrixTransposeFunction(a) {
		const {thread:{x,y}}=this;
		return a[x][y];
	},
	{pipeline:pipeline,output:{x:aDimensions.y,y:aDimensions.x}}
	);
	return kernel(a);
}
function matrixSumRows(a,rows,pipeline=false,blocks) {
	return frameworkRows(a,rows,pipeline,blocks,
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
	return frameworkColumns(a,columns,pipeline,blocks,
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
function matrixAvgRows(a,rows,pipeline,blocks) {
	return frameworkRows(a,rows,pipeline,blocks,
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
	return frameworkColumns(a,columns,pipeline,blocks,
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
function matrixRangeRows(a,rows,pipeline,blocks) {
	return frameworkRows(a,rows,pipeline,blocks,
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
	return frameworkColumns(a,columns,pipeline,blocks,
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
function matrixStatsColumns(a,columns,pipeline,blocks) {
	return frameworkColumns(a,columns,pipeline,blocks,
		function matrixStats2DColumnFunction(a,columns) {
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
		},
		function matrixStats3DColumnFunction(a) {
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
	);
}
function matrixStatsRows(a,rows,pipeline,blocks) {
	return frameworkRows(a,rows,pipeline,blocks,
		function matrixStats2DRowssFunction(a,rows) {
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
		},
		function matrixStats3DRowFunction(a) {
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
	);
}
function matrixVarianceRows(a,rows,pipeline,blocks) {
	return frameworkRows(a,rows,pipeline,blocks,
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
	return frameworkColumns(a,columns,pipeline,blocks,
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
function matrixMomentsColumns(a,columns,pipeline,blocks) {
	return frameworkColumns(a,columns,pipeline,blocks,
		function matrixMoments2DColumnFunction(a,columns) {
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
		},
		function matrixMoments3DColumnFunction(a) {
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
	);
}
function matrixMomentsRows(a,rows,pipeline=false,blocks=1) {
	const details=getDetailsRows(a,rows);
	const kernel=gpu.createKernel(function matrixMoments2DRowFunction(a,rows) {
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
		},
		{pipeline:pipeline,output:{x:details.rows.length},constants:{size:details.dimensions.x},returnType: 'Array(3)'}
	);
	return kernel(a,details.rows);
}
function matrixNormsColumns(a,columns,pipeline,blocks) {
	return frameworkColumns(a,columns,pipeline,blocks,
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
function matrixNormsRows(a,rows,pipeline=false,blocks=1) {   //????  need to convert to framework
	const details=getDetailsRows(a,rows);
	const kernel=gpu.createKernel(function matrixNormsRowFunction(a,rows) {
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
				skew=(sumCubed - 3*average*variance-average**3)/(variance*stdDev);
			return [average,stdDev,skew];
		},
		{pipeline:pipeline,output:{x:details.rows.length},constants:{size:details.dimensions.x},returnType: 'Array(3)'}
	);
	return kernel(a,details.rows);
}
function matrixCovarianceColumns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=loadColumns(a,columns,true,blocks);
	const mean=matrixAvgColumns(aRevised,details,true);
	const options={pipeline:pipeline,output:{x:columnCount},constants:{size:details.dimensions.y}}
	let kernel;
	if(blocks==1) {
		options.output.y=columnCount;
		kernel=gpu.createKernel(function covarianceColumnFunction(a,mean) {
				const {thread:{x,y},constants:{size}}=this;
				let covariance=0;
				for(let i=0;i<size; i++) covariance+=a[i][x]*a[i][y];
				return covariance/size-mean[x]*mean[y];
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function covarianceBlocksColumnFunction(a,mean) {
			const {thread:{x,y,z},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[z][i][x]*a[y][i][x];
			return covariance/size-mean[z][x]*mean[y][x];
		},options);
	}
	if(logger.active) logger.send({label:"matrixCovarianceColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,mean);
	return showDetails?{results:results,mean:mean}:results;
}
function matrixCovarianceRows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=loadColumns(a,rows,true,blocks);
	const mean=matrixAvgRows(aRevised,details,false,blocks);
	const options={pipeline:pipeline,output:{x:rowCount},constants:{size:details.dimensions.x}}
	let kernel;
	if(blocks==1) {
		options.output.y=rowCount;
		 kernel=gpu.createKernel(function matrixCovarianceRows(a,mean) {
			const {thread:{x,y},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[x][i]*a[y][i];
			return covariance/size-mean[x]*mean[y];
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function covarianceBlocksRowFunction(a,mean) {
			const {thread:{x,y,z},constants:{size}}=this;
			let covariance=0;
			for(let i=0;i<size; i++) covariance+=a[z][x][i]*a[y][x][i];
			return covariance/size-mean[z][x]*mean[y][x];
		},options);
	}
	const results=kernel(aRevised,mean);
	return showDetails?{results:results,mean:mean}:results;
}
function matrixCorrelationColumns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=loadColumns(a,details,true,blocks);
	const norms=matrixNormsColumns(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:columnCount},constants:{size:details.dimensions.y/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=columnCount;
		kernel=gpu.createKernel(function correlationColumnFunction(a,norms) {
				const {thread:{x,y},constants:{size}}=this,avgX=norms[x][0],avgY=norms[y][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[i][x]-avgX)*(a[i][y]-avgY);
//				return correlation/(size*norms[x][1]*norms[y][1])
				return Math.round((correlation/(size*norms[x][1]*norms[y][1]))*1000)/1000;
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function correlationBlocksColumnFunction(a,norms) {
				const {thread:{x,y,z},constants:{size}}=this,avgZX=norms[z][x][0],avgYX=norms[y][x][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[z][i][x]-avgZX)*(a[y][i][x]-avgYX);
//				return [Math.round((correlation/(size*norms[z][x][1]*norms[y][x][1]))*1000)/1000,correlation,a[y][0][x],a[y][1][x]];
				return Math.round((correlation/(size*norms[z][x][1]*norms[y][x][1]))*1000)/1000;
			},options);
	}
	if(logger.active) logger.send({label:"matrixCorrelationColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,norms);
	return showDetails?{results:results,norms:norms}:results;
}
function matrixCorrelationRows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=loadRows(a,details,true,blocks);
	const norms=matrixNormsRows(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:rowCount},constants:{size:details.dimensions.x/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=rowCount;
		kernel=gpu.createKernel(function correlationRowFunction(a,norms) {
				const {thread:{x,y},constants:{size}}=this,avgX=norms[x][0],avgY=norms[y][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[x][i]-avgX)*(a[y][i]-avgY);
				return Math.round(correlation/(size*norms[x][1]*norms[y][1])*1000)/1000;
			},options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function correlationBlocksRowFunction(a,norms) {
				const {thread:{x,y,z},constants:{size}}=this,avgZX=norms[z][x][0],avgYX=norms[y][x][0];
				let correlation=0;
				for(let i=0;i<size;i++) correlation+=(a[z][x][i]-avgZX)*(a[y][x][i]-avgYX);
				return Math.round(correlation/(size*norms[z][x][1]*norms[y][x][1])*1000)/1000;
			},options);
	}
	if(logger.active) logger.send({label:"matrixCorrelationRows",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,norms);
	return showDetails?{results:results,norms:norms}:results;
}
function matrixNormaliseColumns(a,columns,pipeline=false,blocks=1,showDetails){
	const details=getDetailsColumns(a,columns),columnCount=details.columns.length;
	const aRevised=loadColumns(a,details,true,blocks);
	const stats=matrixStatsColumns(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:columnCount,y:details.dimensions.y}}
//	const options={pipeline:pipeline,output:{y:details.rows.length,x:details.dimensions.x}};
	let kernel;
	if(blocks==1) {
		kernel=gpu.createKernel(function NormaliseColumnFunction(a,stats) {
				const {thread:{x,y}}=this,avg=stats[x][2],range=stats[x][1]-stats[x][0];
				return (a[y][x]-avg)/range;
			},options);
	} else {
		options.output.y=options.output.y/blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function NormaliseBlocksColumnFunction(a,stats) {
				const {thread:{x,y,z}}=this, avg=stats[z][x][2],range=stats[z][x][1]-stats[z][x][0];
				return (a[z][y][x]-avg)/range;
			},options);
	}
	if(logger.active) logger.send({label:"matrixNormaliseColumns",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,stats);
	return showDetails?{results:results,stats:stats}:results;
}
function matrixNormaliseRows(a,rows,pipeline=false,blocks=1,showDetails){
	const details=getDetailsRows(a,rows),rowCount=details.rows.length;
	const aRevised=loadRows(a,details,true,blocks);
	const stats=matrixStatsRows(aRevised,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{y:rowCount,x:details.dimensions.x}};
	let kernel;
	if(blocks==1) {
		kernel=gpu.createKernel(function NormaliseRowFunction(a,stats) {
				const {thread:{x,y}}=this,avg=stats[y][2],range=stats[y][1]-stats[y][0];
				return (a[y][x]-avg)/range;
			},options);
	} else {
		options.output.x=options.output.x/blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(function NormaliseBlocksRowFunction(a,stats) {
				const {thread:{x,y,z}}=this, avg=stats[z][y][2],range=stats[z][y][1]-stats[z][y][0];    
				return (a[z][y][x]-avg)/range;
			},options);
	}
	if(logger.active) logger.send({label:"matrixNormaliseRows",blocks:blocks,options:options,details:details});
	const results=kernel(aRevised,stats);
	return showDetails?{results:results,stats:stats}:results;
}
function imageToArray(image) {
	const kernel=gpu.createKernel(function(image) {
		const pixel=image[this.thread.y][this.thread.x];
		this.color(pixel.r, pixel.g, pixel.b, pixel.a);
	}, {
		output: [image.width, image.height],
		graphical: true,
		pipeline: true,
	});
	kernel(image);
	const result=kernel.getPixels(true);
	kernel.destroy();
	return result;
}
function gpuFunctions() {
	return this;
};

function evalOperand(operand){
	const function1D=eval("(function(a,b) {const {thread:{x}}=this;return a[x]"+operand+"b[x];})");
	const function2D=eval("(function(a,b) {const {thread:{x,y}}=this;return a[y][x]"+operand+"b[y][x];})");
	const function3D=eval("(function(a,b) {const {thread:{x,y,z}}=this;return a[z][y][x]"+operand+"b[z][y][x];})");

	const function1DSM=eval("(function(s,m) {const {thread:{x}}=this;return s"+operand+"m[x];})");
	const function2DSM=eval("(function(s,m) {const {thread:{x,y}}=this;return s"+operand+"m[y][x];})");
	const function3DSM=eval("(function(s,m) {const {thread:{x,y,z}}=this;return s"+operand+"m[z][y][x];})");

	const function1DMS=eval("(function(m,s) {const {thread:{x}}=this;return m[x]"+operand+"s;})");
	const function2DMS=eval("(function(m,s) {const {thread:{x,y}}=this;return m[y][x]"+operand+"s;})");
	const function3DMS=eval("(function(m,s) {const {thread:{x,y,z}}=this;return m[z][y][x]"+operand+"s;})");
	const functionSS=eval("(function(a,b) {return a"+operand+"b;})");
	return function(a,b,columns,pipeline=false,blocks=1) {
		const isAArray=Array.isArray(a),isBArray=Array.isArray(b)
//console.log("isAArray: "+isAArray+" isBArray: "+isBArray)
		let callFunction,dimensions;
		if(isAArray && isBArray) {
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3D:dimensions.y?function2D:function1D;
//console.log("MM "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else if(isAArray){
			dimensions=arrayDimensions(a);
			callFunction=dimensions.z?function3DMS:dimensions.y?function2DMS:function1DMS;
//console.log("MS "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else if(isBArray){
			dimensions=arrayDimensions(b);
			callFunction=dimensions.z?function3DSM:dimensions.y?function2DSM:function1DSM;
//console.log("SM "+" a: "+a+" b: "+b+" dimensions: "+JSON.stringify(dimensions))
		} else {
//console.log("SS "+" a: "+a+" b: "+b)
			return functionSS(a,b);
		}
		const kernel=gpu.createKernel(callFunction,
			{pipeline:pipeline,output:dimensions}
		);
		return kernel(a,b);
	}
}
gpuFunctions.prototype.arrayAdd=evalOperand("+");
gpuFunctions.prototype.arrayBitwiseAnd=evalOperand("&");
gpuFunctions.prototype.arrayBitwiseOr=evalOperand("|");
gpuFunctions.prototype.arrayBitwiseXOR=evalOperand("^");
gpuFunctions.prototype.arrayDivide=evalOperand("/");
gpuFunctions.prototype.arrayCleanse=arrayCleanse
gpuFunctions.prototype.arrayLeftShift=evalOperand("<<");
gpuFunctions.prototype.arrayMinus=evalOperand("-");
gpuFunctions.prototype.arrayMultiply=evalOperand("*");
gpuFunctions.prototype.arrayPower=evalOperand("**");
gpuFunctions.prototype.arrayRemainder=evalOperand("%");
gpuFunctions.prototype.arrayRightShift=evalOperand(">>");
gpuFunctions.prototype.arrayRightShiftZeroFill=evalOperand(">>>");
//gpuFunctions.prototype.arrayBitwiseNot=evalOperand("~");
//gpuFunctions.prototype.arrayLogicalOr=evalOperand("||","Boolean");
//gpuFunctions.prototype.arrayLogicalAnd=evalOperand("&&");
//gpuFunctions.prototype.arrayLogicalNullish=evalOperand("??");
//gpuFunctions.prototype.arrayEqual=evalOperand("==");
//gpuFunctions.prototype.arrayNotEqual=evalOperand("!=");
//gpuFunctions.prototype.arrayStrictEqual=evalOperand("===");
//gpuFunctions.prototype.arrayGreaterThan=evalOperand(">");
//gpuFunctions.prototype.arrayLessThan=evalOperand("<");
//gpuFunctions.prototype.arrayGreaterOrEqual=evalOperand(">=");
//gpuFunctions.prototype.arrayLessThanOrEqual=evalOperand("<=");
gpuFunctions.prototype.destroy=()=>gpu.destroy;
gpuFunctions.prototype.GPUSupported=GPU.isGPUSupported?true:false;
gpuFunctions.prototype.imageToArray=imageToArray;
gpuFunctions.prototype.isGPUSupported=GPU.isGPUSupported?()=>true:()=>false;
gpuFunctions.prototype.isArray=isArray
gpuFunctions.prototype.load=loadColumns;
gpuFunctions.prototype.loadColumns=loadColumns;
gpuFunctions.prototype.loadColumnsDelta=loadColumnsDelta;
gpuFunctions.prototype.loadRows=loadRows;
gpuFunctions.prototype.loadRowsDelta=loadRowsDelta;
gpuFunctions.prototype.matrixAvgColumns=matrixAvgColumns;
gpuFunctions.prototype.matrixAvgRows=matrixAvgRows;
gpuFunctions.prototype.matrixCorrelationRows=matrixCorrelationRows;
gpuFunctions.prototype.matrixCorrelationColumns=matrixCorrelationColumns;
gpuFunctions.prototype.matrixCovarianceRows=matrixCovarianceRows
gpuFunctions.prototype.matrixCovarianceColumns=matrixCovarianceColumns
gpuFunctions.prototype.matrixMomentsColumns=matrixMomentsColumns;
gpuFunctions.prototype.matrixMomentsRows=matrixMomentsRows;
gpuFunctions.prototype.matrixNormaliseRows=matrixNormaliseRows;
gpuFunctions.prototype.matrixNormaliseColumns=matrixNormaliseColumns;
gpuFunctions.prototype.matrixNormsRows=matrixNormsRows;
gpuFunctions.prototype.matrixNormsColumns=matrixNormsColumns;
gpuFunctions.prototype.matrixMultiple=matrixMultiple;
gpuFunctions.prototype.matrixRangeRows=matrixRangeRows;
gpuFunctions.prototype.matrixRangeColumns=matrixRangeColumns;
gpuFunctions.prototype.matrixStatsColumns=matrixStatsColumns;
gpuFunctions.prototype.matrixStatsRows=matrixStatsRows;
gpuFunctions.prototype.matrixSumColumns=matrixSumColumns;
gpuFunctions.prototype.matrixSumRows=matrixSumRows;
gpuFunctions.prototype.matrixTranspose=matrixTranspose;
gpuFunctions.prototype.matrixVarianceRows=matrixVarianceRows;
gpuFunctions.prototype.matrixVarianceColumns=matrixVarianceColumns;
module.exports=gpuFunctions;