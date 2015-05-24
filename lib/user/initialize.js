
/*
	The CTO needs to be created first or must already exist.
	S/he will set up all other users after they receive an email
	containing their account password.
*/

var User = require('../user/model');
var config = require('../config');

module.exports = function(next) {
	User.findOne({role: 5}, function(error, user) {
		if(error) return next(error);
		if(user) return next(null);
		
		var email = config.server.ctoEmail;
		if(!email) {
			return next(new Error('config: server.ctoEmail is required.'));
		}

		return User.create({
			name: "Chief",
			email: email,
			role: 5,
			title: 'Chief Technical Officer'
		}, next);
	});
}
