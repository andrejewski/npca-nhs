
var express = require('express'),
	News = require('../news/model'),
	isValidObjectId = require('mongoose').Types.ObjectId.isValid;

var router = module.exports = express.Router(); 

router.param('news_id', function(req, res, next, newsId) {
	if(!isValidObjectId(newsId)) return next('route');
	News.findById(newsId, function(error, story) {
		if(error) return next(error);
		if(!story) return res.notFound();
		res.locals.story = story;
		next();
	});
});

router.route('/:news_id')
	.all(function(req, res, next) {
		var story = res.locals.story;
		if(story.published || req.user.isPro) return next();
		res.forbidden();
	})
	.get(function(req, res, next) {
		res.render('news/show');
	});

router.route('/:news_id/edit')
	.all(authorize, getCommitteeList)
	.get(function(req, res, next) {
		res.render('news/edit');
	})
	.post(function(req, res, next) {
		var story = res.locals.story,
			published = story.published || "publish" === req.body.action.toLowerCase();
		story.set({
			title: req.body.title,
			subtitle: req.body.subtitle,
			committee: req.body.committee,
			text: req.body.text,
			published: published
		}).save(function(error, story) {
			if(story.published) return res.redirect('/news/'+story._id);
			res.locals.story = story;
			res.locals.editSuccessful = true;
			res.render('news/edit');
		});
	});

router.route('/:news_id/delete')
	.all(authorize, function(req, res, next) {
		if(!res.locals.story) return res.redirect('/news/');
		next();
	})
	.get(function(req, res, next) {
		res.render('news/delete');
	})
	.post(function(req, res, next) {
		if(req.body.action !== 'delete') return next();
		res.locals.story.remove(function(error, story) {
			if(error) return next(error);
			res.redirect('/news/');
		});
	});

router.route('/')
	.get(function(req, res, next) {
		News.find({published: true, 'com': {$gte: req.user.isPro ? 0 : 1}})
			.select('title subtitle publishedAt com')
			.sort('field -publishedAt')
			.limit(20)
			.lean()
			.exec(function(error, stories) {
				if(error) return next(error);
				res.locals.stories = stories.map(News.addCommitteeVirtuals);
				res.render('news/list');
			});
	});

function getNews(req, res, next) {
	var newsId = req.params.id;
	if(!isFormString(newsId)) return next('route');
	News.findById(newsId, function(error, story) {
		if(error) return next(error);
		res.locals.story = story;
		next();
	});
}

function getCommitteeList(req, res, next) {
	res.locals.committeeList = News.getCommitteeNames();
	next();
}

function authorize(req, res, next) {
	if(req.user.isPro) return next();
	res.forbidden();
}

function isFormString(str) {
	if(typeof str !== 'string') return false;
	return str.length && true;
}