var dom = {};

var currentlyExpanded = false;

var MSG_EMPTY_RESULT = 'Empty result. Did you forget to use "print"?';

function setError(lineNum, msg) {
  // Not using msg.
  var script = 'SS.markLine(' + lineNum + ');';
  injectScript(script);
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
      setError(line_num, msg);
      return;
    }
  }
  console.error('Could not parse', text);
}

function showOutput(result) {
  var out;
  var className = '';
  if (result.stderr) {
    className = 'ssError';
    out = result.stderr;
    parseError(result.stderr);
  } else {
    out = result.stdout || MSG_EMPTY_RESULT;
  }
  var el = document.getElementById('ssOutput');
  el.textContent = out;
  el.className = className;
}

var PyRunner = (function() {
  var decodeResponse = function(response) {
    var i = response.indexOf(':');
    var header = response.slice(0,i);
    var data   = response.slice(i+1);
    var result = {};
    result[header] = data;
    return result;;
  };

  var run = function(pyCode, callback) {
    var wrapper = function(r) { callback(decodeResponse(r)); };
    chrome.extension.sendRequest(pyCode, wrapper);
  };

  return { run:run };
})();





function make(tagname, opt_parent, opt_props) {
  var el = document.createElement(tagname);
  for (k in opt_props) {
    el[k] = opt_props[k];
  }
  if (opt_parent) {
    opt_parent.appendChild(el);
  }
  return el;
}


function doExpandEditor() {
  currentlyExpanded = true;
  dom.editorOriginalParent = dom.editor.parentNode;
  dom.editorNextSibling = dom.editor.nextSibling;
  document.body.appendChild(dom.editor);

  injectScript('SS.focusEditor()');

  document.body.className += ' ssExpanded';

  // Bug: Could not get this to work. (Screen just goes blank).
  //dom.editor.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
  //document.webkitCancelFullScreen();
}

function doContractEditor() {
  currentlyExpanded = false;
  dom.editorOriginalParent.insertBefore(dom.editor, dom.editorNextSibling);
  document.body.className = document.body.className.replace(' ssExpanded', '');
}

function keyHandler(e) {
  // Escape toggles
  if (e.which === 27) {
    currentlyExpanded ? doContractEditor() : doExpandEditor();
  }

  // Cmd/Ctrl-Enter runs.
  if (e.which === 13 && (e.metaKey || e.ctrlKey || e.shiftKey)) {
    if (!currentlyExpanded) {
      doExpandEditor();
    }
    doRun();
    e.preventDefault();
  }

  // No other keys are handled when in contracted mode.
  // if (!currentlyExpanded) return;

}

// HACK: need state (in flight)
function doRun() {
  showOutput({stdout:'Running...'});
  injectScript('SS.run();' );
  setTimeout(sendToApp, 1);
}

function sendToApp() {
  var pyCode = document.getElementById('ssDataNode').textContent;
  PyRunner.run(pyCode, showOutput);
}


function loadFile(filename) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', chrome.extension.getURL(filename), false);
  xhr.send(null);
  if (xhr.status !== 200) {
    console.error('Failed to load ' + filename, xhr);
  }
  return xhr.responseText;
}

function modifyEditor(editor) {
  dom.editor = editor;

  injectCss(   loadFile('page.css' ));
  injectHtml(  loadFile('page.html'), editor);
  injectScript(loadFile('page.js'  ), true);

  document.getElementById('ssRun'           ).addEventListener('click', doRun,            false);
  document.getElementById('ssButtonExpand'  ).addEventListener('click', doExpandEditor,   false);
  document.getElementById('ssButtonContract').addEventListener('click', doContractEditor, false);
  document.addEventListener('keydown', keyHandler, false);
}

function waitForEditor() {
  var editor = document.querySelector('.CodeMirror');
  if (editor) {
    modifyEditor(editor);
  } else {
    console.log('.');
    window.setTimeout(waitForEditor, 300);
  }
}

function init() {
  console.log('init');
  window.onerror = null; // Kill the Udacity error supressor.
  waitForEditor();
}

init();

function injectScript(code, keep) {
  var script = make('script', document.head, {textContent:code});
  if (!keep) {
    setTimeout(function() { document.head.removeChild(script); }, 100);
  }
}

function injectCss(css) {
  make('style', document.head, {textContent:css});
}

function injectHtml(html, parent) {
  var BASEURL = chrome.extension.getURL('');
  html = html.replace(/BASEURL/g, BASEURL);

  var dummy = make('div', null, {innerHTML:html});

  var fragment = document.createDocumentFragment();
  while(dummy.firstChild) {
    fragment.appendChild(dummy.firstChild);
  }
  parent.appendChild(fragment);
}
