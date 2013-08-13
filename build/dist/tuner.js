(function (global) {


/*
 * Copyright (c) 2013 Csernik Flaviu Andrei
 *
 * See the file LICENSE.txt for copying permission.
 * 
 */

"use strict";

window.AudioContext = window.AudioContext || window.webkitAudioContext;

function PropertyNotInitialized(obj, propName) {
  this.property = propName;
  this.obj      = obj;
}

PropertyNotInitialized.prototype.toString = function () {
  return this.obj + " : " + this.property + " not initialized.";
};

function isInteger(n) {
   return typeof n === "number" && Math.floor(n) == n;
}

function checkNat(callerName, n) {

  if (isInteger) {
    if (value <= 0) {
      throw new RangeError("downsampleFactor must be a positive." +
                           "given number is not: " + value);
    }
  } else {
    throw new TypeError("downsampleFactor accepts an integer but" +
                        "given type is " + typeof value);
  }

}

var Ring = (function () {

  function IndexOutOfBounds(maxIndex, requestedIndex, method) {
    this.maxIndex       = maxIndex;
    this.requestedIndex = requestedIndex;
    this.method         = method;
  }

  IndexOutOfBounds.prototype.toString = function () {
    return "Invalid index in method ['" + this.method + "']\n" +
           "Requested index    : " + this.requestedIndex +
           "\nValid _buffer index : [0.." + this.maxIndex + "]";
  };

  function ImproperBlockLength(ringBlockLength, givenBlockLength) {
    this.ringBlockLength  = ringBlockLength;
    this.givenBlockLength = givenBlockLength;
  }

  ImproperBlockLength.prototype.toString = function () {
    return "Block length mismatch.\n" +
           "Requeste block length : " + this.givenBlockLength + "\n" +
           "Valid block length    : " + this.ringBlockLength;
  };

  function Ring(len, blockLen) {
    
    var length      = len
      , maxIndex    = length - 1
      , start       = 0
      , buffer      = new Float32Array(length)
      , blockLength = 0;

    /* blockLength should always be a factor of size.
     * An exception is thrown if it's not;
     */
    blockLength = 0;

    if (blockLen) {

      if (len % blockLen !== 0) {
        throw "Block length must be a factor of length.";
      }

      blockLength = blockLen;

    }

    Object.defineProperties(this,{
        "length" : {
            value        : length
          , enumerable   : true
          , configurable : false
          , writable     : false
        }
      , "blockLength" : {
            value        : blockLength
          , enumerable   : true
          , configurable : false
          , writable     : false
      }
    });

    Object.defineProperties(Ring.prototype, {
        "get" : {
            value : function (index) {
              checkBounds(index, maxIndex, 'get');

              return buffer[relativeIndex(index, start, length)];
            }
          , enumerable   : true
          , configurable : false
          , writable     : false
        }
      , "set" : {
           value : function (index, value) {

             checkBounds(index, maxIndex, 'set');

             buffer[relativeIndex(index, start, length)] = value;
           }
         , enumerable   : true
         , configurable : false
         , writable     : false
        }
      , "concat" : {
            value : function (arr) {

              var alen = arr.length
                , nlen = start + alen;

              if (alen !== blockLength) {
                throw new ImproperBlockLength(blockLength, alen);
              }

              buffer.set(arr, start);

              if (start + alen >= length) {
                  start = 0;
              } else {
                  start = nlen;
              }
            }
          , enumerable   : true
          , configurable : false
          , writable     : false
        }
      , "map" : {
            value : function (callback) {

              var relIndex
                , value
                , i;

              for (i = 0; i < length; i += 1) {
                relIndex = relativeIndex(i, start, length);
                value = buffer[relIndex];

                buffer[relIndex] = callback(value, i, length);
              }
            }
          , enumerable   : true
          , configurable : false
          , writable     : false
      }
    });
  }

function checkBounds(requested, maxIndex, callerName) {

  if (requested < 0 || requested > maxIndex) {
    throw new IndexOutOfBounds(maxIndex, requested, callerName);
  }
}

function relativeIndex(index, start, length) {
  return (start + index) % length;
}

  return Ring;

}());

var FrequencyMap = (function () {

  /* 12-TET(12 Tone Equal Tempered scale */
  /* reference frequency default is A4 440 Hz*/

  var notesDiez  = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    , notesBemol = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
    , trtwo      = Math.pow(2, 1 / 12)
    ;

  function populateFrequencyMap(reference, length) {

    var frequencyMap = []
      , i
      ;

    for (i = 1; i <= length; i += 1) {

      frequencyMap[i - 1] = {
        frequency : reference * Math.pow(trtwo, i - 49),
        name      : notesDiez[(i + 8) % 12] + Math.floor((i + 8) / 12)
      };
    }

    return frequencyMap;
  }

  function FrequencyMap() {

    var _A4     = 440
      , _length = 88
      , _frequencyMap = populateFrequencyMap(_A4, _length);

    Object.defineProperties(this, {
        "A4" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _A4;
          }
          , set : function (value) {

              checkNat("A4", value);

              _A4 = value;

              _frequencyMap = populateFrequencyMap(_A4, _length);

          }
        }
      , "length" : {
          value        : _length
        , enumerable   : true
        , configurable : false
        , writable     : false
      }
      , "frequencyMap" : {
          value        : _frequencyMap
        , enumerable   : true
        , configurable : false
        , writable     : false
      }
    });
  }

  Object.defineProperty(FrequencyMap.prototype, "closestNote", {
      value : function (freq) {
        /* Do a binary search on the frequency array and
         * return closest match;
         */

        if (!this.A4) {
          throw new ReferenceError("Please set a reference frequency on the " +
                                    "FrequencyMap object.");
        }

        var closestNote = this.frequencyMap[0]
          , min = 0
          , max = this.length - 1
          , mid = 0
          , midFreq = 0
          ;

        while (min <= max) {

          mid     = (max + min) >> 1;
          midFreq = this.frequencyMap[mid].frequency;

          if (midFreq < freq) { min = mid + 1; }
          if (midFreq > freq) { max = mid - 1; }

        }

        var succ  = mid + 1
          , pred  = mid - 1
          , midDiff   = Math.abs(freq - midFreq)
          , succFreq  = 0
          , succDiff  = 0
          , predFreq  = 0
          , predDiff  = 0
          ;

        if (succ >= 0 && succ < this.length) {
          succFreq = this.frequencyMap[succ].frequency;
          succDiff = Math.abs(freq - succFreq);
        }

        if (pred >= 0 && pred < this.length) {
          predFreq = this.frequencyMap[pred].frequency;
          predDiff = Math.abs(freq - predFreq);
        }

        if (succFreq && (midDiff > succDiff)) {
          closestNote = this.frequencyMap[mid + 1];
        } else if (predFreq && (midDiff > predDiff)) {
          closestNote = this.frequencyMap[mid - 1];
        } else {
          closestNote = this.frequencyMap[mid];
        }

        var cents = 1200 * (Math.log(freq / closestNote.frequency) / Math.log(2));

        var note = {
            "note"      : closestNote
          , "cents"     : cents
          , "frequency" : freq
        };

        return note;

      }
    , enumerable   : true
    , configurable : false
    , writable     : false
  });

  return FrequencyMap;

}());

