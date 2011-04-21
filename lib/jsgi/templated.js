/**
 * Wraps text/html output by a specified template
 */
exports.templatesDir = 'views'; 

exports.renderPartial = function(template, object){
	var include = function(template, fallback){
		if (!template) template = '';
		while (true) try {
			return require('promised-io/lib/fs').read(exports.templatesDir + '/' + template, 'utf8');
		} catch (x) {
			if (!fallback || template === fallback)
				return null;
			template = fallback;
		}
	};
	//template: request.nodeRequest.url.replace /\?.*$/, ''
	// FIXME should ejs be a required dep?
	var engine = require('ejs/ejs');
	var str = include(template, template.substring(template.lastIndexOf('.')));
	var html = engine.render(str, {
		context: engine, // N.B. this will be 'this' in templates
		locals: object, // variables available to the templates
		cache: false, // TODO: optify
		filename: template
	});
	return [html];
};

exports.render = function(template, object){
	var html = exports.renderPartial(template, object);
	return {status: 200, headers: {'content-type': 'text/html'}, body: html};
};

exports.Templated = function(options, nextApp){
	var when = require('promised-io/lib/promise').when;
	var media = require('../media');
	if (!options) options = {};
	if (options.templatesDir)
		exports.templatesDir = options.templatesDir;
	return function(request){
		return when(nextApp(request), function(response){
			var html = response.headers['content-type']; html = html && html.indexOf('text/html') === 0;
			// AJAX call or not text/html -> return pure content
			if (!html || request.xhr)
				return response;
			// vanilla HTML -> wrap it in template
			var vars = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			vars.content = (response.body.forEach) ? media.forEachableToString(response.body) : response.body;
			return exports.render(options.template || 'index.html', vars);
			var b = exports.renderPartial(options.template || 'index.html', vars);
			response.body = b;
			return response;
		});
	};
};
