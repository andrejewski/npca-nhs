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
		member('Jacob Zimmer', 'President'),
		member('Karley Nicolia', 'Vice President'),
		member('Christine Wu', 'Secretary'),
		member('Daniel Liszka', "Treasurer"),
		member('Julianne Lanich', 'Advisor')
	];

	function member(name, title) {
		return {
			name: name,
			title: title
		};
	}

	reem.Post.use(markdown());

	done(null);
}