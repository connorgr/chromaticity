(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3')) :
	typeof define === 'function' && define.amd ? define(['d3'], factory) :
	(factory(global.d3));
}(this, (function (d3$1) { 'use strict';

var dispatch = d3.dispatch("addSelectedColor", "clearPalette", "deletePaletteColor", "updateGradientColors", "updateJNDParameters", "updateSelectedColor");

function rgb2hex(rgbstr){
  var rgb$$1 = rgbstr.replace("rgb(","").replace(")","").split(",").map(d => +d),
      r = rgb$$1[0], g = rgb$$1[1], b = rgb$$1[2],
      bin = r << 16 | g << 8 | b;
  return (function(h){
      return new Array(7-h.length).join("0")+h;
  })(bin.toString(16).toUpperCase());
}

function ColorPaletteTable(container) {
  this.colorpalettetable = makeColorPaletteTable(container);
}

var makeColorPaletteTable = function(tbl) {
  var makeID = Date.now().toString();

  var inPalette = [];

  var obj = {};

  dispatch.on("addSelectedColor.colorPalette"+makeID, function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
  });

  dispatch.on("clearPalette.colorPalette"+makeID, function() {
    inPalette = [];
    tbl.select("tbody").selectAll("tr").remove();
  });

  dispatch.on("deletePaletteColor.colorPalette"+makeID, function() {
    var idx = inPalette.indexOf(this.color);
    inPalette.splice(idx, 1);
    tbl.select("tbody").selectAll("tr").each(function(d,i) {
      if(i !== idx) return;
      d3$1.select(this).remove();
    });
  });

  obj.addColorToPalette = function(newColor) {
    var jab$$1 = d3$1.jab(newColor),
        lab$$1 = d3$1.lab(newColor),
        rgb$$1 = d3$1.rgb(newColor);

    inPalette.push(rgb$$1.toString());

    var jabstr = "Jab("+[jab$$1.J, jab$$1.a, jab$$1.b].map(Math.round).join(",")+")",
        labstr = "Lab("+[lab$$1.l, lab$$1.a, lab$$1.b].map(Math.round).join(",")+")";

    var newRow = tbl.select("tbody").append("tr");
    newRow.append("td").append("span").classed("deletePaletteTableColor", true)
        .text("×")
        .on("click", function() {
          var swatch = d3$1.select(this.parentNode.parentNode).select(".swatch"),
              color = swatch.style("background-color");
          dispatch.call("deletePaletteColor", {
            color: d3$1.rgb(color).toString()
          });
        });
    tbl.selectAll("tbody input[type=\"radio\"]")
        .property("checked", false);
    newRow.append("td").append("input").attr("type", "radio")
        .property("checked", true).on("click", function() {
          d3$1.selectAll(".paletteTable tbody input[type=\"radio\"]")
              .property("checked", false);
          d3$1.select(this).property("checked", true);
          dispatch.call("updateSelectedColor", {selectedColor: rgb$$1});
        });
    newRow.append("td").classed("swatch", true).style("background", newColor);
    newRow.append("td").text(rgb2hex(newColor));
    newRow.append("td").text(rgb$$1.toString().replace(/\s/g, ""));
    newRow.append("td").text(labstr);
    newRow.append("td").text(jabstr);
  };

  return obj;
};

function ColorPicker(container) {
  this.colorpicker = makeColorPicker(container);
}

var makeColorPicker = function(container) {
  var makeID = Date.now().toString();

  var CHECK_FOR_ND = false,
      COLORPICKER_SPACE = "lab",
      START_COLOR_VALUES = [50,0,0],
      START_COLOR = {
        space: COLORPICKER_SPACE,
        value: START_COLOR_VALUES,
        color: d3$1[COLORPICKER_SPACE].apply(this, START_COLOR_VALUES)
      };

  var CLEAR_COLOR = d3$1.rgb("#282c34");

  var startBarValue;
  if(COLORPICKER_SPACE === "jab") {
    startBarValue = START_COLOR.color.J;
  } else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") {
    startBarValue = START_COLOR.color.l;
  } else {
    startBarValue = START_COLOR.color.r;
  }

  container.select(".selectedColor")
      .style("background", START_COLOR.color.toString());

  updateColorChannelInput(START_COLOR.color.toString());
  renderColorpicker(startBarValue);
  renderColorpicker_bar();

  container.select("#addColorToPaletteBtn")
      .on("click", function() {
        dispatch.call("addSelectedColor", {
          selectedColor: container.select(".selectedColor")
              .style("background-color")
        });
      });

  container.selectAll("#colorspaceSwitcherMenu li").on("click", function() {
    container.selectAll("#colorspaceSwitcherMenu li").classed("active", false);
    d3$1.select(this).classed("active", true);

    var newSpace = d3$1.select(this).attr("data-space");
    if(newSpace !== COLORPICKER_SPACE) {
      COLORPICKER_SPACE = newSpace;

      var selectedColor = container.select(".selectedColor")
              .style("background-color"),
          color = d3$1[COLORPICKER_SPACE](selectedColor),
          barValue;

      if(COLORPICKER_SPACE === "jab") {
        barValue = color.J;
      } else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") {
        barValue = color.l;
      } else {
        barValue = color.r;
      }

      renderColorpicker(barValue);
      renderColorpicker_bar();
      relocateColorpickerBarThumb(barValue);
    }
  });

  container.selectAll(".colorChannelInput")
      .on("focus", storeColorChannelValue)
      .on("blur", triggerColorChannelUpdate);
  container.selectAll(".colorChannelInput[type=\"color\"]")
      .on("change", triggerColorChannelUpdate);
  container.select(".freetextColorInput").on("blur", function() {
    /*eslint-disable*/
    var colorInput = d3$1.rgb(this.value.replace(/\'/g, '').replace(/\"/g,""));
    /*eslint-enable*/
    this.value = "";

    if(Math.isNaN(colorInput.opacity) === false) colorInput.opacity = 1;
    if(colorInput.displayable()) updateColorChannelInput(colorInput.toString());
    else return;

    container.select(".selectedColor").style("background-color", colorInput);

    var barValue;
    if(COLORPICKER_SPACE === "jab") {
      barValue = d3$1.jab(colorInput).J;
    } else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") {
      barValue = d3$1.lab(colorInput).l;
    } else {
      barValue = colorInput.r;
    }

    relocateColorpickerBarThumb(barValue);
  });


  container.select("#colorpicker_square")
      .on("click", function () {
        var mouse$$1 = d3$1.mouse(this),
            context = this.getContext("2d"),
            px = context.getImageData(mouse$$1[0], mouse$$1[1], 1, 1).data,
            rgb$$1 = "rgba("+px.slice(0,4).join(",")+")";
        d3$1.select(".selectedColor").style("background", rgb$$1);
        updateColorChannelInput(rgb$$1);
      })
      .on("mousemove", function() {
        var mouse$$1 = d3$1.mouse(this),
            context = this.getContext("2d"),
            px = context.getImageData(mouse$$1[0], mouse$$1[1], 1, 1).data,
            rgb$$1 = "rgba("+px.slice(0,4).join(",")+")";
        container.select(".hoverColor").style("background", rgb$$1);
        updateColorChannelInputHover(rgb$$1);
      });

  var slider = container.select("#colorpicker_slider"),
      sliderMargin = { top: 10, right: 0, bottom: 10, left: 0 },
      thumb = slider.select(".thumb"),
      sliderHeight = +slider.style("height").replace("px", ""),
      sliderScale = d3$1.scaleLinear().domain([0, sliderHeight-sliderMargin.top]);

  thumb.attr("transform", "translate(0,"+(sliderHeight/2-sliderMargin.top)+")");
  thumb.call(d3$1.drag().on("drag", dragColorpickerSlider));

  var paletteColors = [];
  dispatch.on("addSelectedColor.colorpicker"+makeID, function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(paletteColors.indexOf(rgbstr) > -1) return;
    paletteColors.push(rgbstr);
  });


  dispatch.on("clearPalette.colorpicker"+makeID, function() {
    paletteColors = [];
  });

  dispatch.on("deletePaletteColor.colorpicker"+makeID, function() {
    var idx = paletteColors.indexOf(d3$1.rgb(this.color).toString());
    if(idx < 0) return;
    paletteColors.splice(idx, 1);
  });

  dispatch.on("updateSelectedColor.colorpicker"+makeID, function () {
    var selectedColor = this.selectedColor,
        color = d3$1[COLORPICKER_SPACE](selectedColor),
        barValue;

    if(COLORPICKER_SPACE === "jab") {
      barValue = color.J;
    } else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") {
      barValue = color.l;
    } else if(COLORPICKER_SPACE === "rgb") {
      barValue = color.r;
    }

    container.select(".selectedColor")
        .style("background", color.toString());

    updateColorChannelInput(color.toString());
    renderColorpicker(barValue);
    renderColorpicker_bar();

    relocateColorpickerBarThumb(barValue);
  });


  function relocateColorpickerBarThumb(barValue) {
    if(COLORPICKER_SPACE === "rgb") sliderScale.range([255,0]);
    else sliderScale.range([100,0]);

    var newLoc = d3$1.scaleLinear()
            .domain(sliderScale.range())
            .range(sliderScale.domain())(barValue);
    container.select(".thumb").attr("transform", "translate(0,"+newLoc+")");
  }


  function renderColorpicker(barValue) {
    var colorpicker = d3$1.select("#colorpicker_square").node(),
        context = colorpicker.getContext("2d");

    var height = colorpicker.height,
        width = colorpicker.width,
        img = context.createImageData(width, height);

    var hclScale_hue = d3$1.scaleLinear()
            .domain([0, width])
            .range([359, 0]),
        hclScale_chroma =  d3$1.scaleLinear()
            .domain([height, 0])
            .range([0, 135]);

    var labScale = d3$1.scaleLinear()
            .domain([0, width])
            .range([-115, 115]);

    var jabScale = d3$1.scaleLinear()
            .domain([0, width])
            .range([-45, 45]);

    var nd;

    var c,y,x,i=-1;
    for(y=height;y>0;y--) {
      for(x=width;x>0;x--) {
        nd = true;
        if(CHECK_FOR_ND) {
          nd = paletteColors.reduce(function(nd, rgb$$1) {
                return nd && d3$1.noticeablyDifferent(rgb$$1,c, 0.3);
              }, true);
        }
        if(nd === false) {
          c = CLEAR_COLOR;
        } else if(COLORPICKER_SPACE === "rgb") c = d3$1.rgb(barValue, x, y);
        else {
          if(COLORPICKER_SPACE === "lab") {
            c = d3$1.lab(barValue, -labScale(x), labScale(y));
          } else if(COLORPICKER_SPACE === "hcl") {
            c = d3$1.hcl(hclScale_hue(x), hclScale_chroma(y), barValue);
          } else {
            c = d3$1.jab(barValue, -jabScale(x), jabScale(y));
            // Hack around CIECAM02 out-of-gamut irregularities
            if(  (c.J < 42 && c.b > 25)
              || (c.J < 10 && c.b > 12)
              || (c.J < 4  && c.b > 7)
              || (c.J < 2  && (c.b > 3 || c.a < -8 || c.a > 8)) ) {
                c = CLEAR_COLOR;
            }
          }

          if(c.displayable() === false) c = CLEAR_COLOR;
          else c = d3$1.rgb(c);
        }
        img.data[++i] = c.r;
        img.data[++i] = c.g;
        img.data[++i] = c.b;
        img.data[++i] = 255;
      }
    }
    context.putImageData(img, 0, 0);
  }


  function renderColorpicker_bar() {
    var colorpicker_bar = d3$1.select("#colorpicker_bar").node(),
        context = colorpicker_bar.getContext("2d"),
        height = colorpicker_bar.height,
        width = colorpicker_bar.width,
        img = context.createImageData(1, height);

    var c, x, y, i=-1;
    var barScale = d3$1.scaleLinear()
            .domain([0, height])
            .range(COLORPICKER_SPACE === "rgb" ? [0,255] : [0, 100]);

    for(y=height;y>0;y--) {
      if(COLORPICKER_SPACE === "rgb") c = d3$1.rgb(barScale(y), 0, 0);
      else if(COLORPICKER_SPACE === "hcl") {
        c = d3$1.rgb(d3$1.hcl(0,0,barScale(y)));
      }
      else if(COLORPICKER_SPACE === "lab") {
        c = d3$1.rgb(d3$1.lab(barScale(y), 0, 0));
      } else if(COLORPICKER_SPACE === "jab") {
        c = d3$1.rgb(d3$1.jab(barScale(y), 0, 0));
      }

      img.data[++i] = c.r;
      img.data[++i] = c.g;
      img.data[++i] = c.b;
      img.data[++i] = 255;
    }

    for(x=0;x<width;x++) context.putImageData(img, x, 0);
  }


  function dragColorpickerSlider() {
    if(COLORPICKER_SPACE === "rgb") sliderScale.range([255,0]);
    else sliderScale.range([100,0]);

    var sliderH = sliderHeight - sliderMargin.bottom,
        y;
    if(d3$1.event.y < 0) y = 0;
    else if(d3$1.event.y > sliderH) y = sliderH;
    else y = d3$1.event.y;
    d3$1.select(this).attr("transform", "translate(0,"+y+")");
    renderColorpicker(sliderScale(y));

    var channels = [sliderScale(y)];
    d3$1.selectAll(".colorChannelInput")
        .filter(function() {
          return d3$1.select(this).attr("data-colorType") === COLORPICKER_SPACE;
        }).each(function(d,i) {
          if(i !== 0) channels.push(+this.value);
          else this.value = sliderScale(y);
        });

    var newColor;
    if(COLORPICKER_SPACE !== "hcl"){
      newColor = d3$1[COLORPICKER_SPACE](channels[0], channels[1], channels[2]);
    } else {
      newColor = d3$1[COLORPICKER_SPACE](channels[2], channels[1], channels[0]);
    }
    updateColorChannelInput(newColor);
    d3$1.select(".selectedColor").style("background-color", newColor.toString());
  }


  function updateColorChannelInput(rgbstr) {
    updateColorChannelInput_abstract(rgbstr, ".colorChannelInput");
  }

  function updateColorChannelInputHover(rgbstr) {
    updateColorChannelInput_abstract(rgbstr, ".colorChannelInputHover");
  }

  function updateColorChannelInput_abstract(rgbstr, inputClass) {
    var colors = {
      rgb: d3$1.rgb(rgbstr),
      jab: d3$1.jab(rgbstr),
      lab: d3$1.lab(rgbstr),
      hcl: d3$1.hcl(rgbstr)
    };
    colors.hex = "#"+rgb2hex(colors.rgb.toString());

    d3$1.selectAll(inputClass).each(function() {
      var input = d3$1.select(this),
          colorType = input.attr("data-colorType");

      if(colorType === "hex") {
        input.property("value", colors.hex);
      } else {
        var color = colors[colorType],
            channelValue = Math.round(color[input.attr("data-channel")]);
        if(isNaN(channelValue) === false) input.node().value = channelValue;
        else input.node().value = null;
      }
    });
  }

  var TMP_COLOR_CHANNEL_VALUE;
  function storeColorChannelValue() { TMP_COLOR_CHANNEL_VALUE = this.value; }
  function triggerColorChannelUpdate() {
    if(this.value === "") {
      this.value = TMP_COLOR_CHANNEL_VALUE;
    } else {
      var thisEl = d3$1.select(this),
          colorType = thisEl.attr("data-colorType"),
          rgbstr;
      if(colorType === "hex") rgbstr = d3$1.rgb(this.value).toString();
      else {
        var selector = ".colorChannelInput[data-colorType=\""+colorType+"\"]",
            values = [];
        d3$1.selectAll(selector).each(function() { values.push(this.value); });
        if(colorType !== "hcl") {
          rgbstr = d3$1[colorType](values[0], values[1], values[2]).toString();
        } else {
          rgbstr = d3$1[colorType](values[2], values[1], values[0]).toString();
        }
      }

      updateColorChannelInput(rgbstr);

      d3$1.select(".selectedColor").style("background", rgbstr);
      var color = d3$1[COLORPICKER_SPACE](rgbstr),
          barValue;
      if(COLORPICKER_SPACE === "jab") {
        barValue = color.J;
      } else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") {
        barValue = color.l;
      } else {
        barValue = color.r;
      }

      renderColorpicker(barValue);
      renderColorpicker_bar();
      relocateColorpickerBarThumb(barValue);
    }
  }
};

