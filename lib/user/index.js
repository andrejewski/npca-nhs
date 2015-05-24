
var express = require('express');
var async = require('async');

var config = require('../config');
var User = require('../user/model');
var Commit = require('../commit/model');

var router = module.exports = express.Router();

router.route('/:id')
	.get(function(req, res, next) {
		var userId = req.params.id;
		if(!isFormString(userId)) return next('route');
		User.findById(userId, function(error, user) {
			if(error) return next(error);
			if(!user) next();
			res.locals.user = user;
			res.locals.user.canEdit = res.locals.authed && (req.user._id.toString() === user._id.toString() || req.user.role >= 3);
			Commit
				.find({user: user._id})
				.populate('time')
				.sort('field -createdAt')
				.lean()
				.exec(function(error, commits) {
					if(error) return next(error);
					res.locals.user.commits = commits;
					res.locals.user.volunteerHours = commits.reduce(function(s, commit) {
						return s + (commit.hours || 0);
					}, 0);
					res.render('user/show');
				});	
		});
	});

var editables = []
	.concat(editProp('password', 0)) // user-only
	.concat(
		editProp('email', 1), 
		editProp('desc', 1), 
		editProp('picture', 1),
		editProp('college', 1)) // user or above
	.concat(
		editProp('name', 3),
		editProp('title', 3),
		editProp('classOf', 3, 'number'),
		editProp('committee', 3),
		editProp('bad', 3, 'boolean'),
		editProp('hours', 3, 'number')) // officer or above
	.concat(editProp('role', 3 /*4*/, 'number')) // administrator or above

function editProp(key, access, type) {
	return {
		property: key,
		access: access,
		type: type || 'string'
	};
}

router.route('/:id/edit')
	.all(getCommitteeList, function(req, res, next) {
		var userId = req.params.id;
		if(typeof userId !== 'string') return next();
		User.findById(userId, function(error, user) {
			if(error) return next(error);
			if(!user) next();
			res.locals.user = user;
			var isSelf = res.locals.isSelf = res.locals.authed && user._id.toString() === res.locals.pov._id.toString(),
				allowed = res.locals.editPermission = isSelf || req.user.role > 1;
			if(!allowed) return res.forbidden()
			res.locals.user.canEditProp = function(property) {
				var access = editables.filter(function(prop) {
					return prop.property === property;
				}).pop().access;
				return access === 0 ? isSelf : access <= req.user.role;
			}
			next();
		});
	})
	.get(function(req, res, next) {
		res.render('user/edit');
	})
	.post(function(req, res, next) {
		switch(req.body.form) {
			case 'information': return updateInformation(req, res, next);
			case 'password': return changePassword(req, res, next);
			default: next();
		}
	});

function updateInformation(req, res, next) {
	var userId = req.params.id,
		update = {},
		isSelf = res.locals.isSelf;
	
	editables.forEach(function(edit) {
		if(edit.acesss === 0 && !isSelf) return;
		if(edit.access > req.user.role) return;
		var value = req.body[edit.property];
		if(edit.type === 'number') {
			value = parseInt(value, 10);
			if(isNaN(value)) return;
		}
		if(edit.type === 'boolean') value = value === 'yes';
		if(typeof value !== edit.type) return;
		update[edit.property] = value;
	});

	var userDoc = res.locals.user;
	userDoc.set(update).save(function(error) {
		if(error) return next(error);
		res.locals.editSuccessful = true;
		res.render('user/edit');
	});
}

function changePassword(req, res, next) {
	if(!res.locals.user.canEditProp('password')) return next()
	var current = req.body.current,
		desired = req.body.desired;
	if(!isFormString(current)) return changeError("Your current password was not provided.");
	if(!isFormString(desired)) return changeError("Your desired password was not provided.");
	var userDoc = res.locals.user;
	userDoc.comparePassword(current, function(error, matches) {
		if(error) return next(error);
		if(!matches) return changeError("Your current password is not correct.");
		userDoc.set('password', desired);
		userDoc.save(function(error, user) {
			if(error) return next(error);
			res.locals.changePasswordSuccess = true;
			res.render('user/edit');
		});
	});

	function changeError(message) {
		res.locals.changePasswordError = message;
		res.render('user/edit');
	}
}

