var editor;
var DEBUG = true;

var jspy = (function() {
  var module;

  function send(cmd, data) {
    var msg = cmd;
    if (data) {
      msg += ':' + data;
    }
    if (DEBUG) console.log('JSPY.send:', msg);
    module.postMessage(msg);
  }

  function receive(e) {
    var data = e.data;
    if (DEBUG) console.log('JSPY.receive:', data);
    var colon = data.indexOf(':');
    var header = data.slice(0,colon);
    var text   = data.slice(colon + 1);
    if (header == "stderr") { parseError(text); }
      setOutput(text, header);
    }

    function init() {
      if (DEBUG) console.log('JSPY.init');
      module = document.createElement('embed');
      module.src = '/jspy/jspy.nmf';
      module.type = 'application/x-nacl';
      document.body.appendChild(module);

      module.addEventListener('load', function() {
        if (DEBUG) console.log('JSPY.load');
        // TODO: grey out Run until module is ready.
      }, true);
      module.addEventListener('message', receive, true);
    }

    init();

    return {
      send: send
    };
})();

function setOutput(text, className) {
  if (DEBUG) console.log('setOutput: ',className, text);
  var output = document.getElementById('output');
  output.className = className || '';
  output.value = text;
}

function doRun() {
  var py_code = editor.getSession().getValue();
  setOutput('Running...');
  localStorage['code'] = py_code;
  document.getElementById('tip').style.display = 'none';
  editor.getSession().clearAnnotations();
  jspy.send('run', py_code);
}

function doStop() {
  setOutput('Stopping...');
  jspy.send('stop');
}

//var run    = document.getElementById('run');
//run.addEventListener('click', doRun, true);

function keyHandler(e) {
  // Backspace = stop browser-back.
  if (e.which === 8) {
    e.preventDefault();
  }
  if (e.metaKey || e.ctrlKey) {
    // Ctrl-Enter = Run.
    if (e.which === 13) {
        doRun();
        e.preventDefault();
    }
  }
}

function init_editor(text) {
  if (!text) {
    text = [
      'def hi(name):',
      '  print "Hello " + name',
      '',
      'for n in ["Alice", "Bob", "Charlie"]:',
      '  hi(n)'
      ].join('\n');
  }
  editor = ace.edit('input');

  editor.renderer.setHScrollBarAlwaysVisible(false);
  editor.renderer.setShowPrintMargin(false);

  editor.setTheme('ace/theme/eclipse');
  var PythonMode = require('ace/mode/python').Mode;
  editor.getSession().setMode(new PythonMode());
  editor.getSession().setValue(text);
}

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
// window.onbeforeunload = function() {
//  return "--- Python in your Browser ---";
//};

init_editor(localStorage['code']);
window.addEventListener('keydown', keyHandler, true);

