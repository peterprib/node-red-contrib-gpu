const logger = new (require("node-red-contrib-logger"))("gpunode");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const GPU=require("./gpu");
const gpu=new GPU();
const isArray=require("./lib/isArray");
const dumpData=require("./lib/dumpData");

function error(node,message,shortMessage) {
	if(logger.active) logger.error({message:message,shortMessage:shortMessage});
	node.error(message);
	node.status({fill:"red",shape:"ring",text:shortMessage||message});
	node.on("input", function(msg) {
		msg.error=message;
		node.send([null,msg]); // error port
	});
}
function evalFunction(id,statements){
	try{
		const f=new Function("RED", "node","msg","data","try{ "+statements+ "} catch(ex) {throw Error('"+id +" '+ex.message)}");
		if(logger.active) logger.send({label:"evalFunction",id:id,statements:statements,callableFunction:JSON.stringify(f)});
		return f;
	} catch(ex) {
		throw Error(id+" "+ex.message);
	}
}
module.exports = function (RED) {
	function gpuNode(config) {
		RED.nodes.createNode(this, config);
		const node=Object.assign(this,config);
		try{
			node.getData1=evalFunction("Argument 1","return "+(node.source1Property||"msg.payload"));
			if(node.hasSecondArgument) node.getData2=evalFunction("Argument 2","return "+(node.source2Property||"msg.payload"));
//			node.deleteSource1Property=evalFunction("source1 delete","{delete "+(node.source1Property||"msg.payload")+";}");
//			node.deleteSource2Property=evalFunction("source2 delete","{delete "+(node.source2Property||"msg.payload")+";}");
			node.setData=evalFunction("target","{"+
				(node.targetProperty||"msg.payload")+"=data;"+
				(node.sendInFunction ? "" : "node.send(msg);")+
				"}");
			node.getColumns=evalFunction("columns","return "+node.columnsProperty||"undefined");
			node.getBlocks=evalFunction("blocks","return "+(node.blocksProperty||1));
		} catch(ex) {
			error(node,"Invalid setup "+ex.message);
			return;
		}
	if(gpu.GPUSupported1==true) {	
		node.status({fill:"yellow",shape:"ring",text:"GPU not supported bypass"});
		node.on("input", function(msg) {
			node.send([null,null,msg]); // bypass port
		});
		return;
	}
	try {
			if(node.action in gpu)
				node.gpuFunction=gpu[node.action].bind(node.gpu);
			 else if(node.action=="freeform"){
				const Freeform=require('./lib/freeform');
				 node.freeform=new Freeform(gpu,node.pipeline,node.statements||{})
				node.gpuFunction=node.freeform.exec.bind(node.freeform);
			 } else {
				if(logger.active) logger.send("loading "+node.action);
				const action=require('./lib/'+node.action);
				node.gpuFunction=(a,columns,pipeline,blocks)=>action(logger,gpu.gpu,a,columns,pipeline,blocks);
//				throw Error("action "+node.action+" not found");
			}
			if(!node.gpuFunction) throw Error("routine not found");
		} catch (ex) {
			error(node,node.action+" "+ex.message);
			return;
		}
		if(node.action=="getHeatMap"){
			node.on("input", function(msg) {
				try{
					const data1=node.getData1(RED,node,msg);
					node.gpuFunction(data1,node.offset,node.factor,node.pipeline);
				} catch (ex) {
					msg.error=node.action+ " " +ex.message;
					error(node,msg.error,"Error(s)");
					node.send([null,msg]);
				}
			});
			return;
		}
		node.on("input", function(msg) {
			try{
				const data1=node.getData1(RED,node,msg);
				const blocks=node.getBlocks(RED,node,msg);
				if(!Number.isInteger(blocks)) throw Error("blocks '"+blocks +"' not an integer");
				if(data1==null) throw Error("source data not found");
				const columns=node.hasColumns?node.getColumns(RED,node,msg):null;
				if(logger.active) logger.send({label:"input",columns:columns,blocks:blocks,data:dumpData(data1)});
				const results=node.hasSecondArgument?
					node.gpuFunction(data1,node.getData2(RED,node,msg),columns,node.pipeline,blocks):
					node.gpuFunction(data1,columns,node.pipeline,blocks);
//					if(logger.active) logger.send({label:"input",results:dumpData(results)});
					node.setData(RED,node,msg,results);
			} catch (ex) {
				msg.error=node.action+ " " +ex.message;
				error(node,msg.error,"Error(s)");
				node.send([null,msg]);
				if(logger.active) logger.send({label:"error",stack:ex.stack})
			}
		});
		node.status({fill:"green",shape:"ring",text:"Ready"});
	}
	RED.nodes.registerType(logger.label,gpuNode);
};