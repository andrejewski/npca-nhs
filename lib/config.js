
var path = require('path');

var root = path.dirname(__dirname);
var file = path.join(root, 'config.json');
var conf = require(file);

conf.root = root;

conf.currentYear = function currentYear() {
	var tday = new Date();
	var eday = new Date(conf.school.yearEnd);
	return tday.getFullYear() + (tday > eday);
}

module.exports = conf;
