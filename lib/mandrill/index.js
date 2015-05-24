
var fs = require('fs');
var path = require('path');
var async = require('async');
var Mandrill = require('mandrill-api/mandrill').Mandrill;

var config = require('../config');
var Template = require('./template');

module.exports.send = function(name, users, items, next) {
	if(next === void 0) {
		next = items;
		items = null;
	}
	if(!Array.isArray(users)) users = [users];
	if(!items) items = users.map(function(user) {
		return user.item;
	});

	Template.getMessage(name, users, items, function(error, message) {
		if(error) return next(error);
		var client = new Mandrill(config.mandrill.apiKey);

		client.messages.sendTemplate(message, function success(response) {
			next(null, response);
		}, function failure(error) {
			next(error);
		});
	});
}
