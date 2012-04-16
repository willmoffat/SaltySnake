# Python in Chrome

This is a step-by-step guide to building a Chrome Web App using [Native Client](https://developers.google.com/native-client/) (NaCl) to compile the Python interpreter.

*To install the example app please visit the [project homepage](http://willmoffat.github.com/SaltySnake/).*

## Building a Chrome Python app

* Compile Python using the NaCl toolchain. _Optional_. See `py_patch/`.
* Write a C++ NaCl module that provides an interface to the embedded Python. _Optional_. See `jspy/'.
* Write a JavaScript Chrome App or Extension using the NaCl module. See `apps/editor`.

