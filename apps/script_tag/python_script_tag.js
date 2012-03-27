
// TODO: support more than one script in page.
var py_tag = document.querySelector('script[type="application/x-python"]');

// If the response from the nacl_mode is from stderr then add
// a <pre> tag, otherwise use <div>.
function injectResponse(response) {
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
  py_tag.parentNode.appendChild(el);
}

if (py_tag) {
  var py_code = py_tag.textContent;
  chrome.extension.sendRequest(py_code, injectResponse);
}