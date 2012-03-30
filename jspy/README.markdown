# JsPy - JavaScript Python API.

JsPy is a Native Client module containing python and a simple `postMessage` JavaScript API. There are no DOM-bindings.

This directory already contains the complied JsPy application. If you just want to use Python from JavaScript then you don't have compile anything. See the example Chrome applications in `apps/` for how to use the *.nexe files.


## Test the NaCl python library

`test_python.cc` is a Hello World app that links against the NaCl Python library. As a sanity check, compile and run that before buliding your own module:

    cd $PROJECT/jspy
    make runtest32
    make runtest64

You should see `"Hello from Nacl Python"` each time.

_TODO: Amazon instance has a problem with /usr/lib/libcrypto.so.0.9.8 (e) which breaks ncval and so these tests fail._

## Compile JsPy

    cd $PROJECT/jspy
    make jspy32
    make jspy64

You should see plenty of warnings but no errors. TODO: fix warnings.

## Using JsPy

In a Chrome extensions page:

```html
<embed id="jspy" src="/jspy/jspy.nmf" type="application/x-nacl" />
<script>
  // Listen for output:
  jspy.addEventListener('message', function(e) {
    console.log('JsPy:', e.data);
  }, true);

  // To execute python:
  var cmd = 'run';
  var data = 'print "Hello world!"';
  jspy.postMessage(cmd + ':' + data);
</script>

See `apps/` for real examples.

## TODOs
* TODO: tidy up C++, review mem use, crashing?
* TODO: how to detect "NativeClient: NaCl module crashed" in JS?
