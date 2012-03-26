# HACK TODO fix paths.
# HACK seperate js api out
# HACK symbolic link to jspy?

ifndef PROJECT
  $(error PROJECT must be defined)
endif

JSPY=$(PROJECT)/jspy

# Add the JSPY Nacl module as a flat jspy directory.
# Do not make local chnages to these files!
unpacked_app:
	rm -rf jspy
	mkdir jspy
	cp $(JSPY)/build/*  jspy/
	cp $(JSPY)/jspy.nmf jspy/

EXCLUDE=-x \*~ -x Makefile
release:
	rm -rf app.zip
	zip -r app.zip * $(EXCLUDE)
	ls -lh app.zip
