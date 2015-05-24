
module.exports = function timestamp(schema, options) {
	options = options || {};

	schema.add({ createdAt: {type: Date, default: Date.now} });
	schema.add({ updatedAt: Date });

	schema.pre('save', function(next) {
		this.updatedAt = new Date();
		next();
	});

	if(options.publishable) {
		schema.add({published: {type: Boolean, default: false} });
		schema.add({publishedAt: Date});

		schema.pre('save', function(next) {
			if(this.isModified('published') && this.published) {
				this.publishedAt = new Date();
			}
			next();
		});
	}

	if(options.indexCreatedAt) {
		schema.path('createdAt').index(options.indexCreatedAt);
	}
	if(options.indexUpdatedAt) {
		schema.path('updatedAt').index(options.indexUpdatedAt);
	}
	if(options.indexPublished) {
		schema.path('published').index(options.indexPublished);
	}
	if(options.indexPublishedAt) {
		schema.path('publishedAt').index(options.indexPublishedAt);
	}
}
