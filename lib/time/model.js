
var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	ObjectId 	= Schema.ObjectId,
	Timestamp	= require('../shared/mongoose/timestamp'),
	Markdown 	= require('../shared/mongoose/markdown');

var timeSchema = new Schema({

	title: {type: String, required: true},
	event: {type: ObjectId, required: true, ref: 'Event'},
	startDate: Date,
	endDate: Date,
	capacity: Number,
	volunteered: Boolean

});

timeSchema.plugin(Timestamp, {publishable: true});
timeSchema.plugin(Markdown);

timeSchema.virtual('past')
	.get(function() {
		var time = this;
		return time.published && time.endDate && time.endDate < new Date();
	});

timeSchema.static('hasPast', function(time) {
	return time.published && time.endDate && time.endDate < new Date();
});

timeSchema.static('joinable', function(time) {
	var commits = time.commits;
	return !time.past && (time.capacity === 0 || time.capacity > commits.length);
});



module.exports = mongoose.model('Time', timeSchema);