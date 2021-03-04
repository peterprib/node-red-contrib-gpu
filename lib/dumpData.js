const isArray=require('./isArray');
function dumpData(v) {
	if(isArray(v)) {
		const l=Math.min(v.length,4);
		let r=[];
		for(let i=0;i<l;i++) r.push(dumpData(v[i]));
		if(v.length>l) r.push("too large, first 4 of "+v.length) ;
		return "["+r.join()+"]";
	} else return JSON.stringify(v);
}
module.exports=dumpData;