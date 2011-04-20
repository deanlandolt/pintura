var CSRFDetect = require("../../lib/jsgi/csrf").CSRFDetect;
var assert = require("assert");
var print = require("promised-io/lib/process").print;
	

exports.testCSRF = function(){
	CSRFDetect(function(request){
		assert.equal(request.crossSiteForgeable, true);
	})({method:"POST", headers:{}});
};

if (require.main === module) require("patr/lib/test").run(exports);