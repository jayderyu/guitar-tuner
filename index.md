---
title    : About
layout   : frontpage
---

#About

gtuner is a simple musical instrument tuner that uses the Web Audio API and canvas support built into the web browser.

For now the project depends on [dsp.js](https://github.com/corbanbrook/dsp.js) to do the fft, but the plan is to write a standalone fft implementation
so that the project can be self-contained.

Support for live audio input is currently broken in Google Chrome for Linux 28-stable and 29-beta.
The demo is working in the latest version of Google Chrome for Windows.

Bare in mind that this is still early development and it is very basic.
If you want to contribute to the project check out the documentation page and then head over to 
the github page and fork the repo, there is still much work that needs to be done.


##Demo

Cents Gauge view is currently broken.  
The tuner is running with the reference frequency set at a standard **A4 440Hz** and the following properties:
