var output    = document.getElementById('output');
var pepper_py = document.getElementById('pepper_py');
var run       = document.getElementById('run');

function handleMessage(e) {
  var data = e.data;
  var colon = data.indexOf(':');
  var header = data.slice(0,colon);
  var text   = data.slice(colon + 1);
  output.className = header;
  output.textContent = text;
}

function doRun() {
  var py_code = editor.getSession().getValue();
  output.textContent = 'Running...';
  pepper_py.postMessage('run:'+ py_code);
}

pepper_py.addEventListener('message', handleMessage, true);
run.addEventListener('click', doRun, true);


  var editor = ace.edit('input');

  editor.renderer.setHScrollBarAlwaysVisible(false);

  editor.setTheme('ace/theme/eclipse');
  var PythonMode = require('ace/mode/python').Mode;
  editor.getSession().setMode(new PythonMode());


  editor.commands.addCommand({
    name: "run",
    bindKey: {
        win: "Ctrl-R|Ctrl-Return",
        mac: "Command-R|Command-Return",
        sender: "editor"
    },
    exec: doRun
  });

