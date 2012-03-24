// Copyright (c) 2011 The Native Client Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/// @file
/// This example demonstrates loading, running and scripting a very simple NaCl
/// module.  To load the NaCl module, the browser first looks for the
/// CreateModule() factory method (at the end of this file).  It calls
/// CreateModule() once to load the module code from your .nexe.  After the
/// .nexe code is loaded, CreateModule() is not called again.
///
/// Once the .nexe code is loaded, the browser then calls the
/// HelloWorldModule::CreateInstance()
/// method on the object returned by CreateModule().  It calls CreateInstance()
/// each time it encounters an <embed> tag that references your NaCl module.

#include <cstdio>
#include <cstring>
#include <string>
#include "ppapi/cpp/completion_callback.h"
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include <pthread.h>

#include "Python.h"
extern int Py_NoSiteFlag;

namespace hello_world {
/// Method name for HACK, as seen by JavaScript code.
const char* const kMsgRun = "run";

/// Separator character.
static const char kMessageArgumentSeparator = ':';


// HACK: separate python specific parts.
// catcher code
static char pycode[] = ""
    "import sys \n"
    "class StdoutCatcher: \n"
    "  def __init__(self): \n"
    "    self.data = '' \n"
    "  def write(self, stuff): \n"
    "    self.data = self.data + stuff \n"
    "catcher = StdoutCatcher() \n"
    "sys.stdout = catcher \n"
    "";

std::string GetResult(const std::string& text) {
  Py_NoSiteFlag = 1;
  Py_Initialize();

  std::string code(pycode);
  code.append(text);
  PyRun_SimpleString(code.c_str());

  PyObject * module = PyImport_AddModule("__main__"); // borrowed reference

  PyObject* catcher = PyObject_GetAttrString(module, "catcher");
  PyObject* output = PyObject_GetAttrString(catcher, "data");

  //PyObject * dictionary = PyModule_GetDict(module);   // borrowed reference
  //PyObject * result
  //    = PyDict_GetItemString(dictionary, "result");     // borrowed reference

  std::string result_value = PyString_AsString(output);
  //printf("HACK: WILL: %s\n", result_value);
  std::string reversed_string(result_value); // HACK: copy before finalize??

  Py_Finalize();
  // Use reverse to reverse |reversed_string| in place.
  return reversed_string;
}

// HACK: Doc difference between instance and module.
class HelloWorldInstance : public pp::Instance {
 public:
  explicit HelloWorldInstance(PP_Instance instance) : pp::Instance(instance) {}
  virtual ~HelloWorldInstance() {}

  /// Called by the browser to handle the postMessage() call in Javascript.
  /// Detects which method is being called from the message contents, and
  /// calls the appropriate function.  Posts the result back to the browser
  /// asynchronously.
  /// @param[in] var_message The message posted by the browser.
  virtual void HandleMessage(const pp::Var& var_message);

 private:
  pthread_t python_thread_; //HACK: needs a mutex to protect it.
  std::string python_code_; // code to execute.
  pp::Var result_; // resulting python output.
  //HACK: must be static?
  static void* RunPython(void* self_);
  static void PostMessageResult(void* data, int32_t result);
};

void HelloWorldInstance::PostMessageResult(void* self_, int32_t dummy) {
  HelloWorldInstance* self = static_cast<HelloWorldInstance*>(self_);
  // we are back in the main thread
  self->PostMessage(self->result_);  //HACK: result is type pepper, not python
}

void* HelloWorldInstance::RunPython(void* self_) {
  HelloWorldInstance* self = static_cast<HelloWorldInstance*>(self_);

  // Actually run the python.
  pp::Var result(GetResult(self->python_code_));

  self->result_ = result; //HACK: pass the result back to the main thread
  // PostMessage fails silently in all threads but the main :-(
  pp::Module::Get()->core()->CallOnMainThread(0, pp::CompletionCallback(
      &PostMessageResult, self));
  pthread_exit(NULL);
  return NULL;
}

void HelloWorldInstance::HandleMessage(const pp::Var& var_message) {
  if (!var_message.is_string()) {
    // HACK: SendError('Invalid message: not a string')
    return;
  }
  std::string message = var_message.AsString();
  if (message.find(kMsgRun) == 0) {
    // The argument is everything after the first ':'.
    size_t sep_pos = message.find_first_of(kMessageArgumentSeparator);
    if (sep_pos != std::string::npos) {
      std::string string_arg = message.substr(sep_pos + 1);
      //HACK: should check if thread is already running.
      python_code_ = string_arg; // HACK: better way to pass arg?
      pthread_create(&python_thread_, NULL, RunPython, this);
    }
  } else {
    // HACK: SendError('unknown msg');
  }
}

/// The Module class.  The browser calls the CreateInstance() method to create
/// an instance of your NaCl module on the web page.  The browser creates a new
/// instance for each <embed> tag with
/// <code>type="application/x-nacl"</code>.
class HelloWorldModule : public pp::Module {
 public:
  HelloWorldModule() : pp::Module() {}
  virtual ~HelloWorldModule() {}

  /// Create and return a HelloWorldInstance object.
  /// @param[in] instance a handle to a plug-in instance.
  /// @return a newly created HelloWorldInstance.
  /// @note The browser is responsible for calling @a delete when done.
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new HelloWorldInstance(instance);
  }
};
}  // namespace hello_world


namespace pp {
/// Factory function called by the browser when the module is first loaded.
/// The browser keeps a singleton of this module.  It calls the
/// CreateInstance() method on the object you return to make instances.  There
/// is one instance per <embed> tag on the page.  This is the main binding
/// point for your NaCl module with the browser.
/// @return new HelloWorldModule.
/// @note The browser is responsible for deleting returned @a Module.
Module* CreateModule() {
  return new hello_world::HelloWorldModule();
}
}  // namespace pp
