
// requires epiceditor.min.js
var textbox = document.getElementById('textbox');

var Editor = new EpicEditor({
	basePath: '/js/epiceditor',
	clientSideStorage: false,
	theme: {
		base: '/themes/base/epiceditor.css',
		preview: '/themes/preview/github.css',
		editor: '/themes/editor/epic-light.css'
	},
	file: {
		defaultContent: textbox.value
	},
	autogrow: {
		minHeight: 200
	}
}).load();

setTimeout(commitText, 10);
Editor.on('save', commitText);
Editor.on('autosave', commitText);

function commitText() {
	textbox.value = Editor.exportFile();
}

