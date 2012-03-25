var output    = document.getElementById('output');
var pepper_py = document.getElementById('pepper_py');

function handleMessage(e) {
  var data = e.data;
  var colon = data.indexOf(':');
  var header = data.slice(0,colon);
  var text   = data.slice(colon + 1);
  output.className = header;
  output.textContent = text;
}

function doRun() {
  output.textContent = 'Running...';
  pepper_py.postMessage('run:'+input.value);
}

pepper_py.addEventListener('message', handleMessage, true);
run.addEventListener('click', doRun, true);

