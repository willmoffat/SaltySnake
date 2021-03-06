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

namespace jspy {
/// Method name for HACK, as seen by JavaScript code.
const char* const kMsgRun = "run";
const char* const kMsgStop = "stop";

/// Separator character.
static const char kMessageArgumentSeparator = ':';

// HACK: separate python specific parts.

// catcher code
// Note the hack to subtract the number of lines of this code from tb_lineno.
static char py_wrapper[] = ""
    "import sys  \n"
    ""
    "class Catcher:  \n"
    "  def __init__(self): self.data = ''  \n"
    "  def write(self, d): self.data += d  \n"
    ""
    "sys.stdout, sys.stderr = Catcher(), Catcher()  \n"
    "";

// Get data from Catcher attached to "sys.stdout" or "sys.stderr"
// Returns true if data present.
bool GetStd(char* stream_name, std::string* result) {
  PyObject* py_catcher = PySys_GetObject(stream_name);
  PyObject* py_data    = PyObject_GetAttrString(py_catcher, "data");

  std::string data = PyString_AsString(py_data);

  result->assign(stream_name);
  result->append(":");
  result->append(data);

  return !data.empty();
}

std::string GetResult(const std::string& text) {
  Py_NoSiteFlag = 1;
  Py_Initialize();

  std::string result;
  if (PyRun_SimpleString(py_wrapper) == -1) {
      result = "stderr:Internal error in py_wrapper";
  } else {
      PyRun_SimpleString(text.c_str());
      // Set result to stderr if not empty, otherwise set to stdout. TODO: send both!
      GetStd("stderr", &result) || GetStd("stdout", &result);
  }
  Py_Finalize();
  return result;
}

// HACK: Doc difference between instance and module.
class JsPyInstance : public pp::Instance {
 public:
  explicit JsPyInstance(PP_Instance instance) : pp::Instance(instance) {}
  virtual ~JsPyInstance() {}

  /// Called by the browser to handle the postMessage() call in Javascript.
  /// Detects which method is being called from the message contents, and
  /// calls the appropriate function.  Posts the result back to the browser
  /// asynchronously.
  /// @param[in] var_message The message posted by the browser.
  void HandleMessage(const pp::Var& var_message);
  void StopPython();
  void SendError(const std::string& msg);

 private:
  pthread_t python_thread_; //HACK: needs a mutex to protect it.
  std::string python_code_; // code to execute.
  pp::Var result_; // resulting python output.
  //HACK: must be static?
  static void* RunPython(void* self_);

  static void PostMessageResult(void* data, int32_t result);
};

void JsPyInstance::PostMessageResult(void* self_, int32_t dummy) {
  JsPyInstance* self = static_cast<JsPyInstance*>(self_);
  // we are back in the main thread
  self->PostMessage(self->result_);  //HACK: result is type pepper, not python
}

void* JsPyInstance::RunPython(void* self_) {
  JsPyInstance* self = static_cast<JsPyInstance*>(self_);

  // Actually run the python.
  pp::Var result(GetResult(self->python_code_));

  self->result_ = result; //HACK: pass the result back to the main thread
  // PostMessage fails silently in all threads but the main :-(
  pp::Module::Get()->core()->CallOnMainThread(0, pp::CompletionCallback(
      &PostMessageResult, self));
  pthread_exit(NULL);
  return NULL;
}

// HACK: BUG: aftr stopping first run fails.
int stop_func(void *) {
    PyErr_SetInterrupt();
    return -1;
}

// http://stackoverflow.com/questions/1420957/stopping-embedded-python
void JsPyInstance::StopPython() {
    // Compiled without threads, so no PyGILState.
    // PyGILState_STATE state = PyGILState_Ensure();
    Py_AddPendingCall(&stop_func, NULL);
    // TODO: Call SendError from inside stop_func.
    SendError("Stop");
    // PyGILState_Release(state);
}

// Must only be called on main thread.
void JsPyInstance::SendError(const std::string& msg) {
  std::string err_msg("stderr:");
  err_msg.append(msg);
  pp::Var pp_msg(err_msg);
  PostMessage(pp_msg);
}

void JsPyInstance::HandleMessage(const pp::Var& var_message) {
  if (!var_message.is_string()) {
    SendError("Invalid message: not a string");
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
  }
  else if (message.find(kMsgStop) == 0) {
      // TODO: pthread_create so that long running stop can't block?
      StopPython();
  } else {
    SendError("unknown msg");
  }
}

/// The Module class. Browser creates one singleton.
class JsPyModule : public pp::Module {
 public:
  JsPyModule() : pp::Module() {}
  virtual ~JsPyModule() {}
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new JsPyInstance(instance);
  }
};
}  // namespace jspy


namespace pp {
Module* CreateModule() {
  return new jspy::JsPyModule();
}
}  // namespace pp
