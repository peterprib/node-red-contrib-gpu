const logger = new (require("node-red-contrib-logger"))("gpunode");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const GPU=require("./gpu");
function evalFunction(id,statements){
	try{
		const f=new Function("RED", "node","msg","data",statements);
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
			node.getData1=evalFunction("source1","return "+(node.source1Property||"msg.payload"));
			node.getData2=evalFunction("source2","return "+(node.source2Property||"msg.payload"));
//			node.deleteSource1Property=evalFunction("source1 delete","{delete "+(node.source1Property||"msg.payload")+";}");
//			node.deleteSource2Property=evalFunction("source2 delete","{delete "+(node.source2Property||"msg.payload")+";}");
			node.setData=evalFunction("target","{"+
				(node.targetProperty||"msg.payload")+"=data;"+
				(node.sendInFunction ? "" : "node.send(msg);")+
				"}");
			node.getColumns=evalFunction("columns","return "+node.columnsProperty||"undefined");
			node.getBlocks=evalFunction("blocks","return "+node.blocksProperty||"throw Error('blocks not defined')");
		} catch(ex) {
			node.error(ex);
			node.status({fill:"red",shape:"ring",text:"Invalid setup "+ex.message});
			return;
		}
		node.gpu=new GPU();
		if(node.gpu.GPUSupported) {	
			try {
				node.gpuFunction=node.gpu[node.action].bind(node.gpu);
				if(!node.gpuFunction) throw Error("routine not found");
			} catch (e) {
				node.error(node.action+" "+e);
				this.status({fill:"red",shape:"ring",text:node.action});
				return;
			}
			node.on("input", function(msg) {
				try{
					const data1=node.getData1(RED,node,msg);
					const blocks=node.getBlocks(RED,node,msg);
					if(!Number.isInteger(blocks)) throw Error("blocks '"+blocks +"' not an integer");
					if(data1==null) throw Error("source data not found");
					const columns=node.hasColumns?node.getColumns(RED,node,msg):null;
					if(logger.active) logger.send({label:"input",columns:columns,blocks:blocks,data:data1});
					const results=node.hasSecondArgument?
						node.gpuFunction(data1,node.getData2(RED,node,msg),node.pipeline,blocks):
						node.gpuFunction(data1,columns,node.pipeline,blocks);
					node.setData(RED,node,msg,results);
				} catch (ex) {
					msg.error=node.action+ " " +ex.message;
					node.error(msg.error);
					this.status({fill:"red",shape:"ring",text:"Error(s)"});
					node.send([null,msg]);
				}
			node.status({fill:"green",shape:"ring",text:"Ready"});
			});
		} else {
			node.error("GPU not supported");
			node.status({fill:"red",shape:"ring",text:"GPU not supported"});
			node.on("input", function(msg) {
				node.send([null,null,msg]); // bypass port
			});
		}
	}
	RED.nodes.registerType(logger.label,gpuNode);
};
