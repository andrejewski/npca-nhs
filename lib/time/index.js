
var express = require('express'),
	async = require('async'),
	Time = require('../time/model'),
	Commit = require('../commit/model'),
	User = require('../user/model'),
	humanize = require('../shared/humanize'),
	isValidObjectId = require('mongoose').Types.ObjectId.isValid;

var router = module.exports = express.Router(); 

router.param('time_id', function(req, res, next, timeId) {
	if(!isValidObjectId(timeId)) return next('route');
	Time.findById(timeId, function(error, time) {
		if(error) return next(error);
		if(!time) return res.notFound();
		res.locals.time = time;
		res.locals.time.potentialHours = humanize.hourDiff(time.startDate, time.endDate);
		next();
	});
});

router.route('/:time_id')
	.all(getCommits, function(req, res, next) {
		var time = res.locals.time;
		if(time.published || req.user.isPro) return next();
		res.forbidden();
	})
	.get(function(req, res, next) {
		var time = res.locals.time;
		res.locals.time.joinable = Time.joinable(time);
		res.locals.time.attending = !!time.commits.filter(function(c) {
			return c.user._id.toString() === req.user._id.toString();
		}).length;
		res.render('time/show');
	});

router.route('/:time_id/edit')
	.all(authorize)
	.get(function(req, res, next) {
		res.render('time/edit');
	})
	.post(function(req, res, next) {
		var time = res.locals.time,
			published = "yes" === req.body.publish;
		extend(time, {
			title: req.body.title,
			published: published,
			startDate: new Date(req.body.start),
			endDate: new Date(req.body.end),
			capacity: req.body.capacity,
			volunteered: req.body.volunteered
		}).save(function(error, time) {
			if(time.published) return res.redirect('/events/times/'+time._id);
			res.locals.time = time;
			res.locals.editSuccessful = true;
			res.render('time/edit');
		});
	});

router.route('/:time_id/delete')
	.all(authorize, function(req, res, next) {
		if(!res.locals.time) return res.redirect('/events/');
		next();
	})
	.get(function(req, res, next) {
		res.render('time/delete');
	})
	.post(function(req, res, next) {
		if(req.body.action !== 'delete') return next();
		res.locals.time.remove(function(error, time) {
			if(error) return next(error);
			res.redirect('/events/');
		});
	});

router.get('/:time_id/attend', function(req, res, next) {
	if(!res.locals.authed) return res.forbidden();
	var time = res.locals.time;
	if(time.past) return next();
	Commit.count({time: time._id, user: req.user._id}, function(error, count) {
		if(error) return next(error);
		if(count !== 0) return res.redirect('/events/times/'+time._id);
		var obj = {
			user: req.user._id,
			time: time._id
		};
		Commit.create(obj, function(error, commit) {
			if(error) return next(error);
			res.redirect('/events/times/'+time._id);
		});
	});
});

router.get('/:time_id/disregard', function(req, res, next) {
	if(!res.locals.authed) return res.forbidden();
	var time = res.locals.time;
	if(time.past) return next();
	Commit.remove({user: req.user._id, time: time._id}, function(error) {
		if(error) return next(error);
		res.redirect('/events/times/'+time._id);
	});
});

router.route('/:time_id/record')
	.all(authorize, getCommits)
	.get(function(req, res, next) {
		res.render('time/record');
	})
	.post(function(req, res, next) {
		var commits = req.body.commits;
		if(!Array.isArray(commits)) return recordError("A list of commits was not provided.");
		var idCommits = commits.filter(function(commit) {
			return isFormString(commit.id);
		});

		async.map(idCommits, updateCommit, function(error, commits) {
			if(error) return next(error);
			res.locals.time.commits = commits;
			res.locals.recordSuccessful = true;
			res.render('time/record');
		});

		function updateCommit(commit, next) {
			var hours = parseInt(commit.hours, 10),
				update = {
					attended: commit.attended === "yes",
					detail: commit.detail
				};
			if(!isNaN(hours)) update.hours = hours;
			Commit.findByIdAndUpdate(commit.id, update, function(error, commit) {
				if(error) return next(error);
				var pop = {path: 'user', select: 'name'};
				commit.populate(pop, next);
			});
		}

		function recordError(msg) {
			res.locals.recordError = msg;
			res.render('time/record');
		}
	});

function getTime(req, res, next) {
	var timeId = req.params.id;
	if(!isFormString(timeId)) return next('route');
	Time.findById(timeId, function(error, time) {
		if(error) return next(error);
		if(!time) return next("Time not found");
		res.locals.time = time;
		res.locals.time.potentialHours = humanize.hourDiff(time.startDate, time.endDate);
		next();
	});
}

function getCommits(req, res, next) {
	Commit
		.find({time: res.locals.time._id})
		.populate('user', 'name')
		.lean()
		.exec(function(error, commits) {
			if(error) return next(error);
			res.locals.time.commits = commits;
			next();
		});
}

function authorize(req, res, next) {
	if(req.user.isPro) return next();
	res.forbidden()
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

function isFormString(str) {
	if(typeof str !== 'string') return false;
	return str.length && true;
}

