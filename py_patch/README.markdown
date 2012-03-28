# Building Python for Native Client

This page describes how to compile Python using the Native Client toolchain so that libpython.a can be linked into a NaCl module such as JsPy.

_You only need to do this if you want to improve JsPy or build your own NaCl module with Python_

## Limitations

* No file I/O, _which implies..._
* No module support. `import random` will not work.
* Compiles to x86-32 and 64 bit only. _NaCl modules won't run on ARM processors. pNaCl may solve this._
* These patches are a quick hack to get python working. A lot of clean up is necessary. _Pull requests welcome!_

TODO: It should be possible to use the NaclMounts lib in NaclPorts to support File IO. 

## Build Platform

These build instructions assume Linux. (There is a NaCl toolchain for Mac, Linux & Windows. Python should compile on those platforms too. TOODO: support other build platforms).
If you don't have a Linux box lying around, this instructions work fine on the default free Amazon EC2 instance.

Make sure you have these developer tools, for example on Amazon:

    sodo yum install make gcc git openssl098e


## Set `PROJECT` to the SaltySnake directory

    export PROJECT=$HOME/SaltySnake

## Download [nacl_sdk](https://developers.google.com/native-client/sdk/download])

    cd $PROJECT
    curl -O http://commondatastorage.googleapis.com/nativeclient-mirror/nacl/nacl_sdk/nacl_sdk.zip
    unzip nacl_sdk.zip 
    cd nacl_sdk
    ./naclsdk update

Should install pepper_16. _For some reason, if you run update again it adds pepper_18._

_Note: If you have any problems with python below, consider building and testing the nacl_sdk examples._

## Download Python

    cd $PROJECT
    curl -O http://www.python.org/ftp/python/2.7.2/Python-2.7.2.tar.bz2
    bzip2 -d Python-2.7.2.tar.bz2 
    tar xf Python-2.7.2.tar
    mv Python-2.7.2 python_nacl

Build the host version of python and pgen (parser-generator).
TODO: do we really need hostpython? (just for setup.py?)

    cd $PROJECT/python_nacl
    ./configure
    make python

    mv python hostpython
    mv Parser/pgen Parser/hostpgen

_As an aside, strace is awesome for finding out which files a process requires: `strace -e trace=open hostpython -c 'print "Hello world"' 2>&1 | grep -v ENOENT`_

## Apply patches

    cp -r $PROJECT/py_patch/* .

The follow changes where made to the default Python:

* Makefile.pre.in - support cross compiling.
* configure  - support cross compiling.
* Lib/plat-linux3 - HACK: is this required??
* setup.py   - Don't compile any modules.
* Modules/Setup.dist - Static compile some modules.
* Modules/posixmodule.c - Stub out code that won't compile. TODO: Use NaclMounts?


## Build x86_32 python

Use the NaCl toolchain to build and install the 32-bit python:

    INSTALL_DIR=$PROJECT/py32

    PEPPER_BIN="$PROJECT/nacl_sdk/pepper_16/toolchain/linux_x86_newlib/bin"
    BUILD_PREFIX="${PEPPER_BIN}/i686-nacl-"
    BUILD_ARCH="i686-nacl"
    HOST_ARCH="x86_64-linux-gnu"   # TODO: Depends on your system.

    ./configure --prefix=$INSTALL_DIR  --without-threads --disable-shared \
      --host=$HOST_ARCH \
      --build=$BUILD_ARCH \
      BASECFLAGS="-m32" \
      LDFLAGS="-static -static-libgcc" CPPFLAGS="-static" LINKFORSHARED="-Xlinker -no-export-dynamic" \
      LDLAST="-lnosys" \
      CC=${BUILD_PREFIX}gcc \
      CXX=${BUILD_PREFIX}g++ \
      AR=${BUILD_PREFIX}ar \
      RANLIB=${BUILD_PREFIX}ranlib \
      ""

    make HOSTPYTHON=./hostpython HOSTPGEN=./Parser/hostpgen BLDSHARED="${BUILD_PREFIX}gcc -static" \
         CROSS_COMPILE=$BUILD_PREFIX CROSS_COMPILE_TARGET=yes HOSTARCH=$HOST_ARCH BUILDARCH=$BUILD_ARCH install

TODO: review all of these flags, especially --disable-shared, -static-libgcc, -O2 -DNDEBUG -g -fwrapv -Wall -Wstrict-prototypes  -pthread
TODO: do I need BLDSHARED?
TODO: configure: WARNING: you should use --build, --host, --target. make use of exec_prefix for architecture-dependant files.

## Build x86_64 python

We repeat the same process for 64-bit python. The only difference is the install path and the -m64 flag.

    make distclean

    INSTALL_DIR=$PROJECT/py64
    BUILD_PREFIX="${PEPPER_BIN}/x86_64-nacl-"
    BUILD_ARCH="x86_64-nacl"

    ./configure --prefix=$INSTALL_DIR  --without-threads --disable-shared \
      --host=$HOST_ARCH \
      --build=$BUILD_ARCH \
      BASECFLAGS="-m64" \
      LDFLAGS="-static -static-libgcc" CPPFLAGS="-static" LINKFORSHARED="-Xlinker -no-export-dynamic" \
      LDLAST="-lnosys" \
      CC=${BUILD_PREFIX}gcc \
      CXX=${BUILD_PREFIX}g++ \
      AR=${BUILD_PREFIX}ar \
      RANLIB=${BUILD_PREFIX}ranlib \
      ""

    make HOSTPYTHON=./hostpython HOSTPGEN=./Parser/hostpgen BLDSHARED="${BUILD_PREFIX}gcc -static" \
         CROSS_COMPILE=$BUILD_PREFIX CROSS_COMPILE_TARGET=yes HOSTARCH=$HOST_ARCH BUILDARCH=$BUILD_ARCH install

## Testing

See the `jspy/` directory for a simple test to check that your NaCl python library works.

## Related work:
* [lackingrhoticity](http://lackingrhoticity.blogspot.com/2009/06/python-standard-library-in-native.html) ([project](http://plash.beasts.org/wiki/NativeClient)). Got python running but this predates Chrome's PPAPI interface and the sandbox. Could not find build files.
* Cross-compiling patch based on http://randomsplat.com/id5-cross-compiling-python-for-embedded-linux.html.
* Partial port by [ashleyh](https://github.com/ashleyh/zoo/tree/master/naclports/ports/py27).
