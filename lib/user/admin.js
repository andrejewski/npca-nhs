
var express = require('express'),
	async = require('async'),
	User = require('../user/model'),
	Commit = require('../commit/model');

var router = module.exports = express.Router();

router.route('/create')
	.all(getCommitteeList, adminOnly)
	.get(function(req, res, next) {
		res.render('user/create');
	})
	.post(function(req, res, next) {
		var users = req.body.users;
		if(!Array.isArray(users)) return createError("A list of users was not provided");
		var userDocs = [];
		users.forEach(function(user) {
			if(!isFormString(user.name)) return;
			if(!isFormString(user.email)) return;
			user.classOf = parseInt(user.classOf, 10);
			user.role = parseInt(user.role, 10);
			userDocs.push({
				name: user.name,
				email: user.email,
				com: User.getComFromCommittee(user.committee),
				classOf: !isNaN(user.classOf) ? user.classOf : (new Date()).getFullYear(),
				role: !isNaN(user.role) ? user.role : 1,
				title: user.title
			});
		});
		User.create.apply(User, userDocs.concat(function(error) {
			var users = Array.prototype.slice.call(arguments, 1);
			if(error) return next(error);
			res.locals.users = users;
			res.render('user/created');
		}));

		function createError(msg) {
			res.locals.createError = msg;
			res.render('user/create');
		}
	});

router.route('/service-sheet/:year')
	.all(adminOnly)
	.get(function(req, res, next) {
		var year = parseInt(req.params.year, 10);
		if(isNaN(year)) return next(new Error('Invalid year: '+year));
		res.locals.year = year;
		res.locals.range = function(a,b) {
			var list = [];
			for(var i = 0; i <= (b - a); i++) {
				list.push(a + i);
			}
			return list;
		}

		async.parallel({
			users: getUsers,
			hours: getHoursPerUser
		}, function(error, results) {
			if(error) return next(error);
			var users = results.users;
			var hours = results.hours;
			users.forEach(function(user) {
				user.hours = hours.reduce(function(total, commit) {
					if(user._id.equals(commit.user)) {
						total += commit.hours;
					}
					return total;
				}, (user.hours || 0));
			});
			res.locals.users = users;
			res.render('user/service-sheet');
		});


		function getUsers(next) {
			User.find({classOf: year})
				.select('name hours')
				.lean()
				.sort('field name')
				.exec(next);	
		}

		function getHoursPerUser(next) {
			Commit
				.find({attended: true})
				.select('user hours')
				.lean()
				.exec(next);
		}
	});


function adminOnly(req, res, next) {
	if(req.user.isAdmin) return next();
	res.forbidden();
}

function getCommitteeList(req, res, next) {
	res.locals.committeeList = User.getCommitteeNames();
	next();
}

function isFormString(str) {
	if(typeof str !== 'string') return false;
	return str.length && true;
}
