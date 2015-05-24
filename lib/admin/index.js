
var fs = require('fs'),
	express = require('express'),
	config = require('../config');

var router = module.exports = express.Router();

router.get('/', function(req, res, next) {
	res.render('admin/index');
});

router.route('/settings')
	.get(function(req, res, next) {
		res.locals.config = config;
		res.render('admin/settings');
	})
	.post(function(req, res, next) {
		var form = req.body.form;
		if(form === 'restart') return setTimeout(function() {
			process.exit(0); // depends on forever to reboot
		}, 1000); // finish up IO
		next();
	});