var WindowObject = (function () {

  var twoPI = 2 * Math.PI;

  function windowHann(i, length) {

    return 0.5 * (1 - Math.cos(twoPI * i / (length - 1)));

  }

  function windowHamming(i, length) {

    return 0.54 - 0.46 * Math.cos(twoPI * i / (length - 1));

  }

  function selectWindowFunctionType(type) {

    switch (type) {
    case "Hamming":
      return windowHamming;
    case "Hann":
      return windowHann;
    case undefined:
      throw new ReferenceError("No window function type selected.");
    default:
      throw new ReferenceError("Unknown window function " + type);
    }
  }

  function WindowFunction(tp, len) {

    var _type          = tp
      , _length        = len
      , values         = new Float32Array(_length)
      , windowFunction = selectWindowFunctionType(_type)
      , i
      ;

    for (i = 0; i < _length; i += 1) {
      values[i] = windowFunction(i, _length);
    }

    Object.defineProperties(this, {
        "type" : {
            enumerable   : true
          , configurable : false
          , get : function () {

              if (!_type) {
                throw new PropertyNotInitialized("WindowFunction", "type");
              }

              return _type;
          }
          , set : function (tp) {

              var i;

              _type = tp;
              windowFunction = selectWindowFunctionType(tp);

              if (_length) {
                for (i = 0; i < _length; i += 1) {
                  values[i] = windowFunction(i, _length);
                }
              } else {
                throw new PropertyNotInitialized("WindowFunction", "length");
              }
          }
      }
      , "length" : {
            enumerable   : true
          , configurable : false
          , get : function () {

              if (!_length) {
                throw new PropertyNotInitialized("WindowFunction", "length");
              }

              return _length;
            }
          , set : function (value) {

              var i;

              _length = value;
              values  = new Float32Array(_length);

              if (_type) {
                for (i = 0; i < _length; i += 1) {
                  values[i] = windowFunction(i, _length);
                }
              } else {
                throw new PropertyNotInitialized("WindowFunction", "type");
              }
         }
      }
    });

    Object.defineProperty(WindowFunction.prototype, "process", {
        value : function (buffer) {

          if (!_length) {
            throw new PropertyNotInitialized("WindowFunction", "length");
          }

          if (!_type) {
            throw new PropertyNotInitialized("WindowFunction", "type");
          }

          if (buffer.length !== _length) {
            throw new TypeError("Given buffer is not the same length as" +
                                " the length property of WindowFunction." +
                                "\nExpected : " + _length +
                                "\nGiven    : " + buffer.length
                                );
          }

          buffer.map(function (v, i) { return v * values[i]; });

      }
      , enumerable   : true
      , configurable : false
      , writable     : false
    });
  }

  return WindowFunction;

}());

