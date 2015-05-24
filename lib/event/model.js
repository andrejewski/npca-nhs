
var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	ObjectId 	= Schema.ObjectId,
	Timestamp	= require('../shared/mongoose/timestamp'),
	Markdown 	= require('../shared/mongoose/markdown'),
	Committee 	= require('../shared/mongoose/committee');

var eventSchema = new Schema({

	title: {type: String, required: true},
	subtitle: String

});

eventSchema.plugin(Timestamp, {publishable: true});
eventSchema.plugin(Markdown);
eventSchema.plugin(Committee);

module.exports = mongoose.model('Event', eventSchema);