// The sourcecode of this resource stems from three prior resources:
// skratchdot who built on mudcube who build on work by Mattew Wickline and the
// Human-Computer Interaction Resource Network (all credits found below).
// Skratchdot's implementaiton was a bit cleaner. The only changes I have made
// is to convert his node implementation into a more friendly version for web.

/*
 * color-blind
 * https://github.com/skratchdot/color-blind
 *
 * This source was copied from http://mudcu.be/sphere/js/Color.Blind.js
 *
 * It contains modifications for use in node.js.
 *
 * The original copyright is included below.
 *
 * Copyright (c) 2014 skratchdot
 * Licensed under the MIT license.
 */
/*
    The Color Blindness Simulation function is
    copyright (c) 2000-2001 by Matthew Wickline and the
    Human-Computer Interaction Resource Network ( http://hcirn.com/ ).

    It is used with the permission of Matthew Wickline and HCIRN,
    and is freely available for non-commercial use. For commercial use, please
    contact the Human-Computer Interaction Resource Network ( http://hcirn.com/ ).
  ------------------------
  blind.protan =
  cpu = 0.735; // confusion point, u coord
  cpv = 0.265; // confusion point, v coord
  abu = 0.115807; // color axis begining point (473nm), u coord
  abv = 0.073581; // color axis begining point (473nm), v coord
  aeu = 0.471899; // color axis ending point (574nm), u coord
  aev = 0.527051; // color axis ending point (574nm), v coord
  blind.deutan =
  cpu =  1.14; // confusion point, u coord
  cpv = -0.14; // confusion point, v coord
  abu = 0.102776; // color axis begining point (477nm), u coord
  abv = 0.102864; // color axis begining point (477nm), v coord
  aeu = 0.505845; // color axis ending point (579nm), u coord
  aev = 0.493211; // color axis ending point (579nm), v coord
  blind.tritan =
  cpu =  0.171; // confusion point, u coord
  cpv = -0.003; // confusion point, v coord
  abu = 0.045391; // color axis begining point (490nm), u coord
  abv = 0.294976; // color axis begining point (490nm), v coord
  aeu = 0.665764; // color axis ending point (610nm), u coord
  aev = 0.334011; // color axis ending point (610nm), v coord

  m = (aev - abv) / (aeu - abu); // slope of color axis
  yi = blind[t].abv - blind[t].abu * blind[t].m; // "y-intercept" of axis (on the "v" axis at u=0)
*/