function HPS(spectrum, harmonics) {

  var peek = 1
    , i
    , j
    ;

  for (i = 1; i <= (spectrum.length/harmonics); i += 1) {

    for (j = 1; j < harmonics; j += 1) {
      spectrum[i] *= spectrum[i * j];
    }

    if (spectrum[i] > spectrum[peek]) {
      peek = i;
    }

  }

  return peek;
}

var Tuner = (function () {

  function Tuner(callback) {

    if (Tuner.prototype._instance) {
      return Tuner.prototype._instance;
    }

    Tuner.prototype._instance = this;

    var context              = new AudioContext()
      , _samplerate          = 44100
      , _downsampleFactor    = 12
      , _fftSize             = 2048
      , _effectiveSamplerate = _samplerate / _downsampleFactor
      , _frequencyResolution = _effectiveSamplerate / _fftSize
      , _bufferSize          = _fftSize * _downsampleFactor
      , _temporalWindow      = _bufferSize / _samplerate
      , _harmonics           = 5
      , _maxHarmFrequency    = _fftSize / _harmonics * _frequencyResolution
      , fft                  = new FFT(_fftSize, _effectiveSamplerate)
      , samples              = new Ring(_bufferSize, 512)
      , _windowFunction      = new WindowObject("Hann", _bufferSize)
      , _frequencyMap        = new FrequencyMap()
      , _viewCallback
      ;

    var source
      , lowpass
      , highpass
      , processor
      ;

    Object.defineProperties(this, {
        "setAudioStream": {
            enumebrable  : false
          , configurable : false
          , set: function (stream) {
              source    = context.createMediaStreamSource(stream);
              lowpass   = context.createBiquadFilter();
              highpass  = context.createBiquadFilter();
              processor = context.createScriptProcessor(512,1,1);

              lowpass.type       = "lowpass";
              highpass.type      = "highpass";
              lowpass.frequency  = (_effectiveSamplerate / 2).toFixed(3);
              highpass.frequency = 35;
          }
        },
        "samplerate" : {
            value        : _samplerate
          , enumerable   : true
          , configurable : false
          , writable     : false
        }
      , "viewCallback" : {
            enumerable   : false
          , configurable : false
          , set : function (clbk) {
            _viewCallback = clbk;
          }
        }
      , "downsampleFactor" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _downsampleFactor;
            }
          , set : function (value) {

              checkNat("downsampleFactor",value);

              _downsampleFactor = Math.floor(value);

              _effectiveSamplerate = _samplerate / _downsampleFactor;
              _frequencyResolution = _effectiveSamplerate / _fftSize;
              _bufferSize       = _fftSize * _downsampleFactor;
              _temporalWindow   = _bufferSize / _samplerate;
              _maxHarmFrequency = _fftSize / _harmonics * _frequencyResolution;

              fft     = new FFT(_fftSize, _effectiveSamplerate);
              samples = new Ring(_bufferSize, 512);

              lowpass.frequency  = (_effectiveSamplerate / 2).toFixed(3);

              _windowFunction.length = _bufferSize;
            }
        }
      , "fftSize" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _fftSize;
            }
          , set : function (value) {
              _fftSize = value;

              _frequencyResolution = _effectiveSamplerate / _fftSize;
              _bufferSize       = _fftSize * _downsampleFactor;
              _temporalWindow   = _bufferSize / _samplerate;
              _maxHarmFrequency = _fftSize / _harmonics * _frequencyResolution;

              /* this will throw an exception if the fft size is not valid */
              fft     = new FFT(_fftSize, _effectiveSamplerate);
              samples = new Ring(_bufferSize, 512);

              _windowFunction.length = _bufferSize;
            }
        }
      , "effectiveSamplerate" : {
            enumerable   : true
          , configurable : false
          , get : function () {
            return _effectiveSamplerate;
            }
        }
      , "frequencyResolution" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _frequencyResolution;
            }
        }
      , "temporalWindow" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _temporalWindow;
            }
        }
      , "frequencyMap" : {
            enumerable   : false
          , configurable : false
          , get : function () {
              return _frequencyMap;
            }
          , set : function (freqMap) {
              
              if (freqMap.hasOwnProperty("closestNote")) {
                _frequencyMap   = freqMap;
              } else {
                throw new TypeError("Passed object has to have a " +
                                    "a method named closestNote");
              }
            }
        }
      , "harmonics" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _harmonics;
            }
          , set : function (value) {

              checkNat("downsampleFactor",value);

              _harmonics        = value;
              _maxHarmFrequency = _fftSize / _harmonics * _frequencyResolution;

            }
        }
      , "maxDetectableFundamental" : {
            enumerable   : true
          , configurable : false
          , get : function () {
              return _maxHarmFrequency;
          }
      }
    });

    Object.defineProperties(Tuner.prototype, {
        "fundamental" : {
            value : function () {

              var downsampled = []
                , spectrum
                , peek
                , i
                ;

              _windowFunction.process(samples);

              for (i = 0; i < samples.length ; i += _downsampleFactor) {
                downsampled.push(samples.get(i));
              }

              fft.forward(downsampled);

              spectrum = fft.spectrum;
              peek     = HPS(spectrum,_harmonics);

              _viewCallback({
                  peek : _frequencyMap.closestNote(peek * _frequencyResolution),
                  spectrum : spectrum
              });
            }
          , enumerable   : false
          , configurable : false
          , writable     : false
        }
      , "run" : {
            value : function () {

              if (!source) {
                throw new ReferenceError("The audio stream is not set.");
              }

              if (!_viewCallback) {
                throw new PropertyNotInitialized("Tuner", "callback");
              }

              processor.onaudioprocess = function (event) {
                var input = event.inputBuffer.getChannelData(0);

                samples.concat(input);

                event.outputBuffer.getChannelData(0).set(input);
              };

              source.connect(lowpass);
              lowpass.connect(highpass);
              highpass.connect(processor);
              processor.connect(context.destination);

              return window.setInterval(this.fundamental,
                                      _temporalWindow.toFixed(3) * 1000);

            }
          , enumerable   : false
          , configurable : false
          , writable     : false
        }
    });

  }

  return Tuner;
}());
global.Tuner = Tuner;
}(window));
