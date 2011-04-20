// helpful for debugging
var settings = require("commonjs-utils/lib/settings");
var ws = require("websocket-server");
var messageJson = require("./media/message/json");
var multiNode = require("multi-node");

exports.start = function(jsgiApp, socketApp){
	var http = require("http").createServer(
			require("jsgi-server").Listener(jsgiApp)
		);
	var port = settings.port || 8080;
	var nodes = multiNode.listen({port: port, nodes: settings.processes || 1}, http);
	require("jsgi-server/lib/ws-jsgi")(ws.createServer({
		server: http
	}), function(request){
		request.method = "POST";
		var headers = request.headers;
		headers.accept = "message/json";
		headers["content-type"] = "message/json";
		headers.stream = true;
		return jsgiApp(request);
	});
	
	nodes.addListener("node", function(stream){
		require("./pintura").app.addConnection(multiNode.frameStream(stream, true));
	});
	console.log("Listening on port " + port);
	// having a REPL is really helpful
	if(nodes.isMaster){
		require("./util/repl").start();
	}
};