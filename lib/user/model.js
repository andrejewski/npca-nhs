
var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;
var ObjectId 	= Schema.ObjectId;

var Commit 		= require('../commit/model');
var Password 	= require('./password');
var Timestamp 	= require('../shared/mongoose/timestamp');
var Committee 	= require('../shared/mongoose/committee');

var config 		= require('../config');
var Mandrill 	= require('../mandrill/');

var userSchema = new Schema({
	name: {type: String, required: true},
	password: {type: String, required: true},
	email: {type: String, require: true, match: /@/, index: true, trim: true},

	role: {type: Number, default: 1},
	title: String,
	desc: String,
	classOf: Number,
	college: String,
	picture: String,
	bad: {type: Boolean, default: false},
	hours: Number
});

userSchema.plugin(Timestamp);
userSchema.plugin(Committee);

userSchema.set('autoIndex', process.env.autoIndex && true);

userSchema.virtual('isPro')
	.get(function() {
		return this.role >= 2;
	});

userSchema.virtual('isAdmin')
	.get(function() {
		return this.role >= 3;
	});

userSchema.virtual('isSuper')
	.get(function() {
		return this.role >= 4;
	});

userSchema.virtual('isSenior')
	.get(function() {
		return this.classOf === config.currentYear();
	});

userSchema.virtual('isGraduate')
	.get(function() {
		return this.classOf < config.currentYear();
	});

userSchema.pre('validate', function(next) {
	var user = this;
	if(user.isNew) {
		// 16 character password
		var password = randomPassword();
		user.set('password', password);
	}
	next();
});

userSchema.pre('save', function(next) {
	var user = this;
	(function emailWelcome(done) {
		if(!user.isNew) return done(null);
		Mandrill.send('welcome', user.toObject(), done);
	})(function(error) {
		if(error) return next(error);
		if(user.isModified('password')) {
			user.password = Password.hash(user.password);
		}
		user.email = user.email.trim();
		next();
	});
});

userSchema.pre('remove', function(next) {
	var user = this;
	Commit.remove({user: user._id}, function(error) {
		next(error);
	});
});

userSchema.method('comparePassword', function(password, callback) {
	callback(null, Password.validate(this.password, password));
});

userSchema.method('resetPassword', function(callback) {
	var user = this,
		password = randomPassword();
	user.password = password;
	user.save(function(error, savedUser) {
		if(error) return callback(error);
		var userObj = savedUser.toObject();
		userObj.key = password;
		Mandrill.send('password-reset', userObj, callback);
	});
});

function randomPassword() {
	return Password.salt().slice(1) + Password.salt().slice(1);
}

module.exports = mongoose.model('User', userSchema);