function getCommitteeList(req, res, next) {
	res.locals.committeeList = User.getCommitteeNames();
	next();
}

function isFormString(str) {
	if(typeof str !== 'string') return false;
	return str.length && true;
}

router.route('/:id/delete')
	.all(function(req, res, next) {
		if(!req.user || req.user.role < 3) return res.forbidden();
		next();
	})
	.get(function(req, res, next) {
		User.findById(req.params.id, function(error, user) {
			if(error) return next(error);
			res.locals.user = user;
			res.render('user/delete');
		});
	})
	.post(function(req, res, next) {
		if(req.body.action !== 'delete') return next('Bad form data');
		var userId = req.params.id;
		User.findByIdAndRemove(userId, function(error) {
			if(error) return next(error);
			Commit.remove({user: userId}, function(error) {
				if(error) return next(error);
				res.redirect('/');
			});
		});
	});


/*
	Invalidated on restart.
	Assuming this application gets restarted
	at least once every year.
*/
var yearsRangeCache = null,
	rankRange = [
		rr('all', 'All Members'),
		rr('members', 'Just Members'),
		rr('commitee-leaders', 'Commitee Leaders'),
		rr('officers', 'NHS Officers')
	];

function rr(uric, name) {
	return [uric, name];
}

router.route('/')
	.all(function(req, res, next) {
		var thisYear = config.currentYear();
		res.redirect('class-of/'+thisYear+'/all');
	});

router.route('/class-of/:year').all(function(req, res, next) {
	var year = parseInt(req.params.year, 10);
	if(isNaN(year)) return next();
	res.redirect('/members/class-of/'+year+'/all');
});

router.route('/class-of/:year/:predicate')
	.get(function(req, res, next) {
		var year = parseInt(req.params.year, 10),
			currentYear = config.currentYear(),
			predicate = resolvePredicate(req.params.predicate);
		if(isNaN(year)) return next();
		async.parallel({
			users: users,
			yearSpan: yearsRange
		}, function(error, results) {
			if(error) return next(error);
			res.locals.users = results.users;
			res.locals.yearSpan = results.yearSpan;
			res.locals.seniorClass = year === currentYear;
			res.locals.rankSpan = rankRange;
			res.locals.year = year;
			res.locals.predicate = predicate;
			res.render('user/class_of');
		});

		function users(done) {
			var query = User.find({classOf: year})
				.select('name title desc com college')
				.where('role').lt(4)
				.sort('field name')
				.lean();
			if(predicate !== 0) query = query.where('role', predicate);
			query.exec(function(error, users) {
				if(error) return done(error);
				done(error, users.map(User.addCommitteeVirtuals));
			});
		}

		function yearsRange(done) {
			if(yearsRangeCache) return done(null, yearsRangeCache);
			async.parallel({
				min: function(next) {
					User.findOne()
						.select('classOf')
						.where('role').lt(4)
						.sort('field classOf')
						.lean()
						.exec(function(error, users) {
							if(error) return next(error);
							next(error, users);
						});
				},
				max: function(next) {
					User.findOne()
						.select('classOf')
						.where('role').lt(4)
						.sort('field -classOf')
						.lean()
						.exec(function(error, users) {
							if(error) return next(error);
							next(error, users);
						});
				}
			}, function(error, results) {
				if(error) return done(error);
				var yo = {classOf: currentYear},
					first = (results.min || yo).classOf,
					last = (results.max || yo).classOf;
				var span = range(first, last);
				done(error, yearsRangeCache = span);
			});

			function range(start, stop) {
				var arr = [];
				while(start <= stop) {
					arr.push(start);
					start++;
				}
				return arr;
			}
		}

		function resolvePredicate(predicate) {
			switch(predicate) {
				case 'officers': return 3;
				case 'commitee-leaders': return 2;
				case 'members': return 1;
				default: return 0; // "all"
			}
		}
			
	});

