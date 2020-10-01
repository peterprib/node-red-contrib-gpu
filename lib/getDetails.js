function getDetailsColumns(a,columnsIn,blocks){
	if(columnsIn=="pipe") {
		if(typeof a !=="object") throw ("array not a pipe as not an object but "+(typeof a))
		if(!("output" in a)) throw ("array not a pipe, has properties "+Object.keys(a));
		const columns=[],cl=a.output[0];
		for(let i=0;i<cl;++i) columns.push(i);
		return {dimensions:{x:a.output[0],y:a.output[1],z:a.output[2]==1?null:a.output[2]},columns:columns,isPipe:true}
	}
	if(!Array.isArray(columnsIn||[])) return columnsIn;
//	if(!Array.isArray(columnsIn||[])) throw Error("columns are not array of columns or string pipe, found "+columnsIn);
	const dimensions=this.arrayDimensions(a,blocks);
	if(dimensions.x<1) throw Error("array has length zero");
	const columns=columnsIn||[];
	if(columns.length==0)
		for(let i=0;i<dimensions.x;++i) columns.push(i);
	else for(let i in columns) if(i>=dimensions.x) throw(i+" greater than last column offset "+dimensions.x-1)
	return {dimensions:dimensions,columns:columns}
}
function getDetailsRows(a,rowsIn,blocks){
	if(rowsIn=="pipe") {
		if(typeof a !=="object") throw ("array not a pipe as not an object but "+(typeof a))
		if(!("output" in a)) throw ("array not a pipe, has properties "+Object.keys(a));
		const rows=[],rl=a.output[1];
		for(let i=0;i<rl;++i) rows.push(i);
		return details={dimensions:{x:a.output[0],y:a.output[1],z:a.output[2]==1?null:a.output[2]},rows:rows,isPipe:true};
	}
	if(!Array.isArray(rowsIn||[])) return rowsIn;
//	if(!Array.isArray(rowsIn||[])) throw Error("columns are not array of rows or string pipe, found "+rowsIn);
	const dimensions=this.arrayDimensions(a,null,blocks);
	if(dimensions.y<1) throw Error("array has length zero");
	const rows=rowsIn||[];
	if(rows.length==0)
		for(let i=0;i<dimensions.y;++i) rows.push(i);
	else for(let i in rows) if(i>=dimensions.y) throw(i+" greater than last row offset "+dimensions.y-1)
	return {dimensions:dimensions,rows:rows}
}
module.exports={
		columns:getDetailsColumns,
		rows:getDetailsRows
}
