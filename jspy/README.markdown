# JsPy - JavaScript Python API.

JsPy is a Native Client module containing python and a simple `postMessage` JavaScript API. There are no DOM-bindings.

TODO: The directory already contains the complied JsPy application. If you just want to use Python from JavaScript then you don't have compile anything.

## Test your python library:
    cd $PROJECT/jspy
    make runtest32
    make runtest64
Should see `"Hello from Nacl Python"`

## Compile jspy
    make jspy32
    make jspy64
Should see plenty of warnings but no errors.
TODO: fix warnings.

## Using JsPy
TODO: document `postMessage` api.

## TODOs
* TODO: tidy up C++, review mem use, crashing?
* TODO: how to detect "NativeClient: NaCl module crashed" in JS?
