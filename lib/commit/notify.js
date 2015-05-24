
var async = require('async'),
	humanize = require('../shared/humanize'),
	moment = require('moment'),
	schedule = require('node-schedule'),
	Time = require('../time/model'),
	Commit = require('../commit/model'),
	Mandrill = require('../mandrill/');

var config = require('../config');

module.exports = function initialize(next) {
	if(next) next(null);

	var now = moment();
	var todaySend = sendTime();

	if(now.isAfter(todaySend)) {
		notifyForCommits(done);
	}
	
	var everydayRule = {hour: config.mandrill.sendHour};
	var everydayJob = schedule.scheduleJob(
			everydayRule, notifyForCommits.bind(null, done));

	function sendTime() {
		return moment({hours: config.mandrill.sendHour});
	}

	function done(error) {
		if(error) throw error;
	}
}

function notifyForCommits(done) {
	async.waterfall([
		getUpcomingTimes,
		addUnnotifiedUsers,
		function assumeFn(times, next) {
			async.series([
				markCommitsNotified.bind(null, times),
				sendNotifications.bind(null, times)
			], next);
		}
	], done);
}

function getUpcomingTimes(next) {
	var endOfTommorow = moment().add(1, 'days').endOf('day');
	Time.where('startDate').gt(new Date()).lt(endOfTommorow)
		.select('title event startDate')
		.populate('event', 'title')
		.exec(function(error, times) {
			if(error) return next(error);
			next(error, times);
		});
}

function addUnnotifiedUsers(times, next) {
	times.forEach(function(time) {
		time.users = [];
	});
	Commit.find({attended: false, notified: false})
		.where('time').in(dotMap(times, '_id'))
		.select('user time')
		.populate('user', 'name email')
		.lean()
		.exec(function(error, commits) {
			if(error) return next(error);
			if(!commits || !commits.length) return next(null, []);			
			commits.forEach(function(commit) {
				var time = times.filter(function(t) {
					return commit.time.equals(t._id);
				}).pop();
				time.users.push(commit.user);
			});
			next(error, times.map(function(time) {
				if(Array.isArray(time.users)) {
					time.users = reduceUniqueUsers(time.users);
				}
				return time;
			}).filter(function(time) {
				return time.users && !!time.users.length;
			}));
		});
}

function sendNotifications(times, next) {
	async.map(times, sendNotification, next);

	function sendNotification(time, next) {
		var timeObj = time.toObject();
		timeObj.humanTime = humanize.humanTime(time.startDate);
		timeObj.humanDate = humanize.humanDate(time.startDate);

		var users = time.users.map(function(user) {
			user.time = timeObj;
			return user;
		});
		// EmailWorks(function(error) {
		Mandrill.send('commit-notification', users, function(error) {
			if(error) return next(error);
			next(error, time);
		});
	}
}

function EmailWorks(next) {
	next(null);
}

function markCommitsNotified(times, next) {
	var timeIds = dotMap(times, '_id');
	Commit.find({
			attended: false,
			notified: false,
			time: {$in: timeIds}
		})
		.update({$set: {notified: true}}, next);
}

function dotMap(os, prop) {
	return os.map(function(o) {
		return o[prop];
	})
}

function reduceUniqueUsers(users) {
	var seenIds = [], 
		seenUsers = [];
	users.forEach(function(user) {
		var id = user._id.toString()
		if(!~seenIds.indexOf(id)) {
			seenIds.push(id);
			seenUsers.push(user);
		}
	});
	return seenUsers;
}


