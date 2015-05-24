
var path 			= require('path');
var express 		= require('express');
var compression 	= require('compression');
var favicon 		= require('serve-favicon');
var morgan 			= require('morgan');
var cookieParser	= require('cookie-parser');
var bodyParser 		= require('body-parser');
var methodOverride	= require('method-override');
var mongoose 		= require('mongoose');

var config = require('./config');

var	app = module.exports = express();
var dev = (process.env.NODE_ENV || 'development') === 'development';
var dir_public 	= path.join(config.root, 'website', 'output');
var dir_view 	= path.join(config.root, 'view');

app.set('showStackError', true);

app.use(compression({
	filter: function(req, res) {
		return /json|text|javascript|css/.test(res.getHeader('Content-Type'));
	},
	level: 9
}));
app.use(express.static(dir_public));
app.use(favicon(path.join(dir_public, 'favicon.ico')));
app.disable('x-powered-by');

app.set('views', dir_view);
app.set('view engine', 'jade');
app.set('view options', {layout: false, self: true});

if(dev) {
	app.use(morgan('dev'));
	app.use(function(req, res, next) {
		console.log('@', req.url);
		next();
	});
}

app.use(cookieParser("CHRIS IS KEY"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());

mongoose.connect(config.server.database.url);
require('./auth/session')(app, mongoose);

module.exports = app;
