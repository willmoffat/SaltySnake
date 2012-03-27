# Build JsPy - A Javascript/Python Native Client Module.

ifndef PROJECT
  $(error PROJECT must be defined)
endif

# TODO: There must be better ways to factor out the host and target architectures.

UNAME := $(shell uname)
ifeq ($(UNAME), Linux)
  HOST_ARCH=linux
else ifeq ($(UNAME), Darwin)
  HOST_ARCH=mac
else
  $(error unknown os $(UNAME))
endif

# For pepper16 - newlib

BIN=$(PROJECT)/nacl_sdk/pepper_16/toolchain/$(HOST_ARCH)_x86_newlib/bin
RUN=$(PROJECT)/nacl_sdk/pepper_16/toolchain/$(HOST_ARCH)_x86_newlib/runtime

CXX=$(BIN)/i686-nacl-g++

LIB_PY32=$(PROJECT)/py32/lib/libpython2.7.a
LIB_PY64=$(PROJECT)/py64/lib/libpython2.7.a

# There is no diff between py32/include and py64/include.
PY_INCLUDE=$(PROJECT)/py32/include/python2.7

# TODO: make a proper makefile with clean dependencies etc.

runtest64: test_python_64
	$(BIN)/ncval_x86_64 build_test/test_python_x86_64.nexe
	$(BIN)/sel_ldr_x86_64 -B $(RUN)/irt_core_x86_64.nexe build_test/test_python_x86_64.nexe

runtest32: test_python_32
	$(BIN)/ncval_x86_32 build_test/test_python_x86_32.nexe
	$(BIN)/sel_ldr_x86_32 -B $(RUN)/irt_core_x86_32.nexe build_test/test_python_x86_32.nexe

# Pass --strip-all to the linker to half output size.
jspy64:
	$(CXX) jspy.cc -m64 -Wl,--strip-all -o build/jspy_x86_64.nexe -lppapi -lppapi_cpp -I$(PY_INCLUDE) $(LIB_PY64) -lnosys
jspy32:
	$(CXX) jspy.cc -m32 -Wl,--strip-all -o build/jspy_x86_32.nexe -lppapi -lppapi_cpp -I$(PY_INCLUDE) $(LIB_PY32) -lnosys


test_python_32:
	$(CXX) test_python.cc -m32 -o build_test/test_python_x86_32.nexe -I$(PY_INCLUDE) $(LIB_PY32) -lnosys
test_python_64:
	$(CXX) test_python.cc -m64 -o build_test/test_python_x86_64.nexe -I$(PY_INCLUDE) $(LIB_PY64) -lnosys

clean:
	-find . -name "*~" -or -name "*.nexe" | xargs rm -i

