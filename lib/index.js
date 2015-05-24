
var async = require('async');
var port = +process.env.PORT || 3000;
var app = require('./express');

async.series([
	require('./user/initialize'), 
	require('./mandrill/initialize'), 
	require('./commit/notify')
], function(error) {
	if(error) throw error;

	require('./application')(app);
	
	app.listen(port);
	console.log('@:'+port);
});
