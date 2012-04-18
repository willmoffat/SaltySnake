console.log('HACK ss_content_script START');
// If the response from the nacl_mode is from stderr then add
// a <pre> tag, otherwise use <div>.
function injectResponse(response) {
  // console.log('Response:', response);
  var i = response.indexOf(':');
  var header = response.slice(0,i);
  var output = response.slice(i+1);
  if (header == 'stderr') {
    var el = document.createElement('pre');
    el.textContent = output;
    el.style.color = 'red';
  } else {
    var el = document.createElement('div');
    el.innerHTML = output;
  }
  var py_tag = document.body.firstChild; // HACK!!
  py_tag.parentNode.insertBefore(el, py_tag.nextSibling);
  runNextScript();
}

function runPython(py_code) {
  chrome.extension.sendRequest(py_code, injectResponse);
}


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

function toArray(list) {
  return Array.prototype.slice.call(list);
}

var dom = {
  editor : null,
  editorOriginalParent: null,
  fullscreenStyle : null,
  topLevelElems : null,
  topLevelDisplay: null,
  fullscreenButton: null
};

function hideTopLevel() {
  dom.topLevelElems = toArray(document.body.children);
  dom.topLevelDisplay = dom.topLevelElems.map(function(el) { return el.style.display; });
  dom.topLevelElems.forEach(function(el) { el.style.display = 'none'; });
}

function restoreTopLevel() {
  dom.topLevelElems.forEach(function(el,i) {
    console.log('setting ', el, ' to ', dom.topLevelDisplay[i]);
    el.style.display = dom.topLevelDisplay[i];
  });
}

function doToggle() {
  console.log('HACK: toggle!!');
  if (currentlyFullscreen) {
    restoreEditor();
  } else {
    fullscreenEditor();
  }
  currentlyFullscreen = !currentlyFullscreen;
  updateButtonImage();
}


function fullscreenEditor() {
  console.log('fullscreenEditor');

  hideTopLevel();

  var css = [
    '.CodeMirror-scroll {',
    '  height: auto; ',
    '  overflow-y: hidden; ',
    '  overflow-x: auto; ',
    '  width: 100%; ',
    '}'].join('\n');
  dom.fullscreenStyle = make('style', document.body, {textContent:css});

  dom.editor = document.querySelector('.CodeMirror');
  dom.editorOriginalParent = dom.editor.parentNode;
  dom.editorNextSibling = dom.editor.nextSibling;
  document.body.appendChild(dom.editor);

  // Bug: Could not get this to work. (Screen just goes blank).
  //dom.editor.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
}

function keyHandler(e) {
  if (!currentlyFullscreen) return;
  if (e.which === 27) {
    doToggle();
  }
}

// TODO: handle Escape
function restoreEditor() {
  console.log('restoreEditor');
  //document.webkitCancelFullScreen();
  restoreTopLevel();
  dom.fullscreenStyle.parentNode.removeChild(dom.fullscreenStyle);
  dom.editorOriginalParent.insertBefore(dom.editor, dom.editorNextSibling);
}

var currentlyFullscreen = false;

// TODO: credit http://findicons.com/pack/1688/web_blog.
function updateButtonImage() {
  var icon = currentlyFullscreen ?
               'arrow_contract.png' :
               'arrow_expand.png';
  var src = chrome.extension.getURL('/images/' + icon);
  dom.fullscreenButton.src = src;
}

function doRun() {
  console.log('RUN');
  callCommRun();
  setTimeout(sendToApp, 100);
}

function addButtonTo(editor) {
  console.log('ss: Adding button to', editor);
  dom.fullscreenButton = make('img', editor, {title:'Toggle Fullscreen', onclick:doToggle});
  dom.fullscreenButton.style.cssText = 'position:absolute; right:7px; top:-7px; z-index:30000; pointer:cursor;';
  updateButtonImage();

  dom.runButton = make('button', editor, {textContent:'Run', onclick:doRun});
  dom.runButton.style.cssText = 'position:absolute; right:50px; top:4px; z-index:30000;';

  setupPageComm();
}

function waitForEditor() {
  var cm = document.querySelector('.CodeMirror');
  if (cm) {
    addButtonTo(cm);
    document.addEventListener('keydown', keyHandler, false);
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

console.log('HACK ss_content_script END');

/*


assignment.getCode());


 */


var prefix = 'ss';  // Must be unique on page.
var dataNodeId     = prefix + '-data';  // Shared dom node between page and content scripts.
var kGetEditorCode = prefix + 'Run';    // Injected function to update data node.

function injectScript(code) {
  // TODO: reuse make
  var script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);
  // setTimeout(function() { document.head.removeChild(script); }, 100);
}

function setupPageComm() {
  if (!document.getElementById(dataNodeId)) {
    // use HACK make!
    var div = document.createElement('pre');
    div.id = dataNodeId;
    div.textContent = 'null data 2';
    // TODO: display none
    document.body.appendChild(div);

    var code = [
      'window.' + kGetEditorCode + ' = function() { ',
      '  val = App.current_nugget_controller.get("currentAssignment").getCode(); ',
      '  document.getElementById("' + dataNodeId + '").textContent = val; ',
      '}; '
    ].join('\n');

    injectScript(code);
  }
}

function callCommRun() {
  injectScript('window.' + kGetEditorCode + '();' );
}

function sendToApp() {
  var pyCode = document.getElementById(dataNodeId).textContent;
  console.log('HACK: ', pyCode);
  runPython(pyCode);
}
