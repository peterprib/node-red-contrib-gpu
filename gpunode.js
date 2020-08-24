const logger = new (require("node-red-contrib-logger"))("gpunode");
logger.sendInfo("Copyright 2020 Jaroslav Peter Prib");

const GPU=require("./gpu");

function evalFunction(id,mapping){
	try{
		return eval("(RED,node,msg,data)=>"+mapping);
	} catch(ex) {
		throw Error(id+" "+ex.message);
	}
}
module.exports = function (RED) {
	function gpuNode(config) {
		RED.nodes.createNode(this, config);
		const node=Object.assign(this,config);
		try{
			node.getData1=evalFunction("source1",node.source1Property||"msg.payload");
			node.getData2=evalFunction("source2",node.source2Property||"msg.payload");
			node.deleteSource1Property=evalFunction("source1 delete","{delete "+(node.source1Property||"msg.payload")+";}");
			node.deleteSource2Property=evalFunction("source2 delete","{delete "+(node.source2Property||"msg.payload")+";}");
			node.setData=evalFunction("target","{"+
				(node.targetProperty||"msg.payload")+"=data;"+
				(node.sendInFunction ? "" : "node.send(msg);")+
				"}");
			node.columns=evalFunction("columns",node.columnsProperty||"undefined");
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
					node.setData(RED,node,msg,node.gpuFunction(node.getData1(RED,node,msg),node.getData2(RED,node,msg)));
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
