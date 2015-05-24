
var express = require('express'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	MongoStore = require('connect-mongo')({session: session}),
	passport = require('./passport');

module.exports = function(app, mongoose) {

	var params = {
		cookieParser: cookieParser,
		passport: passport,
		secret: 'CHRIS IS KEY',
		key: 'chocolate.chip',
		maxAge: new Date(Date.now() + 3600000),
		store: new MongoStore({
			mongoose_connection: mongoose.connections[0]
		}),
		resave: false,
		saveUninitialized: true
	};

	app.use(session(params));
	app.use(passport.initialize());
	app.use(passport.session());

}
