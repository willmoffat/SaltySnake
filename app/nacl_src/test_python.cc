#include "Python.h"

extern int Py_NoSiteFlag;

int main(int argc, char *argv[])
{
  // Don't stop if site module cannot be found.
  Py_NoSiteFlag = 1;

  Py_Initialize();
  PyRun_SimpleString("print '\\nHello from Nacl Python!\\n'");
  Py_Finalize();

  return 0;
}
