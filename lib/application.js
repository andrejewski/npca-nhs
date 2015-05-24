
var path = require('path');
var humanize = require('./shared/humanize');
var config = require('./config');

module.exports = function(app) {

	app.use(function(req, res, next) {
		res.locals.g = config.website;
		res.locals.authed = req.user && true;
		req.user = req.user || {_id: false, role: 0};
		res.locals.pov = req.user;
		humanize.extendMethodsTo(res.locals);

		res.done = function(error, data) { res.json({error: error, data: data}); }
		res.forbidden = function(message) {
			res.locals.forbiddenMsg = message;
			res.status(403).render('http/forbidden');
		}
		res.notFound = function() {
			res.status(404).render('http/not-found');
		}
		res.internalError = function() {
			res.status(500).render('http/internal-error');
		}
		next();
	});

	app.all('/admin/*', function(req, res, next) {
		if(req.user.isPro) return next();
		res.forbidden();
	});

	function mount(route, controller) {
		app.use(route, require('./'+controller));
	}

	mount('/account', 'auth/index');
	mount('/members', 'user/index');
	mount('/news', 'news/index');
	mount('/events', 'event/index');
	mount('/events/times', 'time/index');

	mount('/admin', 'admin/index');
	mount('/admin/members', 'user/admin');
	mount('/admin/news', 'news/admin');

	app.use(function(error, req, res, next) {
		console.log('error', error);
		if(!error) return next();
		res.internalError(error);
	});

	app.use(function(req, res, next) {
		res.notFound();
	});

}
