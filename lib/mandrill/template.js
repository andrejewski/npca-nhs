
var fs = require('fs');
var path = require('path');
var async = require('async');

var config = require('../config');

var templateDir = path.join(__dirname, 'templates');
module.exports.dir = templateDir;

module.exports.getData = function(name, next) {
	var template = {
		from_email: config.mandrill.address,
		from_name: config.mandrill.sender,
		slug: name,
		publish: true
	};

	loadTemplate(name, function(error, data) {
		if(error) return next(error);
		next(error, extend(template, data));
	});

	function loadTemplate(name, next) {
		async.parallel([
			readFile(name, '.json'),
			readFile(name, '.html', 'code'),
			readFile(name, '.txt', 'text')
		], function(error, results) {
			if(error) return next(error);
			next(error, extend.apply(null, results));
		});
	}
}

module.exports.getMessage = function(name, users, items, next) {
	readFile(name, '.json')(function(error, data) {
		if(error) return next(error);

		var global_merge_vars = [],
			merge_vars = [];
		merge(global_merge_vars, data.conf_merge_tags, config);
		users.forEach(function(user, index) {
			var vars = [];
			merge(vars, data.user_merge_tags, user);
			merge(vars, data.item_merge_tags, items[index]);
			merge_vars.push({
				'rcpt': user.email,
				'vars': vars
			});
		});

		next(null, {
			template_name: name,
			template_content: [],
			message: {
				to: users.map(toField),
				global_merge_vars: global_merge_vars,
				merge_vars: merge_vars
			}
		});
	});

	function merge(vars, tagList, target) {
		tagList.forEach(function(node) {
			var prop = node,
				name = node;
			if(Array.isArray(node)) {
				prop = node[0];
				name = node[1];
			}
			vars.push({
				name: name,
				content: deepGet(target, prop)
			});
		});
	}

	function toField(user) {
		return {
			email: user.email,
			name: user.name,
			type: 'to'
		}
	}
}

function readFile(basename, ext, prop) {
	var filepath = path.join(templateDir, basename+ext);
	return function(next) {
		fs.readFile(filepath, function(error, data) {
			if(error) return next(error);
			if(ext === '.json') data = JSON.parse(data);
			if(prop) {
				var obj = {};
				obj[prop] = data.toString();
				return next(error, obj);
			}
			next(error, data);
		});
	}
}

function deepGet(obj, prop) {
	var levels = prop.split('.');
	for(var i = 0; i < levels.length; i++) {
		obj = obj[levels[i]];
	}
	return obj;
}

function extend(obj) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		if(!source) return;
		for(var prop in source) {
			obj[prop] = source[prop];
		}
	});
	return obj;
}
