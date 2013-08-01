/*
 * Copyright (c) 2013 Csernik Flaviu Andrei
 *
 * See the file LICENSE.txt for copying permission.
 * 
 */

window.requestAnimationFrame =
    window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

/* default color scheme */
var green = "rgb(122,153,66)";
var black = "rgb(58,58,58)";
var lightBlack = "rgba(58,58,58, 0.2)";
var white = "rgb(227,227,227)";
var red   = "rgb(140,46,46)";
var blue  = "rgb(44,114,158)";

var ViewContextAndStyle = (function () {

  var defaultPeek = {
      note : {
        name : "I",
        frequency : 0.00
      },
      cents : 0,
      frequency : 0.00
  };

  function ViewContextAndStyle (containerID) {

    var _cvs = document.createElement("canvas");
    _cvs.id = "gtunerView";

    document.getElementById(containerID).appendChild(_cvs);

    var _ctx = _cvs.getContext("2d");

    var _peek  = defaultPeek;
    var _color = black;

    _ctx.fillStyle   = _color;
    _ctx.strokeStyle = _color;

    var _tunedColor    = green;
    var _notTunedColor = red;

    var _noteFontSize = 50;
    var _freqFontSize = 20;
    var _noteFontName = "sans-serif";
    var _freqFontName = "sans-serif";
      
    var _noteFont = _noteFontSize + "px " + _noteFontName;
    var _freqFont = _freqFontSize + "px " + _freqFontName;

    Object.defineProperties(this, {
      "cvs" : {
        value        : _cvs,
        configurable : false,
        enumerable   : false,
        writable     : false
      },
      "ctx" : {
        value        : _ctx,
        configurable : false,
        enumerable   : false,
        writable     : false
      },
      "peek" : {
        value        : _peek,
        configurable : false,
        enumerable   : true,
        writable     : true
      },
      "color" : {
        configurable : false,
        enumerable   : true,
        get : function () {
          return _color;
        },
        set : function (value) {
          _color = value;

          _ctx.fillStyle   = _color;
          _ctx.strokeStyle = _color;
        }
      },
      "tunedColor" : {
        configurable : false,
        enumerable   : true,
        get : function () {
          return _tunedColor;
        },
        set : function (value) {
          _tunedColor = value;
        }
      },
      "notTunedColor" : {
        configurable : false,
        enumerable   : true,
        get : function () {
          return _notTunedColor;
        },
        set : function (value) {
          _nottunedColor = value;
        }
      },
      "noteFont" : {/* TODO : throw exception when someone tries to set */
        configurable : false,
        enumerable   : false,
        get          : function () {
          return _noteFont;
        }
      },
      "freqFont" : {
        configurable : false,
        enumerable   : false,
        get          : function () {
          return _freqFont;
        }
      },
      "noteFontSize" : {
        configurable : false,
        enumerable   : true,
        set          : function (val) {
          _noteFontSize = val;
          _noteFont = _noteFontSize + "px " + _noteFontName;
        },
        get          : function () {
          return _noteFontSize;
        }
      },
      "freqFontSize" : {
        configurable : false,
        enumerable   : true,
        set          : function (val) {
          _freqFontSize = val;
          _freqFont = _freqFontSize + "px " + _freqFontName;
        },
        get          : function () {
          return _freqFontSize;
        }
      },
      "noteFontName" : {
        configurable : false,
        enumerable   : true,
        set          : function (val) {
          _noteFontName = val;
          _noteFont = _noteFontSize + "px " + _noteFontName;
        },
        get          : function () {
          return _noteFontName;
        }
      },
      "freqFontName" : {
        configurable : false,
        enumerable   : true,
        set          : function (val) {
          _freqFontName = val;
          _freqFont = _freqFontSize + "px " + _freqFontName;
        },
        get          : function () {
          return _freqFontName;
        }
      }
    });
  }

  return ViewContextAndStyle;

}());var SimpleView = (function (containerID) {

  function SimpleView() {

    ViewContextAndStyle.apply(this, arguments);

    var _width  = 400;
    var _height = 200;

    this.cvs.width  = _width;
    this.cvs.height = _height;

    var xpad = 10;
    var ypad = 10;

    this.noteFontSize = _height - 2 * ypad; 
    this.freqFontSize = 0.2 * _height;

    var semiMajorAxis = _width / 6;
    var semiMinorAxis = _height / 3;

    var cx = _width / 2;
    var cy = _height / 2;
    var x  = _width - (semiMajorAxis + 2 * xpad);

    var verticalSepX  = cx + xpad;
    var verticalSepBY = _height - ypad;
    var horizontalSepY = this.noteFontSize + 2 * ypad;

    var noteFontMaxWidth = cx - xpad;

    Object.defineProperties(this, {
      "width" : {
        enumerable   : true,
        configurable : false,
        get          : function () {
          return _width;
        },
        set          : function (val) {
          _width = val;

          this.cvs.width = _width;
          semiMajorAxis  = _width / 6;

          cx = _width / 2;
          x  = _width - (semiMajorAxis + xpad);
          noteFontMaxWidth = cx - xpad;
          verticalSepX     = cx + xpad;
        }
      },
      "height" : {
        enumerable   : true,
        configurable : false,
        get          : function () {
          return _height;
        },
        set          : function (val) {
          _height = val;

          cy              = _height / 2;
          this.cvs.height = _height;
          semiMinorAxis   = _height / 3;
          verticalSepBY   = _height - ypad;
          horizontalSepY  = this.noteFontSize + 2 * ypad;

          this.noteFontSize = 0.6 * _height; 
          this.freqFontSize = 0.2 * _height;
        }
      }
    });
    
    Object.defineProperties(SimpleView.prototype, {
      "drawArrow" : {
        value        : function (direction) {

          var y = cy + (this.freqFontSize / 2 * direction); 
          var dir    = semiMinorAxis * direction;
          var rpoint = y + (dir / 2);

          this.ctx.beginPath();

          this.ctx.moveTo(x - semiMajorAxis,y);
          this.ctx.lineTo(x,y + dir);
          this.ctx.lineTo(x + semiMajorAxis, y);
          this.ctx.bezierCurveTo(x, rpoint, x, rpoint, x - semiMajorAxis, y);

          this.ctx.fill();
        },
        enumerable   : false,
        configurable : false,
        writable     : false,
      },
     "drawNoteName" : {
       value        : function () {

         this.ctx.save();

         this.ctx.textAlign    = 'left';
         this.ctx.textBaseline = 'middle';
         this.ctx.font         = this.noteFont;

         this.ctx.fillText(this.peek.note.name, xpad, cy, noteFontMaxWidth);

         this.ctx.restore();
       },
       enumerable   : false,
       configurable : false,
       writable     : false
     },
     "drawFrequency" : {
       value        : function () {

         var cents = Math.abs(this.peek.cents);

         this.ctx.save();

         this.ctx.fillStyle = cents - 5 <= 5 ? this.tunedColor : this.notTunedColor; 

         this.ctx.textAlign    = 'center';
         this.ctx.textBaseline = 'middle';
         this.ctx.font         = this.freqFont;

         this.ctx.fillText(this.peek.frequency.toFixed(2), x, cy);

         this.ctx.restore();
       },
       enumerable   : false,
       configurable : false,
       writable     : false
     },
     "drawSeparator" : {
       value        : function (x0, y0, x1, y1) {

         this.ctx.save();

         this.ctx.beginPath();

         this.ctx.moveTo(x0, y0);
         this.ctx.lineTo(x1, y1);

         this.ctx.strokeStyle = lightBlack;
         this.ctx.lineCap = "round";

         this.ctx.stroke();

         this.ctx.restore();
       },
       enumerable   : false,
       configurable : false,
       writable     : false
     },
     
     "run" : {
       value        : function () {

         var cents   = this.peek.cents;
         var tuneDir = cents > 0 ? 1 : -1;

         this.ctx.clearRect(0, 0, _width, _height);

         this.drawSeparator(verticalSepX, ypad, verticalSepX, verticalSepBY);
         this.drawArrow(tuneDir);
         this.drawFrequency();
         this.drawNoteName();

         window.requestAnimationFrame(this.run.bind(this));
       },
       enumerable   : false,
       configurable : false,
       writable     : false
     },
     "update" : {
       value        : function (element) {
         this.peek = element.peek;
       },
       enumerable   : true,
       configurable : false,
       writable     : false
     }
    });
  }

  if (!this.instance) {
    this.instance = new SimpleView(containerID);
  } else {
    console.log("An instance of SimpleView already exists.");
  }

  return this.instance;

});var CentsGauge = (function (containerID) {

  function CentsGauge() {

    ViewContextAndStyle.apply(this,arguments);

    var _width  = 400
      , _height = 200
      ;
    
    this.cvs.width  = 400;
    this.cvs.height = 200;

    var centerX       = this.cvs.width / 2
      , centerY       = this.cvs.height
      , radius        = 160
      , circumference = 2 * Math.PI * radius
      , quadrantArc   = circumference / 4
      , dotRadius     = 3
      , zeroDotRadius = 5
      , markStep      = 50
      ;

    Object.defineProperties(this, {
        "width" : {
          enumerable   : true
        , configurable : false
        , get : function () {
            return _width;
          }
        , set : function (val) {
            _width = val;

            this.cvs.width = _width;
            centerX  = this.cvs.width / 2;

          }
        }
      , "height" : {
          enumerable   : true
        , configurable : false
        , get : function () {
            return _height;
          }
        , set : function (val) {
            _height = val;

            this.cvs.height = _height;
            centerY   = this.cvs.height;
          }
        }
      , "dotRadius" : {
           value        : dotRadius
         , configurable : false
         , enumerable   : true
         , writable     : true
        }
      , "zeroDotRadius" : {
           value        : zeroDotRadius
         , configurable : false
         , enumerable   : true
         , writable     : true
        }
      , "markStep" : {
          value        : markStep
        , configurable : false
        , enumerable   : true
        , writable     : true
        }
      , "radius" : {
          enumerable   : true
        , configurable : false
        , get          : function () {
            return radius;
          }
        , set : function (r) {
            radius = r;

            circumference = 2 * Math.PI * radius;
            quadrantArc   = circumference / 4;
        }
      }
    });

    Object.defineProperties(CentsGauge.prototype, {
        "background" : {
          value : function() {

            var arc;

            this.ctx.beginPath();
            this.ctx.arc(centerX,centerY,10,0,Math.PI,true);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();

            for (arc = 0; arc <= circumference / 2; arc += markStep) {
              var markRadius = dotRadius;
              var fillStyle  = this.color;

              this.ctx.beginPath();
              var alfa = arc / radius;

              if (arc == quadrantArc){
                markRadius = zeroDotRadius;
              }

              var x = centerX - radius * Math.cos(alfa);
              var y = centerY - radius * Math.sin(alfa);

              this.ctx.arc(x,y,markRadius,0,2*Math.PI,true);
              this.ctx.fillStyle = fillStyle;
              this.ctx.fill();
            }
          }
        , enumerable   : false
        , configurable : false
        , writable     : false
        }
      , "run" : {
          value : function() {

            var arc  = quadrantArc - this.peek.cents
              , alfa = arc / radius
              , x = centerX + radius * Math.cos(alfa)
              , y = centerY - radius * Math.sin(alfa)
              ;

            this.ctx.clearRect(0,0,this.cvs.width,this.cvs.height);

            this.background();

            this.ctx.font      = this.noteFont;
            this.ctx.fillStyle = this.color;
            this.ctx.fillText(this.peek.note.name,20,50);

            this.ctx.font = this.freqFont;
            this.ctx.fillText(this.peek.frequency.toFixed(2) + " Hz",this.cvs.width-110,40);

            this.ctx.beginPath();
            this.ctx.moveTo(centerX,centerY);
            this.ctx.lineTo(x,y);
            this.ctx.strokeStyle = this.color;
            this.ctx.stroke();

            window.requestAnimationFrame(this.run.bind(this));
          }
        , enumerable   : false
        , configurable : false
        , writable     : false
        }
      , "update" : {
          value : function (element) {

            this.peek = element.peek;

          }
        , enumerable   : false
        , configurable : false
        , writable     : false
        }
      }
    );
  };

  if (!this.instance) {
    this.instance = new CentsGauge(containerID);
  } else {
    console.log("An instance of CentsGauge already exists.");
  }

  return this.instance;

});