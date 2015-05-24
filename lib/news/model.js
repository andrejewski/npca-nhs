
var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	ObjectId 	= Schema.ObjectId,
	Timestamp	= require('../shared/mongoose/timestamp'),
	Markdown 	= require('../shared/mongoose/markdown'),
	Committee 	= require('../shared/mongoose/committee');

var newsSchema = new Schema({

	title: {type: String, required: true},
	subtitle: String

});

newsSchema.plugin(Timestamp, {publishable: true});
newsSchema.plugin(Markdown);
newsSchema.plugin(Committee);

module.exports = mongoose.model('News', newsSchema);