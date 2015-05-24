// reemfile.js
var markdown = require('reem-markdown');

module.exports = function(reem, done) {
	reem.view.engine = "jade";

	// <head> meta
	var g = reem.data;
	g.author = 'Chris Andrejewski (http://chrisandrejewski.com)';
	g.description = 'The website of the National Honor Society of Northwest Pennsylvania Collegiate Academy';
	g.keywords = ['national', 'honor', 'society', 'collegiate', 'academy', 'pennsylvania', 'northwest'];
	g.website = 'http://npcanhs.org';

	g.board = [
		{name: 'Jacob Zimmer', title: 'President'},
		{name: 'Karley Nicolia', title: 'Vice President'},
		{name: 'Christine Wu', title: 'Secretary'},
		{name: 'Daniel Liszka', title: 'Treasurer'},
		{name: 'Julianne Lanich', title: 'Advisor'}
	];

	reem.Post.use(markdown());

	done(null);
}