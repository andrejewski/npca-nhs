
var marked = require('marked');

module.exports = function markdown(schema, options) {
	options = options || {};
	
	schema.add({ 'text': String });
	schema.add({ 'content': String });

	schema.pre('save', function(next) {
		if(this.isModified('text')) {
			this.content = marked(this.text);
		}
		next();
	});

	if(options.indexText) {
		schema.path('text').index(options.indexText);
	}
	if(options.indexContent) {
		schema.path('content').index(options.indexContent);
	}
}


