
var express = require('express'),
	async = require('async'),
	Event = require('../event/model'),
	Time = require('../time/model'),
	Commit = require('../commit/model');

var router = module.exports = express.Router(); 

router.route('/create')
	.get(function(req, res, next) {
		if(!req.user.isPro) return res.forbidden();
		Event.create({
			title: "New Event",
			subtitle: "With an Optional Subtitle"
		}, function(error, event) {
			if(error) return next(error);
			res.redirect('/events/'+event._id+'/edit/'); 
		});
	});

router.route('/:id')
	.all(getEventAndTimes, function(req, res, next) {
		var event = res.locals.event;
		if(event.published || req.user.isPro) return next();
		res.forbidden()
	})
	.get(function(req, res, next) {
		res.render('event/show');
	});

router.route('/:id/edit')
	.all(authorize, getEvent, getCommitteeList)
	.get(function(req, res, next) {
		res.render('event/edit');
	})
	.post(function(req, res, next) {
		var event = res.locals.event,
			published = event.published || "publish" === req.body.action.toLowerCase();
		event.set({
			title: req.body.title,
			subtitle: req.body.subtitle,
			text: req.body.text,
			committee: req.body.committee,
			published: published
		}).save(function(error, event) {
			if(event.published) return res.redirect('/events/'+event._id);
			res.locals.event = event;
			res.locals.editSuccessful = true;
			res.render('event/edit');
		});
	});

function getCommitteeList(req, res, next) {
	res.locals.committeeList = Event.getCommitteeNames();
	next();
}

router.route('/:id/delete')
	.all(authorize, getEvent, function(req, res, next) {
		if(!res.locals.event) return res.redirect('/events/');
		next();
	})
	.get(function(req, res, next) {
		res.render('event/delete');
	})
	.post(function(req, res, next) {
		if(req.body.action !== 'delete') return next();
		res.locals.event.remove(function(error, event) {
			if(error) return next(error);
			res.redirect('/events/');
		});
	});

router.route('/')
	.get(function(req, res, next) {
		Event.find(req.user.isPro 
				? {}
				: {published: true, com: {$gte: 1}})
			.select('title subtitle publishedAt com')
			.sort('field -publishedAt')
			.limit(20)
			.lean()
			.exec(function(error, events) {
				if(error) return next(error);
				addNextDatesForEvents(events.map(Event.addCommitteeVirtuals), function(error, events) {
					if(error) return next(error);
					res.locals.events = events;
					res.render('event/list');
				});
			});
	});

function addNextDatesForEvents(events, done) {
	async.map(events, function(event, done) {
		Time.findOne({event: event._id.toString()})
			.where('startDate').gt(Date.now())
			.sort('field startDate')
			.select('startDate')
			.lean()
			.exec(function(error, time) {
				if(error) return done(error);
				if(!time) {
					event.nextTime = null;
				} else {
					event.nextTime = time.startDate;
				}
				done(error, event);
			});
	}, function(error, events) {
		if(error) return next(error);
		var sortedEvents = events.sort(function(a, b) {
			if(a.nextTime === null) return 1;
			if(b.nextTime === null) return -1;
			return a.nextTime - b.nextTime;
		});
		done(error, sortedEvents);
	});
}

router.route('/:id/create_time')
	.all(authorize, getEvent)
	.get(function(req, res, next) {
		var event = res.locals.event;
		if(!event || !event._id) return next('route');
		new Time({
			title: "New "+event.title+" Time",
			event: event._id
		}).save(function(error, time) {
			if(error) return next(error);
			res.redirect('/events/times/'+time._id);
		});
	})

function getEvent(req, res, next) {
	var eventId = req.params.id;
	if(!isFormString(eventId)) return next('route');
	Event.findById(eventId, function(error, event) {
		if(error) return next(error);
		res.locals.event = event;
		next();
	});
}

function getEventTimes(req, res, next) {
	var eventId = req.params.id;
	if(!isFormString(eventId)) return next('route');
	Time.find({event: eventId})
		.lean()
		.exec(function(error, times) {
			if(error) return next(error);
			times = times.map(function(time) {
				time.past = Time.hasPast(time);
				return time;
			});
			async.map(times, addAttendeeCount, function(error, times) {
				if(error) return next(error);
				res.locals.times = times;
				next();
			});

			function addAttendeeCount(time, next) {
				Commit.count({time: time._id}, function(error, count) {
					time.attendeeCount = count;
					next(error, time);
				});
			}
		});
}

function getEventAndTimes(req, res, next) {
	async.parallel([
		getEvent.bind(null, req, res),
		getEventTimes.bind(null, req, res)
	], next);
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