
var startDateField = document.getElementById('start'),
	endDateField = document.getElementById('end');

var yesterday = (new Date()) - (24 * 36e5)

var startPicker = new Pikaday({
		field: startDateField,
		defaultDate: new Date(),
		minDate: new Date(yesterday),
		showTime: true,
		onSelect: bumpEndDate
	}),
	endPicker = new Pikaday({
		field: endDateField,
		defaultDate: new Date(),
		minDate: new Date(yesterday),
		showTime: true,
		onSelect: dumpStartDate
	});

function bumpEndDate() {
	var start = startPicker.getDate(),
		end = endPicker.getDate();
	if(start > end) {
		var mins15 = 15 * 60 * 1000,
			futureDate = new Date(start.getTime() + mins15);
		endPicker.setDate(futureDate);
	}
	endPicker.setMinDate(new Date(yesterday));
}

function dumpStartDate() {
	var start = startPicker.getDate(),
		end = endPicker.getDate();
	if(start > end) {
		var mins15 = 15 * 60 * 1000,
			pastDate = new Date(end.getTime() - mins15);
		startPicker.setDate(pastDate);
	}
}
