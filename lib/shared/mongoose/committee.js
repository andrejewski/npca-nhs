
var committees = [
	{name: 'board', color: '#000000'},
	{name: 'general', color: 'inherit'},
	{name: 'service', color: '#32ad64'},
	{name: 'board', color: '#428bca'},
	{name: 'board', color: '#eea700'},
	{name: 'board', color: '#d9534f'},
];

module.exports = function committee(schema, options) {
	options = options || {},
	defaultCommittee = 1;

	schema.add({ 'com': {type: Number, default: defaultCommittee} });
	if(options.index) schema.path('com').index(options.indexText);

	schema.virtual('committee')
		.get(function() {
			return committees[this.com || defaultCommittee].name;
		})
		.set(function(str) {
			for(var index in committees) {
				if(committees.hasOwnProperty(index)) {
					if(committees[index].name === str) {
						this.com = parseInt(index, 10);
						return;
					}
				}
			}
			throw new Error('Invalid committee name.');
		});

	schema.virtual('committeeColor')
		.get(function() {
			return committees[this.com || defaultCommittee].color;
		});

	schema.static('addCommitteeVirtuals', function(doc) {
		var i = doc.com || defaultCommittee;
		doc.committee = committees[i].name;
		doc.committeeColor = committees[i].color;
		return doc;
	});

	schema.static('getComFromCommittee', function(committee) {
		for(var index in committees) {
			if(committees.hasOwnProperty(index)) {
				if(committees[index].name === committee) {
					return parseInt(index, 10);
				}
			}
		}
		throw new Error('Invalid committee name: '+committee);
	});

	schema.static('getCommitteeNames', function() {
		return committees.map(function(c) {
			return c.name;
		});
	});

}
