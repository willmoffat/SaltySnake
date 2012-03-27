// This is a Chrome Content script that looks for <script type=text/python>
// and sends the contents to the Background page for evalutation.
// The resulting output is injected back into the page.

var py_script_tags = [];

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
  var py_tag = py_script_tags.shift();
  py_tag.parentNode.insertBefore(el, py_tag.nextSibling);
  runNextScript();
}

function runNextScript() {
  if (!py_script_tags.length) return;
  var py_code = py_script_tags[0].textContent;
  // console.log('Send:', py_code);
  chrome.extension.sendRequest(py_code, injectResponse);
}

function findScripts() {
  var nodelist = document.querySelectorAll('script[type="text/python"]');
  for (var i = 0; i < nodelist.length; i++) {
    py_script_tags.push(nodelist[i]);
  }
  return nodelist.length > 0;
}

findScripts();
runNextScript();

