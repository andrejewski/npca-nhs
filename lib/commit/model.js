
var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	ObjectId 	= Schema.ObjectId,
	Timestamp	= require('../shared/mongoose/timestamp');

var commitSchema = new Schema({

	time: {type: ObjectId, ref: 'Time', required: true},
	user: {type: ObjectId, ref: 'User', required: true},
	attended: {type: Boolean, default: false},
	notified: {type: Boolean, default: false},
	detail: String,
	hours: Number

});

commitSchema.plugin(Timestamp);

module.exports = mongoose.model('Commit', commitSchema);

