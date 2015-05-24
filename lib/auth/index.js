
var express = require('express'),
	passport = require('./passport'),
	User = require('../user/model'),
	Fake = require('./fake');
	
var router = module.exports = express.Router();

router.get('/authenticated', function(req, res, next) {
	res.done({authenticated: req.user.authed});
});

router.route('/login')
	.all(function(req, res, next) {
		if(res.locals.authed) {
			var user = req.user;
			return res.redirect('/members/'+user._id);
		}
		next();
	}, addFakeUser)
	.get(function(req, res, next) {
		res.render('auth/login');
	})
	.post(function(req, res, next) {
		if(!isNonEmptyString(req.body.email)) {
			return loginError("An email address was not provided.");
		}
		if(!isNonEmptyString(req.body.password)) {
			return loginError("A password was not provided.");
		}
		req.body.email = req.body.email.trim();
		passport.authenticate('local', function done(error, user, message) {
			if(error) return next(error);
			if(!user) return loginError(message);
			req.login(user, function(error) {
				if(error) return next(error);
				res.redirect('/members/'+user._id);
			});
		})(req, res, next);

		function loginError(message) {
			res.locals.loginEmail = req.body.email;
			res.locals.loginErrorMessage = message;
			return res.render('auth/login');
		}
	});

function addFakeUser(req, res, next) {
	res.locals.fake = Fake.user();
	next();
}

function isNonEmptyString(str) {
	if(typeof str !== 'string') return false;
	return str.length && true;
}

router.route('/logout')
	.all(function(req, res, next) {
		req.logout();
		res.redirect('/');
	});

router.route('/password_reset')
	.all(addFakeUser)
	.get(function(req, res, next) {
		res.render('auth/password_reset');
	})
	.post(function(req, res, next) {
		var email = req.body.email;
		if(!isEmailString(email)) return resetError("A valid email address was not provided.");
		User.findOne({email: email.trim()}).exec(function(error, user) {
			if(error) return next(error);
			if(!user) return resetError('"'+email+'" is not a registed email address.');
			user.resetPassword(function(error) {
				if(error) return next(error);
				res.locals.passwordResetSuccessful = true;
				res.render('auth/password_reset');
			});
		});

		function resetError(message) {
			res.locals.passwordResetError = message;
			res.render('auth/password_reset');
		}
	});

function isEmailString(str) {
	return typeof str === 'string' && /@/.test(str);
}

router.route('/password_reset_confirm')
	.all(function(req, res, next) {
		var email = req.query.email,
			key = req.query.key;
		if(typeof email !== 'string') return resetError("An email address could not be resolved.");
		if(typeof key !== 'string') return resetError("An encrypted reset command could not be resolved.");
		User.findOne({email: email}, function(error, user) {
			if(error) return next(error);
			if(!user) return resetError('"'+email+'" is not a registed email address.');
			user.compareReset(key, function(error, matches) {
				if(error) return next(error);
				if(!matches) return resetError("The encrypted reset key is malformed or expired.");
				res.locals.user = user;
				res.locals.passwordResetConfirmSuccessful = true;
				next();
			});
		});

		function resetError(message) {
			res.locals.passwordResetConfirmErrorMessage = message;
			res.render('auth/password_reset_confirm');
		}
	})
	.get(function(req, res, next) {
		res.render('auth/password_reset_confirm');
	})
	.post(function(req, res, next) {
		var newPassword = req.body.password,
			user = res.locals.user;
		if(typeof newPassword !== 'string') return resetError('A new password was not provided.');
		user.password = newPassword;
		user.reset = null;
		user.save(function(error, savedUser) {
			if(error) return next(error);
			res.locals.passwordResetCompleteSuccessful = true;
			res.render('auth/password_reset_confirm');
		});

		function resetError(message) {
			res.locals.passwordResetConfirmErrorMessage = message;
			res.render('auth/password_reset_confirm');
		}
	});

router.route('/password_reset_cancel')
	.get(function(req, res, next) {
		var email = req.query.email;
		if(typeof email !== 'string') return resetError("An email address could not be resolved.");
		User.findOne({email: email}, function(error, user) {
			if(error) return next(error);
			if(!user) return resetError('"'+email+'" is not a registed email address.');
			user.reset = null;
			user.save(function(error, savedUser) {
				if(error) return next(error);
				res.locals.user = user;
				res.locals.passwordResetCancelSuccessful = true;
				res.render('auth/password_reset_cancel');
			});
		});
	});
