require("commonjs-utils/lib/settings").admins = ["user"];// must do this first
var MockRequest = require("commonjs-utils/lib/jsgi/mock").MockRequest; 
var mock = new MockRequest(require("../lib/pintura").app);
var assert = require("assert");
var TestStore = require("perstore/lib/stores").DefaultStore();
var parse = require("commonjs-utils/lib/json-ext").parse;
TestStore.setPath("TestStore");
require("../lib/pintura").config.getDataModel = function(){
	return {
		TestStore: TestStore
	};
};
exports.testGet = function(){
	var body = mock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(parse(body).length, 3);
};

if (require.main === module) require("patr/lib/test").run(exports);

