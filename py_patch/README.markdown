# Building Python for Native Client

If you want to build the NaCl modules yourself...
Otherwise just skip to the fun part: Calling Python from JavaScript.

    export PROJECT=$HOME/SaltySnake
    cd $PROJECT

## Related work:
* [lackingrhoticity](http://lackingrhoticity.blogspot.com/2009/06/python-standard-library-in-native.html) ([code](http://plash.beasts.org/wiki/NativeClient)). Got python running but this predates Chrome's PPAPI interface and the sandbox.
* Cross-compiling patch based on http://randomsplat.com/id5-cross-compiling-python-for-embedded-linux.html.

## Amazon Linux box.
If you don't have your own linux box.

* TODO: how to setup amazon instance + os ??
* TODO: check this all still works on amazon
    sudo yum install make gcc patch

## Download [nacl_sdk](https://developers.google.com/native-client/sdk/download])

    cd $PROJECT
    curl -O http://commondatastorage.googleapis.com/nativeclient-mirror/nacl/nacl_sdk/nacl_sdk.zip
    unzip nacl_sdk.zip 
    cd nacl_sdk
    ./naclsdk update

Should install pepper_16. For some reason, if you run update again it adds pepper_18.

Note: consider building and testing the examples.

## Download Python

    cd $PROJECT

    curl -O http://www.python.org/ftp/python/2.7.2/Python-2.7.2.tar.bz2
    bzip2 -d Python-2.7.2.tar.bz2 
    tar xf Python-2.7.2.tar
    mv Python-2.7.2 python_nacl

    cd python_nacl

    ./configure

Build the host version of python and pgen (parser-generator).
TODO: do we really need hostpython? (just for setup.py?)

    make python
    mv python hostpython
    mv Parser/pgen Parser/hostpgen

As an aside, strace is awesome for finding out which files a process requires: `strace -e trace=open hostpython -c 'print "Hello world"' 2>&1 | grep -v ENOENT`

Apply compliation hacks:

    make distclean
    cp -r $PROJECT/py_patch/* .

* setup.py   - Don't compile modules. TODO: bad hack. Only need side effects.
* Setup.dist - Static compile some modules. TODO: more modules.
* Modules/posixmodule.c - HACK stub out code that won't compile. TODO: look for cleaner version. in py27 port?


## Build x86_32 python

_Install is required for header files. (TODO: And maybe later for modules?)_

    INSTALL_DIR=$PROJECT/py32

    PEPPER_BIN="$PROJECT/nacl_sdk/pepper_16/toolchain/linux_x86_newlib/bin"
    BUILD_PREFIX="${PEPPER_BIN}/i686-nacl-"
    BUILD_ARCH="i686-nacl"
    HOST_ARCH="x86_64-linux-gnu"   # TODO: Depends on your system.

Now configure and install 32-bit python.

    ./configure --prefix=$INSTALL_DIR  --without-threads --disable-shared \
      --host=$HOST_ARCH \
      --build=$BUILD_ARCH \
      LDFLAGS="-static -static-libgcc" CPPFLAGS="-static" LINKFORSHARED="-Xlinker -no-export-dynamic" \
      LDLAST="-lnosys" \
      CC=${BUILD_PREFIX}gcc \
      CXX=${BUILD_PREFIX}g++ \
      AR=${BUILD_PREFIX}ar \
      RANLIB=${BUILD_PREFIX}ranlib \
      ""

    make HOSTPYTHON=./hostpython HOSTPGEN=./Parser/hostpgen BLDSHARED="${BUILD_PREFIX}gcc -static" \
         CROSS_COMPILE=$BUILD_PREFIX CROSS_COMPILE_TARGET=yes HOSTARCH=$HOST_ARCH BUILDARCH=$BUILD_ARCH install

TODOs

* review all of these flags  py27 doesn't use --disable-shared
* is static necessary?
* removed -m32
* -static-libgcc
* OPT    -O2 -DNDEBUG -g -fwrapv -Wall -Wstrict-prototypes"   -Wno-long-long -pthread
* do I need BLDSHARED?
* configure: WARNING: you should use --build, --host, --target
* make use of exec_prefix for architecture-dependant files.



## Build x86_64 python

    INSTALL_DIR=$PROJECT/py64
    BUILD_PREFIX="${PEPPER_BIN}/x86_64-nacl-"
    BUILD_ARCH="x86_64-nacl"

    make distclean

TODO: only difference is -m64

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

TODO: this is the same as last time. Refactor.

    make HOSTPYTHON=./hostpython HOSTPGEN=./Parser/hostpgen BLDSHARED="${BUILD_PREFIX}gcc -static" \
         CROSS_COMPILE=$BUILD_PREFIX CROSS_COMPILE_TARGET=yes HOSTARCH=$HOST_ARCH BUILDARCH=$BUILD_ARCH install

TODO: what is normal solution for multiple architecutres?

## Testing

See the `jspy/` directory for a simple test to check that your NaCl python library works.
