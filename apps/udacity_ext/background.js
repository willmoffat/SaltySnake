//HACK: some way to reload module?

var jspy;

var DEBUG = true;

var waiting_callback;

function initModule(callback) {
  if (DEBUG) console.log('JsPy init');
  if (jspy) {
    jspy.parentNode.removeChild(jspy);
  }
  jspy = document.createElement('embed');
  jspy.src = '/jspy/jspy.nmf';
  jspy.type = 'application/x-nacl';
  document.body.appendChild(jspy);
  waiting_callback = function() { console.error('Should never be called'); };
  jspy.addEventListener('load', function() { initModuleMessageHandler(callback); });
}

function initModuleMessageHandler(initCallback) {
  if (DEBUG) console.log('JsPy Module loaded');
  waiting_callback = null;
  jspy.addEventListener('message', messageHandler);
  initCallback();
}

function messageHandler(e) {
  if (DEBUG) console.log('From JsPy:', e.data);
  if (!waiting_callback) {
    console.error('No waiting callback');
  } else {
    waiting_callback(e.data);
    waiting_callback = null;
  }
}

function handleContentScriptMessage(msg, sender, sendResponse) {
  if (DEBUG) console.log('To   JsPy:', msg);
  if (msg === 'init') {
    initModule(sendResponse);
    return;
  }
  if (waiting_callback) {
    sendResponse('stderr:JSPY error: outstanding callback');
    return;
  }
  waiting_callback = sendResponse;
  jspy.postMessage(msg);
}


chrome.extension.onRequest.addListener(handleContentScriptMessage);
