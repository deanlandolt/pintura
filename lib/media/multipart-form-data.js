/**
 * Registers multi-part media type handling
 */
var stringToValue = require("./auto-type").stringToValue;
var mediaModule = require("../media");
var Media = require("../media").Media;
var fs = require("promised-io/lib/fs");
var when = require("promised-io/lib/promise").when;
var all = require("promised-io/lib/promise").all;
var defer = require("promised-io/lib/promise").defer;
	
var parseMultipart = typeof process == "undefined" ?
	// jack form parser
	// FIXME fix this
	require("commonjs-utils/lib/jsgi/utils").parseMultipart :
	// node form parser
	(function(IncomingForm, Node){
		return function(request){ 
			var form = new IncomingForm();
			var deferred = defer();
			Node(function(request){
		    	form.parse(request, function(err, fields, files) {
		    		var incomingObject = {};
		    		if(err){
		    			return deferred.reject(err);
		    		}
		    		for(var i in files){
		    			fields[i] = files[i];
		    		}
		    		deferred.resolve(fields);
		    	});
			})(request);
			return deferred.promise;
		};
	})(
	require("formidable").IncomingForm, 
	require("jsgi-server/lib/jsgi/node").Node);
	

Media({
	mediaType:"multipart/form-data",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, parameters, request){
		var boundary = Math.random().toString().substring(2);
		return {
			forEach:function(write){
				for(var i in object){
					if(object.hasOwnProperty(i)){
						write("--" + boundary + '\n');
						write("Content-Disposition: form-data; name=" + i + "\n\n" + object[i] + '\n');
					}
				}
				write("--" + boundary + '--\n\n');
			},
			"content-type": "multipart/form-data; boundary=" + boundary
		}
	},
	deserialize: function(inputStream, parameters, request){
    	return when(parseMultipart(request), function(form){
    		var files = [];
    		var fileKeys = [];
			for(var i in form){
				var value = form[i];
				if(value && typeof value === "object"){
					files.push(mediaModule.saveFile(value));
					fileKeys.push(i);
				}
				else{
					form[i] = stringToValue(value);
				}
			}
			return when(all(files), function(files){
				for(var i = 0; i < files.length; i++){
					form[fileKeys[i]] = files[i];
				}
				return form;
			});
		});
	}
});
