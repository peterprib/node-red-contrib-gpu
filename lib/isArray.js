function isArray(a) {
	if(a instanceof Array
		|| a instanceof Float32Array
		|| a instanceof Float32Array
		|| a instanceof Int16Array
		|| a instanceof Int8Array
		|| a instanceof Uint16Array
		|| a instanceof Uint8Array) return true;
	if(typeof a == "object") {
		for(const p in a) 
			if(typeof p !== "number") throw Error("property "+p+" is not a number therefore not array");
		return true;
	}
	return false;
}
module.exports=isArray;