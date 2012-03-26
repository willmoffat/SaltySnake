var output    = document.getElementById('output');
var pepper_py = document.getElementById('pepper_py');
var run       = document.getElementById('run');

function handleMessage(e) {
  var data = e.data;
  var colon = data.indexOf(':');
  var header = data.slice(0,colon);
  var text   = data.slice(colon + 1);
  if (header == "stderr") { parseError(text); }
  output.className = header;
  output.textContent = text;
}

function doRun() {
  var py_code = editor.getSession().getValue();
  output.textContent = 'Running...';
  document.getElementById('tip').style.display = 'none';
  editor.getSession().clearAnnotations();
  pepper_py.postMessage('run:'+ py_code);
}

pepper_py.addEventListener('message', handleMessage, true);
run.addEventListener('click', doRun, true);


  var editor = ace.edit('input');

  editor.renderer.setHScrollBarAlwaysVisible(false);
  editor.renderer.setShowPrintMargin(false);

  editor.setTheme('ace/theme/eclipse');
  var PythonMode = require('ace/mode/python').Mode;
  editor.getSession().setMode(new PythonMode());


  editor.commands.addCommand({
    name: "run",
    bindKey: {
        win: "Ctrl-Return",
        mac: "Command-Return",
        sender: "editor"
    },
    exec: doRun
  });

function set_error(row, text) {
  editor.getSession().setAnnotations(
    [{row: row,  text: text, column: 0, type: "error" }]
  );
  editor.navigateTo(row,80);
  editor.scrollToLine(row);
}

function parseError(text) {
  var lines = text.split('\n');
  // Throw away last newline.
  lines.pop();
  var msg = lines.pop();
  var match = null;
  while (!match && lines.length) {
    var r = /\bline (\d+)\b/.exec(lines.pop());
    if (r) {
      var line_num = parseInt(r[1]) - 1;
      set_error(line_num, msg);
      return;
    }
  }
  console.error('Could not parse', text);
}

// It's too easy to lose your work. This is a temporary hack
// to warn the user.
window.onbeforeunload = function() {
  return "--- Python in your Browser ---";
};
