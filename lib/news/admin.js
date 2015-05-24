
var express = require('express'),
	async = require('async'),
	News = require('../news/model');

var router = module.exports = express.Router();

router.route('/')
	.all(function(req, res, next) {
		async.parallel([
			draft.bind(null, req, res),
			published.bind(null, req, res)
		], function(error) {
			if(error) return next(error);
			next();
		});
	})
	.get(function(req, res, next) {
		res.render('news/list');
	});

function published(req, res, next) {
	News.find({published: true})
		.select('title subtitle publishedAt com')
		.sort('field -publishedAt')
		.limit(20)
		.lean()
		.exec(function(error, stories) {
			if(error) return next(error);
			res.locals.stories = stories.map(News.addCommitteeVirtuals);
			next();
		});
}

function draft(req, res, next) {
	News.find({published: false})
		.select('title subtitle createdAt com')
		.sort('field -createdAt')
		.lean()
		.exec(function(error, stories) {
			if(error) return next(error);
			res.locals.drafts = stories.map(News.addCommitteeVirtuals);
			next();
		});
}

router.route('/create')
	.get(function(req, res, next) {
		News.create({
			title: "New Announcement",
			subtitle: "With an Optional Subtitle"
		}, function(error, story) {
			if(error) return next(error);
			res.redirect('/news/'+story._id+'/edit/'); 
		});
	});