var colorVisionDeficiency = function() {
  var colorProfile = 'sRGB',
      gammaCorrection = 2.2;

  var matrixXyzRgb = [
    3.240712470389558, -0.969259258688888, 0.05563600315398933,
    -1.5372626602963142, 1.875996969313966, -0.2039948802843549,
    -0.49857440415943116, 0.041556132211625726, 1.0570636917433989
  ];

  var matrixRgbXyz = [
    0.41242371206635076, 0.21265606784927693, 0.019331987577444885,
    0.3575793401363035, 0.715157818248362, 0.11919267420354762,
    0.1804662232369621, 0.0721864539171564, 0.9504491124870351
  ];

  // xy: coordinates, m: slope, yi: y-intercept
  var blinder = {
    protan: {
      x: 0.7465,
      y: 0.2535,
      m: 1.273463,
      yi: -0.073894
    },
    deutan: {
      x: 1.4,
      y: -0.4,
      m: 0.968437,
      yi: 0.003331
    },
    tritan: {
      x: 0.1748,
      y: 0,
      m: 0.062921,
      yi: 0.292119
    },
    custom: {
      x: 0.735,
      y: 0.265,
      m: -1.059259,
      yi: 1.026914
    }
  };

  var convertRgbToXyz = function (o) {
    var M = matrixRgbXyz,
        z = {},
        R = o.R / 255,
        G = o.G / 255,
        B = o.B / 255;

    if (colorProfile === 'sRGB') {
      R = (R > 0.04045) ? Math.pow(((R + 0.055) / 1.055), 2.4) : R / 12.92;
      G = (G > 0.04045) ? Math.pow(((G + 0.055) / 1.055), 2.4) : G / 12.92;
      B = (B > 0.04045) ? Math.pow(((B + 0.055) / 1.055), 2.4) : B / 12.92;
    } else {
      R = Math.pow(R, gammaCorrection);
      G = Math.pow(G, gammaCorrection);
      B = Math.pow(B, gammaCorrection);
    }

    z.X = R * M[0] + G * M[3] + B * M[6];
    z.Y = R * M[1] + G * M[4] + B * M[7];
    z.Z = R * M[2] + G * M[5] + B * M[8];

    return z;
  };

  var convertXyzToXyy = function (o) {
    var n = o.X + o.Y + o.Z;
    if (n === 0) return {x: 0, y: 0, Y: o.Y};
    return {x: o.X / n, y: o.Y / n, Y: o.Y};
  };

  var Blind = function (rgb$$1, type, anomalize) {
    var z, v, n,
        line, c, slope,
        yi, dx, dy,
        dX, dY, dZ,
        dR, dG, dB,
        _r, _g, _b,
        ngx, ngz, M,
        adjust;

    if (type === "achroma") { // D65 in sRGB
      z = rgb$$1.R * 0.212656 + rgb$$1.G * 0.715158 + rgb$$1.B * 0.072186;
      z = {R: z, G: z, B: z};
      if (anomalize) {
        v = 1.75;
        n = v + 1;
        z.R = (v * z.R + rgb$$1.R) / n;
        z.G = (v * z.G + rgb$$1.G) / n;
        z.B = (v * z.B + rgb$$1.B) / n;
      }
      return z;
    }

    line = blinder[type];
    c = convertXyzToXyy(convertRgbToXyz(rgb$$1));
    // The confusion line is between the source color and the confusion point
    slope = (c.y - line.y) / (c.x - line.x);
    yi = c.y - c.x * slope; // slope, and y-intercept (at x=0)
    // Find the change in the x and y dimensions (no Y change)
    dx = (line.yi - yi) / (slope - line.m);
    dy = (slope * dx) + yi;
    dY = 0;
    // Find the simulated colors XYZ coords
    z = {};
    z.X = dx * c.Y / dy;
    z.Y = c.Y;
    z.Z = (1 - (dx + dy)) * c.Y / dy;
    // Calculate difference between sim color and neutral color
    ngx = 0.312713 * c.Y / 0.329016; // find neutral grey using D65 white-point
    ngz = 0.358271 * c.Y / 0.329016;
    dX = ngx - z.X;
    dZ = ngz - z.Z;
    // find out how much to shift sim color toward neutral to fit in RGB space
    M = matrixXyzRgb;
    dR = dX * M[0] + dY * M[3] + dZ * M[6]; // convert d to linear RGB
    dG = dX * M[1] + dY * M[4] + dZ * M[7];
    dB = dX * M[2] + dY * M[5] + dZ * M[8];
    z.R = z.X * M[0] + z.Y * M[3] + z.Z * M[6]; // convert z to linear RGB
    z.G = z.X * M[1] + z.Y * M[4] + z.Z * M[7];
    z.B = z.X * M[2] + z.Y * M[5] + z.Z * M[8];
    _r = ((z.R < 0 ? 0 : 1) - z.R) / dR;
    _g = ((z.G < 0 ? 0 : 1) - z.G) / dG;
    _b = ((z.B < 0 ? 0 : 1) - z.B) / dB;
    _r = (_r > 1 || _r < 0) ? 0 : _r;
    _g = (_g > 1 || _g < 0) ? 0 : _g;
    _b = (_b > 1 || _b < 0) ? 0 : _b;
    adjust = _r > _g ? _r : _g;

    if (_b > adjust) {
      adjust = _b;
    }
    // shift proportionally...
    z.R += adjust * dR;
    z.G += adjust * dG;
    z.B += adjust * dB;
    // apply gamma and clamp simulated color...
    z.R = 255 * (z.R <= 0 ? 0 : z.R >= 1 ? 1 : Math.pow(z.R, 1 / gammaCorrection));
    z.G = 255 * (z.G <= 0 ? 0 : z.G >= 1 ? 1 : Math.pow(z.G, 1 / gammaCorrection));
    z.B = 255 * (z.B <= 0 ? 0 : z.B >= 1 ? 1 : Math.pow(z.B, 1 / gammaCorrection));

    if (anomalize) {
      v = 1.75;
      n = v + 1;
      z.R = (v * z.R + rgb$$1.R) / n;
      z.G = (v * z.G + rgb$$1.G) / n;
      z.B = (v * z.B + rgb$$1.B) / n;
    }

    return z;
  };

  var colorVisionData = {
    protanomaly: {type: "protan", anomalize: true},
    protanopia: {type: "protan"},
    deuteranomaly: {type: "deutan", anomalize: true},
    deuteranopia: {type: "deutan"},
    tritanomaly: {type: "tritan", anomalize: true},
    tritanopia: {type: "tritan"},
    achromatomaly: {type: "achroma", anomalize: true},
    achromatopsia: {type: "achroma"}
  };

  var createBlinder = function (key) {
    return function (colorString) {
      var color = d3.rgb(colorString);
      if (!color) { return undefined; }
      var rgb$$1 = new Blind({
        R: color.r,
        G: color.g,
        B: color.b
      }, colorVisionData[key].type, colorVisionData[key].anomalize);
      // blinder.tritanomaly('#000000') causes NaN / null
      rgb$$1.R = rgb$$1.R || 0;
      rgb$$1.G = rgb$$1.G || 0;
      rgb$$1.B = rgb$$1.B || 0;

      return d3.rgb(rgb$$1.R, rgb$$1.G, rgb$$1.B);
    };
  };

  var obj = { cvdTypes: colorVisionData, colorTransforms: {} };
  // add our exported functions
  for (var key in colorVisionData) {
    obj.colorTransforms[key] = createBlinder(key);
  }

  return obj;
};

