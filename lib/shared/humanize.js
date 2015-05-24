
var moment = require('moment');

module.exports.humanTime = function(date) {
	return moment(date).format('LT');
};

module.exports.humanDate = function(date) {
	return moment(date).format('MMMM Do YYYY');
};

module.exports.humanDatetime = function(date) {
	return moment(date).format('dddd, MMMM Do YYYY, h:mm');
};

module.exports.hourDiff = function(a,b) {
	return Math.abs(moment(a).diff(b, 'hours'));
};

module.exports.firstName = function(name) {
	return name.trim().split(" ")[0];
};

module.exports.capitalize = function(str) {
	str = str.trim();
	return str.charAt(0).toUpperCase()+str.slice(1);
};

module.exports.extendMethodsTo = function(obj) {
	for(var key in module.exports) {
		if(module.exports.hasOwnProperty(key) && key !== 'extendMethodsTo') {
			obj[key] = module.exports[key];
		}
	}
};
