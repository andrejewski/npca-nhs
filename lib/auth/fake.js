
var users = [{
	first: 'Patrick',
	last: 'Star',
	email: 'pstar@bikinibottom.gov',
	password: 'mayonnaise'
}, {
	first: 'Albert',
	last: 'Einstein',
	email: 'special@relativity.com',
	password: 'eequalsmcsquared'
}, {
	first: 'Clark',
	last: 'Kent',
	email: 'superman@leagueofjustice.org',
	password: 'etinotpyrk' // kryptonite
}, {
	first: 'Gordon',
	last: 'Gekko',
	email: 'ggordon@wallstreet.us',
	password: 'greedisgood'
}, {
	first: 'Benjamin',
	last: 'Williard',
	email: 'comsec0101@saigon.mil',
	password: 'stayintheboat'
}];

module.exports.user = function() {
	var user = users[Math.floor(Math.random()*users.length-1)+1];
	user.name = user.first + ' ' + user.last;
	return user;
}
