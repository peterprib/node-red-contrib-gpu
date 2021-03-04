function columns(logger,gpu,a,columns,pipeline=false,blocks=1,showDetails,column2DFunction,columns3DFunction,firstFunction) {
	const details=this.getDetailsColumns(a,columns),columnCount=details.columns.length;
	const pipedData=this.loadColumns(a,details,true,blocks); // piped as comused twice
	const firstFunctionResultsResults=firstFunction(pipedData,"pipe",false);  // doesn't work if pipeline is returned
	
	const options={pipeline:pipeline,output:{x:columnCount},constants:{size:details.dimensions.y/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=columnCount;
		kernel=this.gpu.createKernel(column2DFunction,options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(column3DFunction,options);
	}
	if(logger.active) logger.send({label:"blockFrameworkColumns",blocks:blocks,options:options,details:details});
	const results=kernel(pipedData,firstFunctionResultsResults);
	return showDetails?{results:results,data:firstFunctionResultsResults}:results;
}
function rows(logger,gpu,a,rows,pipeline=false,blocks=1,showDetails,rows2DFunction,rows3DFunction,firstFunction){
	const details=this.getDetailsRows(a,rows),rowCount=details.rows.length;
	const pipedData=this.loadRows(a,details,true,blocks);
	const norms=firstFunction(pipedData,"pipe",false);  // doesn't work if pipeline is returned
	const options={pipeline:pipeline,output:{x:rowCount},constants:{size:details.dimensions.x/blocks}}
	let kernel;
	if(blocks==1) {
		options.output.y=rowCount;
		kernel=gpu.createKernel(rows2DFunction,options);
	} else {
		options.output.y=blocks;
		options.output.z=blocks;
		kernel=gpu.createKernel(rows3DFunction,options);
	}
	if(logger.active) logger.send({label:"blockFrameworRows",blocks:blocks,options:options,details:details});
	const results=kernel(pipedData,firstFunctionResultsResults);
	return showDetails?{results:results,norms:firstFunctionResultsResults}:results;
}
module.exports={
	columns:columns,
	rows:rows
};