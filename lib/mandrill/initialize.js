
var fs = require('fs');
var path = require('path');
var async = require('async');
var Mandrill = require('mandrill-api/mandrill').Mandrill;

var config = require('../config');
var Template = require('./template');

module.exports = function initialize(next) {
	var apiKey = config.mandrill.apiKey;
	if(!apiKey) {
		return next(new Error("config: mandrill.apiKey is required."));
	}

	var client = new Mandrill(apiKey);

	function getUnsyncedTemplates(next) {
		async.parallel({
			local: function(next) {
				fs.readdir(Template.dir, function(error, filenames) {
					if(error) return next(error);
					var names = filenames.map(function(filename) {
						return path.basename(filename, path.extname(filename));
					});
					next(null, names);
				});
			},
			remote: function(next) {
				client.templates.list({}, function success(templates) {
					var names = templates.map(function(template) {
						return template.slug;
					});
					next(null, names);
				}, function failure(error) {
					next(error);
				});
			}
		}, function(error, results) {
			if(error) return next(error);
			var templates = results.local.filter(function(t) {
				return results.remote.indexOf(t) === -1;
			});
			next(null, templates);
		});
	}

	function uploadTemplates(names, next) {
		async.each(names, function upload(name, next) {
			Template.getData(name, function(error, data) {
				if(error) return next(error);

				client.templates.add(data, function success() {
					next(null);
				}, function failure(error) {
					next(error);
				});
			});

		}, next);
	}

	getUnsyncedTemplates(function(error, templates) {
		if(error) return next(error);
		uploadTemplates(templates, next);
	});
}
