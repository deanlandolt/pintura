/**
* Media handler for generating HTML from tempaltes
*/

var Media = require("../media").Media;
var filesystem = require("perstore/lib/store/filesystem").FileSystem({dataFolder: "../templates", defaultExtension: "template"});
var transform = require("../html-transform");
var Response=require("../jsgi/response").Response;
var toJSON = require("commonjs-utils/lib/json-ext").stringify;
var when = require("promised-io/lib/promise").when;
var copy = require("commonjs-utils/lib/copy").copy;
var resolver = require("templify").Resolver;
var templateEngine = require('templify').TemplateEngine({resolver: resolver, store: filesystem});

var defaultHandler = {
	mediaType:"text/html",
	defaultQuality: .1,
	getQuality: function(object){
	
			var contentType = object.getMetadata? object.getMetadata()['content-type'] : object['content-type'];

		if (contentType) {

			// we have an available transformer
			if (transform && transform[contentType]) { 
				return 1;
			}else{
				return this.defaultQuality
			}
		}

		//we want to be the default handler if there isn't a specific handler for a request already
		return this.defaultQuality
	},
	serialize: function(object, mediaParams, request, response){
		var template,content;
		
		var meta = object.getMetadata ? object.getMetadata() : {};
		
		var templateId = mediaParams.template || request['scriptName'] + request['pathInfo'];
		templateId = mediaParams.templateType ? templateId + "-" + mediaParams['templateType'] : templateId;


		if (this.createContext){
			object = this.createContext(object, mediaParams, request, response);
		}
		if (!object && !response.status){
			response.status = 404;
		}else if ((!response.status || (response.status < 400)) && transform && meta['content-type']){
			object = transform[meta['content-type']](object);
		}

		//delete any existing content-length headers as the size has changed post conversion/templating
		delete response.headers['content-length'];

		if (response.status > 400) {
			template = templateEngine.compile("/error/"+response.status);	
		}else{
			template = templateEngine.compile(templateId, (mediaParams && mediaParams.template));
		}

		return {
			forEach: function(write){
				return when(template, function(template){
					template(object).forEach(write);
				});
			}
		}
	},

	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
};

exports.setupMediaHandler = function(handler){
	var h = {};
	copy(defaultHandler, h);	
	if(handler){
		copy(handler, h);
	}
	Media(h);
};

exports.setupMediaHandler();

