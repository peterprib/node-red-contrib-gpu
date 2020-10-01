const checkObject=require("./checkObject");
const isArray=require("./isArray");

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

module.exports=arrayDimensions;