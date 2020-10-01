function arrayCleanse(a) {
	if(!a) return a;
	if(a instanceof Array) 	return a.map(c=>arrayCleanse(c));
	if(typeof a =="object") {
		const r=[]; 
		for (const p in a) r[p]=arrayCleanse(a[p]);
		return r;
	}
	return a;
}

module.exports=arrayCleanse;