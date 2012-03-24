# $PROJECT must be defined in your environment

# For pepper16 - newlib
BIN=$(PROJECT)/nacl_sdk/pepper_16/toolchain/linux_x86_newlib/bin
RUNTIME=$(PROJECT)/nacl_sdk/pepper_16/toolchain/linux_x86_newlib/runtime

BUILD_PREFIX=$(BIN)/i686-nacl-
CXX=$(BUILD_PREFIX)g++

LIB_PY32=$(PROJECT)/py32/lib/libpython2.7.a
LIB_PY64=$(PROJECT)/py64/lib/libpython2.7.a
PY_INCLUDE=$(PROJECT)/py32/include/python2.7


runtest64: test_python_64
	$(BIN)/ncval_x86_64 build/test_python_x86_64.nexe
	$(BIN)/sel_ldr_x86_64 -B $(RUNTIME)/irt_core_x86_64.nexe build/test_python_x86_64.nexe

runtest32: test_python_32
	$(BIN)/ncval_x86_32 build/test_python_x86_32.nexe
	$(BIN)/sel_ldr_x86_32 -B $(RUNTIME)/irt_core_x86_32.nexe build/test_python_x86_32.nexe

# Pass --strip-all to the linker to half output size.
pepper_py64:
	$(CXX) pepper_py.cc -m64 -Wl,--strip-all -o build/pepper_py_x86_64.nexe -lppapi -lppapi_cpp -I$(PY_INCLUDE) $(LIB_PY64) -lnosys
pepper_py32:
	$(CXX) pepper_py.cc -m32 -Wl,--strip-all -o build/pepper_py_x86_32.nexe -lppapi -lppapi_cpp -I$(PY_INCLUDE) $(LIB_PY32) -lnosys


test_python_32:
	$(CXX) test_python.cc -m32 -o build/test_python_x86_32.nexe -I$(PY_INCLUDE) $(LIB_PY32) -lnosys
test_python_64:
	$(CXX) test_python.cc -m64 -o build/test_python_x86_64.nexe -I$(PY_INCLUDE) $(LIB_PY64) -lnosys

clean:
	-rm -f build/*.nexe *~