function CvdGradientPicker(container) {
  this.cvdGradientPicker = makeCvdGradientPicker(container);
}

var makeCvdGradientPicker = function(container) {
  var cvd = colorVisionDeficiency();

  var COLOR_SPACES = ["jab", "lab", "rgb"];

  var startColor = "black",
      stopColor = "white";

  renderGradients(startColor, stopColor);

  dispatch.on("updateGradientColors", function() {
    renderGradients(this.startColor, this.stopColor);
  });

  function renderGradients(start, stop) {
    var rows = container.selectAll("tbody tr");
    rows.each(function() {
      var row = d3$1.select(this),
          cvdType = row.attr("data-cvdType"),
          cvdFn = cvd.colorTransforms[cvdType];
      row.selectAll("td").filter((d,i) => i > 0)
          .each(function(d,i) {
            var td = d3$1.select(this),
                canvas = td.select("canvas");
            renderGradient(canvas, start, stop, COLOR_SPACES[i], cvdFn);
          });
    });
  }

  function renderGradient(canvas, start, stop, space, cvdFn) {
    var width = canvas.attr("width"),
        context = canvas.node().getContext("2d"),
        image = context.createImageData(width, 1),
        i = -1,
        spaceName = space[0].toUpperCase() + space.slice(1),
        interpolator = d3$1["interpolate" + spaceName],
        scale = d3$1.scaleLinear()
            .domain([0, width-1])
            .interpolate(interpolator)
            .range([start, stop]);

    var c;
    for(var x = 0; x < width; ++x) {
      c = d3$1.rgb(scale(x));
      if(cvdFn !== undefined) c = cvdFn(c);

      if(c.displayable()) {
        image.data[++i] = c.r;
        image.data[++i] = c.g;
        image.data[++i] = c.b;
        image.data[++i] = 255;
      } else {
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }
};

function CvdJndTable(table) {
  this.cvdJndTable = makeCvdJndTable(table);
}

var makeCvdJndTable = function(table) {
  var cvd = colorVisionDeficiency();

  var obj = {};

  var JND_PERCENT = 0.5,
      JND_SIZE = 0.1;

  obj.addColorToTable = function(newColor) {
    var c = d3$1.rgb(newColor),
        rgbstr = c.toString(),
        curPalette = getCurrentColors();

    if(curPalette.indexOf(rgbstr) > -1) return;

    table.selectAll("tbody tr").each(function() {
      var tr = d3$1.select(this),
          cvdType = tr.attr("class"),
          color;

      if(cvdType === "palette") color = rgbstr;
      else color = cvd.colorTransforms[cvdType](rgbstr);

      tr.append("td").style("background-color", color);
    });

    updateJNDs();
  };

  dispatch.on("addSelectedColor.cvdtable", function() {
    obj.addColorToTable(this.selectedColor);
  });

  dispatch.on("clearPalette.cvdtable", function() {
    table.selectAll("tr").each(function() {
      var row = d3$1.select(this);
      row.selectAll("td").filter((d,i) => i > 0).remove();
    });
  });

  dispatch.on("deletePaletteColor.cvdtable", function() {
    var curPalette = getCurrentColors(),
        cIdx = curPalette.indexOf(d3$1.rgb(this.color).toString());

    table.selectAll("tr").each(function() {
      var row = d3$1.select(this),
          tds = row.selectAll("td").filter((d,i) => i > 0);
      tds.filter((d,i) => i === cIdx).remove();
    });

    updateJNDs();
  });

  dispatch.on("updateJNDParameters.cvdTable", function() {
    JND_PERCENT = this.percent;
    JND_SIZE = this.size;
    updateJNDs();
  });


  function getCurrentColors() {
    var colors = [];
    table.select(".palette").selectAll("td").each(function(d,i) {
      if(i !== 0) colors.push(d3$1.select(this).style("background-color"));
    });
    return colors;
  }


  function updateJNDs() {
    table.selectAll("tbody tr").each(function() {
      var tr = d3$1.select(this);

      var rowColors = [];
      tr.selectAll("td").each(function(d,i) {
        if (i === 0) return;
        rowColors.push(d3$1.select(this).style("background-color"));
      });

      tr.selectAll("td").each(function(d,i) {
        if(i === 0) return;
        var td = d3$1.select(this),
            tdBG = td.style("background-color"),
            tdBGIdx = rowColors.indexOf(tdBG),
            isND = rowColors.reduce(function(acc, d, i) {
              if(i === tdBGIdx) return acc;
              var ndResult = d3$1.noticeablyDifferent(d, tdBG, JND_SIZE,
                                                    JND_PERCENT);
              return acc && ndResult;
            }, true);

        td.classed("notDifferent", isND === false)
            .text(isND === false ? "⚠" : "");
        if(d3$1.lab(tdBG).l < 30) td.style("color", "rgba(255,255,255,0.25)");
      });
    });
  }

  return obj;
};

function GradientPicker(container) {
  this.gradientPicker = makeGradientPicker(container);
}

var makeGradientPicker = function(container) {
  var NUM_COLOR_STEPS = 5;

  var inPalette = [];

  var gradientMenu = container.select(".gradientPickerMenu"),
      startColorSwatchList = gradientMenu.select(".startColor .swatchList"),
      stopColorSwatchList = gradientMenu.select(".stopColor .swatchList"),
      startInput = container.select(".gradientStartColor"),
      stopInput =  container.select(".gradientStopColor");

  var startColor = "rgb(0, 0, 0)",
      stopColor = "rgb(255, 255, 255)";

  renderGradients();

  startInput.on("blur", triggerTextInputColorChange(startInput));
  stopInput.on("blur", triggerTextInputColorChange(stopInput));

  container.select(".gradientStepCount")
      .on("blur", function() {
        NUM_COLOR_STEPS = +this.value;
        renderGradients();
      });

  dispatch.on("addSelectedColor.gradientpicker", function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    inPalette.push(rgbstr);

    startColorSwatchList.append("li")
        .style("background-color", this.selectedColor)
        .on("click", function() {
          startColor = rgbstr;
          renderGradients();
        });
    stopColorSwatchList.append("li")
        .style("background-color", this.selectedColor)
        .on("click", function() {
          stopColor = rgbstr;
          renderGradients();
        });
  });

  dispatch.on("clearPalette.gradientpicker", function() {
    inPalette = [];
    gradientMenu.selectAll("li").remove();
  });

  dispatch.on("deletePaletteColor.gradientpicker", function() {
    var rgb$$1 = d3$1.rgb(this.color);
    gradientMenu.selectAll("li").filter(function() {
      return d3$1.select(this).style("background-color") === rgb$$1.toString();
    }).remove();
    inPalette.splice(inPalette.indexOf(rgb$$1.toString()), 1);
  });

  function renderGradients() {
    // TODO adjust input backgrounds via class styling
    if(startColor === undefined && stopColor === undefined) {
      return;
    } else if(startColor === undefined) {
      return;
    } else if(stopColor === undefined) {
      return;
    }

    dispatch.call("updateGradientColors",
        {startColor: startColor, stopColor: stopColor});

    container.selectAll("canvas").each(function () {
      renderSingleGradient(d3$1.select(this), startColor, stopColor);
    });
    container.selectAll(".gradientOutputText").each(function() {
      renderSingleGradientText(d3$1.select(this), startColor, stopColor);
    });
  }

  function renderSingleGradient(canvas, start, stop) {
    var width = canvas.attr("width"),
        context = canvas.node().getContext("2d"),
        image = context.createImageData(width, 1),
        i = -1,
        space = canvas.attr("data-colorType"),
        spaceName = space[0].toUpperCase() + space.slice(1),
        interpolator = d3$1["interpolate" + spaceName],
        continuousScale = d3$1.scaleLinear()
            .domain([0, width-1])
            .interpolate(interpolator)
            .range([start, stop]),
        discreteScale = d3$1.scaleLinear()
            .domain([0, NUM_COLOR_STEPS-1])
            .interpolate(interpolator)
            .range([start, stop]);

    var isContinuous = canvas.classed("continuous");

    var pxPerColor = Math.floor(width / NUM_COLOR_STEPS),
        colorIdx = 0;

    var c = d3$1.rgb(continuousScale(0));
    for(var x = 0; x < width; ++x) {
      if(isContinuous) c = d3$1.rgb(continuousScale(x));
      else if(x % pxPerColor === 0 && colorIdx !== NUM_COLOR_STEPS) {
        c = d3$1.rgb(discreteScale(colorIdx));
        colorIdx++;
      }
      // For continuous rendering


      if(c.displayable()) {
        image.data[++i] = c.r;
        image.data[++i] = c.g;
        image.data[++i] = c.b;
        image.data[++i] = 255;
      } else {
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }

  function renderSingleGradientText(input, start, stop) {
    var space = input.attr("data-colorType"),
        spaceName = space[0].toUpperCase() + space.slice(1),
        interpolator = d3$1["interpolate" + spaceName],
        scale = d3$1.scaleLinear()
            .domain([0, input.classed("sequential") ? NUM_COLOR_STEPS-1 : 1])
            .interpolate(interpolator)
            .range([start, stop]),
        colors = Array.from(Array(NUM_COLOR_STEPS), (d,i) => scale(i));

    input.property("value", JSON.stringify(colors));
  }

  function triggerTextInputColorChange(inputSelection) {
    return function() {
      var input = d3$1.rgb(inputSelection.property("value"));
      if(input.displayable()) {
        if(inputSelection.classed("gradientStartColor")) startColor = input;
        else stopColor = input;
        renderGradients();
      }
    };
  }
};

function ImageColorPicker(container) {
  this.imageColorPicker = makeImageColorPicker(container);
}

var makeImageColorPicker = function(container) {
  var canvas = container.select("canvas").node(),
      context = canvas.getContext("2d"),
      colorList = container.select(".uniqueColors"),
      dropArea = container.select(".dragArea"),
      dropImg = container.select(".dropImg"),
      uploadBtn = container.select(".uploadBtn");

  dropArea.on("dragover", dragOverArea);
  dropArea.on("drop", selectFile);
  dropImg.on("load", buildCanvas);
  uploadBtn.on("click", function() {
    var localFile = container.select(".uploadForm input[type=\"file\"]");
    if(localFile.property("files").length > 0) {
      var reader = new FileReader();
      reader.onload = function(e) { dropImg.node().src=e.target.result; };
      reader.readAsDataURL(localFile.property("files")[0]);
    }
  });

  function buildCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(dropImg.node(), 0, 0, canvas.width, canvas.height);

    var image = context.getImageData(0, 0, canvas.width, canvas.height),
        pxs = Array(canvas.width*canvas.height);

    // quickly iterate over all pixels
    var i = -1;
    for(var x = 0; x < canvas.width*canvas.height; ++x) {
      pxs[x] = d3$1.hcl(d3$1.rgb(image.data[++i],
                             image.data[++i],
                             image.data[++i]).toString());
      ++i;
    }

    var uniqueColors = pxs.filter(function(d, i, self) {
              return self.indexOf(d) === i;
            })
            .reduce(function(acc, d) {
              if(acc.length === 0) return [d];

              var i = 0, isND;
              for(i = 0; i<acc.length; i++) {
                isND = d3$1.noticeablyDifferent(acc[i], d, 1.0, 0.5);
                if(isND === false) return acc;
              }
              acc.push(d);
              return acc;
            }, []).sort(function(a,b) {
              var hDiff = a.h - b.h;
              if(Math.abs(hDiff) > 15) return hDiff;
              var lDiff = a.l - b.l;
              if(Math.abs(lDiff) > 5) return lDiff;
              else return a.c - b.c;
            });

    colorList.selectAll("li").remove();
    colorList.selectAll("li")
        .data(uniqueColors)
        .enter()
        .append("li")
            .style("background-color", d => d)
            .on("click", function(d) {
              dispatch.call("addSelectedColor",{selectedColor: d.toString() });
            });
  }

  function dragOverArea() {
    d3$1.event.stopPropagation();
    d3$1.event.preventDefault();
    d3$1.event.dataTransfer.dropEffect = "copy";
  }

  function selectFile() {
    d3$1.event.stopPropagation();
    d3$1.event.preventDefault();

    var files = d3$1.event.dataTransfer.files;
    if(files.length < 1) return;

    var file = files[0];
    if (!file.type.match("image.*")) {
        return;
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = function(e) {
      dropImg.node().src=e.target.result;
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL(file);
  }
};

function JndTable(table) {
  this.jndTable = makeJndTable(table);
}

var makeJndTable = function(table) {
  var JND_PERCENT = 0.5,
      JND_SIZE = 0.1;
  var obj = {},
      paramMenu = table.select(".jndParameters");

  obj.addColorToTable = function(newColor) {
    var c = d3$1.rgb(newColor),
        rgbstr = c.toString(),
        curPalette = getCurrentColors(),
        palette = table.select(".palette");

    if(curPalette.indexOf(rgbstr) > -1) return;

    palette.append("td").style("background-color", rgbstr);
    table.selectAll(".ndRow").each(function(d,i) {
      var rowColor = curPalette[i],
          td = d3$1.select(this).append("td");

      var nd = d3$1.noticeablyDifferent(rgbstr, rowColor, JND_SIZE, JND_PERCENT);
      if(nd === false) {
        td.classed("notDifferent", true).text("⚠");
      }
    });

    var newRow = table.select("tbody").append("tr").classed("ndRow", true);
    newRow.append("td").style("background-color", rgbstr);

    curPalette.forEach(function(c) {
      var td = newRow.append("td");

      if(d3$1.noticeablyDifferent(rgbstr, c, JND_SIZE, JND_PERCENT) === false) {
        td.classed("notDifferent", true).text("⚠");
      }
    });
    newRow.append("td"); // self-row should be blank;
  };

  obj.updateColorTable = function() {
    var curPalette = getCurrentColors();
    table.selectAll(".ndRow").each(function(d,i) {
      var rowColor = curPalette[i],
          tr = d3$1.select(this);
      tr.selectAll("td").filter((d,i) => i > 0).each(function(td,j) {
        var c = curPalette[j];
        if(c === rowColor) return;
        var isND = d3$1.noticeablyDifferent(c, rowColor, JND_SIZE, JND_PERCENT);
        d3$1.select(this).classed("notDifferent", !isND)
            .text(isND ? "" : "⚠");
      });
    });
  };

  dispatch.on("addSelectedColor.jndtable", function() {
    obj.addColorToTable(this.selectedColor);
  });

  dispatch.on("clearPalette.jndtable", function() {
    var colorCells = table.selectAll(".palette td").filter((d,i) => i > 0),
        rows = table.selectAll(".ndRow");
    colorCells.remove();
    rows.remove();
  });


  dispatch.on("deletePaletteColor.jndtable", function() {
    var curPalette = getCurrentColors(),
        cIdx = curPalette.indexOf(d3$1.rgb(this.color).toString()),
        colorCells = table.selectAll(".palette td").filter((d,i) => i > 0),
        rows = table.selectAll(".ndRow");

    curPalette.splice(cIdx, 1);

    colorCells.filter((d,i) => i === cIdx).remove();

    colorCells.each(function(d,i) { if(i === cIdx) d3$1.select(this).remove(); });

    rows.each(function(d,i) {
      var row = d3$1.select(this);
      if(i === cIdx) { row.remove(); return; }

      var rowColor = row.style("background-color");

      var cmps = row.selectAll("td").filter((d,i) => i > 0);
      cmps.filter((d,i) => i === cIdx).remove();

      cmps.each(function() {
        var td = d3$1.select(this),
            bg = td.style("background-color");
        if(bg === rowColor) return;

        var notDiff = !d3$1.noticeablyDifferent(bg, rowColor);
        td.classed("notDifferent", notDiff).text(notDiff ? "⚠" : "");
      });
    });
  });


  paramMenu.selectAll("li").each(function() {
    var li = d3$1.select(this),
        parameter = li.attr("data-parameter"),
        valText = li.select(".value");

    li.select("input").on("input", function() {
      var val = +d3$1.select(this).property("value");
      if(parameter === "percent") {
        JND_PERCENT = val;
        // HACK TODO remove Javascript imprecision rounding.
        val = val.toFixed(2).replace("0.","").replace(".","") + "%";
      } else if(parameter === "size") {
        JND_SIZE = val;
        val = val.toFixed(2);
      }
      valText.text(val);

      obj.updateColorTable();
      dispatch.call("updateJNDParameters", {
        percent: JND_PERCENT,
        size: JND_SIZE
      });
    });
  });


  // jnd calculator
  var va_text = table.select(".visualangle_va"),
      dist = table.select(".visualangle_distance"),
      size = table.select(".visualangle_size");

  dist.on("blur", calculateVA);
  size.on("blur", calculateVA);
  calculateVA();

  function calculateVA() {
    var d = +dist.property("value"),
        s = +size.property("value"),
        va = 2*Math.atan( (s/2) / d );
    va = va * 180 / Math.PI; // radian to degrees
    va_text.text(d3$1.format(".3f")(va));
  }


  function getCurrentColors() {
    var colors = [];
    table.select(".palette").selectAll("td").each(function(d,i) {
      if(i !== 0) colors.push(d3$1.select(this).style("background-color"));
    });
    return colors;
  }

  return obj;
};

function PaletteExporter(container) {
  this.paletteExporter = makePaletteExporter(container);
}

var makePaletteExporter = function(container) {
  var inPalette = [],
      obj = {},
      paletteCanvas = container.select(".paletteCanvas"),
      paletteInputField = container.select(".paletteInputField"),
      paletteShareField = container.select(".paletteShareField");

  dispatch.on("addSelectedColor.export", function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
    obj.updatePaletteCanvas();
    obj.updatePaletteInputField();
    obj.updatePaletteShareField();
  });
  dispatch.on("deletePaletteColor.export", function() {
    var idx = inPalette.indexOf(this.color);
    inPalette.splice(idx, 1);
    obj.updatePaletteCanvas();
    obj.updatePaletteInputField();
    obj.updatePaletteShareField();
  });

  obj.updatePaletteCanvas = function() {
    paletteCanvas.attr("width", 200);

    if(inPalette.length === 0) return;

    var width = paletteCanvas.attr("width"),
        context = paletteCanvas.node().getContext("2d"),
        image = context.createImageData(width, 1),
        i = -1,
        rgb$$1;

    var pxForColor = Math.floor(width / inPalette.length),
        palIdx = -1;

    for(var x = 0; x < width; ++x) {
      if(x % pxForColor === 0 && palIdx !== inPalette.length-1) palIdx++;
      rgb$$1 = d3$1.rgb(inPalette[palIdx]);

      if(rgb$$1.displayable()) {
        image.data[++i] = rgb$$1.r;
        image.data[++i] = rgb$$1.g;
        image.data[++i] = rgb$$1.b;
        image.data[++i] = 255;
      } else {
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 0;
        image.data[++i] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  };

  obj.updatePaletteInputField = function() {
    paletteInputField.property("value", "\""+inPalette.join("\",\"")+"\"");
  };

  obj.updatePaletteShareField = function() {
    var txt;
    if(inPalette.length === 0) txt = "";
    else {
      var palStr = inPalette.map(d => d.toString().replace(/\s/g,"")).join(";");
      txt = "?palette=" + palStr;
    }

    paletteShareField.property("value",
        document.location.host+document.location.pathname + txt);
  };


  obj.addColorToPalette = function(newColor) {
    inPalette.push(d3$1.rgb(newColor).toString());
  };

  paletteInputField.on("blur", function() {
    if(this.value === "") return;
    var colors = this.value.replace(/\s/g, "")
            .replace("[","").replace("]","")
            .split("\",");
    if(colors.length < 1) return;

    dispatch.call("clearPalette");

    inPalette = [];

    /* eslint-disable */
    colors = colors.map(d => d.replace(/\"/g, ""))
        .filter(d => d3$1.rgb(d).displayable());
    /* eslint-enable */
    colors.forEach(obj.addColorToPalette);
    colors.forEach(d => dispatch.call("addSelectedColor", {
      selectedColor: d
    }));
    obj.updatePaletteCanvas();

    paletteInputField.property("value", "\""+colors.join("\",\"")+"\"");
  });
};

function PalettePreview(container) {
  this.palettePreview = makePalettePreview(container);
}

var makePalettePreview = function(container) {
  var colorList = container.select("ul"),
      inPalette = [];
  var obj = {};

  obj.addColorToPreview = function(newColor) {
    colorList.append("li")
        .style("background-color", newColor)
        .on("click", function() {
          var rgb$$1 = d3$1.select(this).style("background-color");
          dispatch.call("deletePaletteColor", {color: rgb$$1});
        });
    inPalette.push(d3$1.rgb(newColor).toString());
    updatePreview();
  };

  dispatch.on("addSelectedColor.palettePreview", function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPreview(this.selectedColor);
  });


  dispatch.on("clearPalette.palettePreview", function() {
    inPalette = [];
    colorList.selectAll("li").remove();
  });

  dispatch.on("deletePaletteColor.palettePreview", function() {
    var idx = inPalette.indexOf(this.color);
    if(idx < 0) return;

    colorList.selectAll("li").each(function(d,i) {
      if(i !== idx) return;
      d3$1.select(this).remove();
    });

    inPalette.splice(idx, 1);
    updatePreview();
  });


  function updatePreview() {
    colorList.selectAll("li")
        .style("width", (1/inPalette.length)*100 + "%");
  }

  return obj;
};

function VisualizationPreview(container) {
  this.visPreview = makeVisPreview(container);
}

var makeVisPreview = function(container) {
  var inPalette = [],
      barSvg = container.select(".barPreview"),
      mapSvg = container.select(".mapPreview"),
      scatterSvg = container.select(".scatterPreview"),
      margin = { top: 15, right: 15, bottom: 20, left: 15 },
      obj = {};

  var SCATTER_OPTIONS = {
    RADIUS : 5,
    SHOW_FILL : false,
    SHOW_STROKE : true,
    STROKE_WIDTH : 1
  };

  var MAP_OPTIONS = {
    SHOW_STROKE : true,
    STROKE_COLOR : "#fff",
    STROKE_WIDTH : 1
  };

  var numMapPoly = mapSvg.selectAll("polygon").size(),
      mapSvgPolyData = new Array(numMapPoly);

  for(var i = 0; i < numMapPoly; i++) mapSvgPolyData[i] = i;
  mapSvgPolyData = d3$1.shuffle(mapSvgPolyData);

  drawBar();
  drawScatter();

  container.select(".scatterOptions_radius").on("input", function() {
    SCATTER_OPTIONS.RADIUS = +d3$1.select(this).property("value");
    updateScatter();
  });
  container.select(".scatterOptions_showStroke").on("change", function() {
    SCATTER_OPTIONS.SHOW_STROKE = !SCATTER_OPTIONS.SHOW_STROKE;
    updateScatter();
  });
  container.select(".scatterOptions_showFill").on("change", function() {
    SCATTER_OPTIONS.SHOW_FILL = !SCATTER_OPTIONS.SHOW_FILL;
    updateScatter();
  });
  container.select(".scatterOptions_stroke_width").on("input", function() {
    SCATTER_OPTIONS.STROKE_WIDTH = +d3$1.select(this).property("value");
    updateScatter();
  });

  container.select(".mapOptions_showStroke").on("change", function() {
    MAP_OPTIONS.SHOW_STROKE = !MAP_OPTIONS.SHOW_STROKE;
    updateMap();
  });
  container.select(".mapOptions_stroke_color").on("blur", function() {
    MAP_OPTIONS.STROKE_COLOR = d3$1.select(this).property("value");
    updateMap();
  });
  container.select(".mapOptions_stroke_width").on("input", function() {
    MAP_OPTIONS.STROKE_WIDTH = +d3$1.select(this).property("value");
    updateMap();
  });

  dispatch.on("addSelectedColor.visPreview", function() {
    var rgbstr = d3$1.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(rgbstr);
  });

  dispatch.on("clearPalette.visPreview", function() {
    inPalette = [];
    updateScatter();
    updateBar();
    updateMap();
  });

  dispatch.on("deletePaletteColor.visPreview", function() {
    var rgbstr = d3$1.rgb(this.color).toString(),
        idx = inPalette.indexOf(rgbstr);
    if(idx < 0) return;

    inPalette.splice(idx, 1);
    updateScatter();
    updateBar();
    updateMap();
  });

  obj.addColorToPalette = function(color) {
    inPalette.push(color);
    updateScatter();
    updateBar();
    updateMap();
  };


  function updateBar() {
    var width = barSvg.attr("width") - margin.left - margin.right,
        height = barSvg.attr("height") - margin.top - margin.bottom;

    var x = d3$1.scaleBand().domain(inPalette).range([0, width]).padding(0.1),
        y = d3$1.scaleLinear().domain([0,1]).range([height, 0]),
        g = barSvg.select(".bars");

    var bars = g.selectAll("rect").data(inPalette);

    bars.enter()
        .append("rect")
            .each(function() {
              var bar = d3$1.select(this),
                  yVal = 0;
              while(yVal < 0.25) yVal = y(Math.random());
              bar.attr("y", yVal).attr("height", height -yVal);
            })
        .merge(bars)
            .style("fill", d => d)
            .attr("x", d => x(d))
            .attr("width", x.bandwidth());

    bars.exit().remove();

  }


  function updateMap() {
    mapSvg.selectAll("polygon")
        .style("fill", (d,i) => inPalette[mapSvgPolyData[i] % inPalette.length])
        .style("stroke", MAP_OPTIONS.SHOW_STROKE ?
            MAP_OPTIONS.STROKE_COLOR : "none")
        .style("stroke-width", MAP_OPTIONS.STROKE_WIDTH);
  }


  function updateScatter() {
    scatterSvg.select(".circles").selectAll("circle")
        .attr("r", SCATTER_OPTIONS.RADIUS)
        .style("fill",(d,i) => SCATTER_OPTIONS.SHOW_FILL ?
            inPalette[i % inPalette.length] : "none")
        .style("stroke",(d,i) => SCATTER_OPTIONS.SHOW_STROKE ?
            inPalette[i % inPalette.length] : "none")
        .style("stroke-width", SCATTER_OPTIONS.STROKE_WIDTH);
  }

  function drawBar() {
    var outline = generateChartBasics(barSvg, true),
        svg = outline.svg;

    svg.append("g").classed("bars", true);
  }

  function drawScatter() {
    var outline = generateChartBasics(scatterSvg, true),
        svg = outline.svg, x = outline.x, y = outline.y;

    var circles = svg.append("g").classed("circles", true);
    for(var i = 0; i < 100; i++) {
      circles.append("circle")
          .attr("cx", x(Math.random()))
          .attr("cy", y(Math.random()))
          .attr("r", SCATTER_OPTIONS.RADIUS)
          .style("stroke-width", SCATTER_OPTIONS.STROKE_WIDTH);
    }
  }

  function generateChartBasics(svgObj, makeAxis) {
    var width = +svgObj.attr("width") - margin.left - margin.right,
        height = +svgObj.attr("height") - margin.top - margin.bottom;

    var svg = svgObj.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")");

    var x = d3$1.scaleLinear().domain([0,1]).range([0, width]),
        y = d3$1.scaleLinear().domain([0,1]).range([height, 0]);

    if(makeAxis) {
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3$1.axisBottom(x).ticks(0));
      svg.append("g")
        .call(d3$1.axisLeft(y).ticks(0));
    }

    return {
      height: height, margin: margin, svg: svg, width: width, x: x, y: y
    };
  }
};

function initializeHiddenMenus() {
  d3$1.selectAll(".hiddenMenu").each(function() {
    var menu = d3$1.select(this),
        title = menu.select(".hiddenMenuTitle"),
        content = menu.select(".hiddenMenuContent");
    title.on("click", function() {
      var isHidden = content.style("visibility") === "hidden";
      content.style("visibility", isHidden ? "visible" : "hidden")
          .style("display", isHidden ? "inline-block" : "none");

    });
  });
}

function initializeURISharing() {
  var inPalette = [];

  var params = document.location.search.split("&"),
      palette = params.filter(d => d.indexOf("palette=") > -1);

  console.log(palette);

  if (palette.length === 0) return;

  palette = palette[0].replace("?","").replace("palette=","").split(";");
  console.log(palette);

  var colors = palette.map(d => d3$1.rgb(d)).filter(d => d.displayable());
  inPalette = colors.map(d => d.toString());
  inPalette = inPalette.filter((d,i) => inPalette.indexOf(d) === i);
  console.log(inPalette);
  if(inPalette.length > 0) {
    inPalette.forEach(d => dispatch.call("addSelectedColor", {
      selectedColor: d
    }));
  }
}

/* eslint-disable no-unused-vars */
var cvdGraientPicker = new CvdGradientPicker(d3$1.select(".cvdGradientPicker"));
var cvdJndTable = new CvdJndTable(d3$1.select(".cvdTable"));
var gradientPicker = new GradientPicker(d3$1.select(".gradientPicker"));
var imageColorPicker = new ImageColorPicker(d3$1.select(".imageColorPicker"));
var jndTable = new JndTable(d3$1.select(".jndTable"));
var paletteExporter = new PaletteExporter(d3$1.select(".exportOptionsContainer"));
var palettePreview = new PalettePreview(d3$1.select(".palettePreview"));
var paletteTable = new ColorPaletteTable(d3$1.select(".paletteTable"));
var picker = new ColorPicker(d3$1.select(".colorpicker"));
var visPreview = new VisualizationPreview(d3$1.select(".visPreview"));
/* eslint-enable no-unused-vars */

// Must follow initialization of all interface components, as the URI color
// palette parser will dispatch add color messages
initializeURISharing();

// Add hide/show for all hidden menues
initializeHiddenMenus();

})));
