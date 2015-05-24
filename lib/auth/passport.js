
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	User = require('../user/model');

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, done);
});

var form = {
	usernameField: 'email',
	passwordField: 'password'
};

passport.use(new LocalStrategy(form, function(email, password, done) {
	var loginError = done.bind(null, null, false);
	User.findOne({email: email}, function(error, user) {
		if(error) return done(error);
		if(!user) return loginError('"'+email+'" is not a registered email address.');
		user.comparePassword(password, function(error, matches) {
			if(error) return done(error);
			if(!matches) return loginError("The email address or password provided was not correct.");
			done(null, user);
		});
	});
}));

module.exports = passport;
