import {dispatch} from "../dispatch";
import {rgb2hex} from "../util/rgb2hex";

export function ColorPicker(container) {
  this.colorpicker = makeColorPicker(container);
}

var makeColorPicker = function(container) {
  var makeID = Date.now().toString();

  var CHECK_FOR_ND = false,
      COLORPICKER_SPACE = 'lab',
      START_COLOR_VALUES = [50,0,0],
      START_COLOR = {
        space: COLORPICKER_SPACE,
        value: START_COLOR_VALUES,
        color: d3[COLORPICKER_SPACE].apply(this, START_COLOR_VALUES)
      };

  var CLEAR_COLOR = d3.rgb('#282c34'),
      CLEAR_COLOR_RGB = [40, 44, 52];

  var startBarValue;
  if(COLORPICKER_SPACE === "jab") startBarValue = START_COLOR.color.J;
  else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") startBarValue = START_COLOR.color.l;
  else startBarValue = START_COLOR.color.r;

  container.select(".selectedColor")
      .style("background", START_COLOR.color.toString());

  updateColorChannelInput(START_COLOR.color.toString());
  renderColorpicker(startBarValue);
  renderColorpicker_bar();

  container.select("#addColorToPaletteBtn")
      .on("click", function() {
        dispatch.call("addSelectedColor", {
          selectedColor: container.select(".selectedColor").style("background-color")
        });
      });

  container.selectAll("#colorspaceSwitcherMenu li").on("click", function() {
    container.selectAll("#colorspaceSwitcherMenu li").classed("active", false);
    d3.select(this).classed("active", true);

    var newSpace = d3.select(this).attr('data-space');
    if(newSpace !== COLORPICKER_SPACE) {
      COLORPICKER_SPACE = newSpace;

      var selectedColor = container.select(".selectedColor")
              .style('background-color'),
          color = d3[COLORPICKER_SPACE](selectedColor),
          barValue;

      if(COLORPICKER_SPACE === "jab") barValue = color.J;
      else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") barValue = color.l;
      else barValue = color.r;

      renderColorpicker(barValue);
      renderColorpicker_bar();
      relocateColorpickerBarThumb(barValue);
    }
  });

  container.selectAll('.colorChannelInput')
      .on('focus', storeColorChannelValue)
      .on('blur', triggerColorChannelUpdate);
  container.selectAll('.colorChannelInput[type="color"]').on("change", triggerColorChannelUpdate);
  container.select('.freetextColorInput').on('blur', function() {
    var colorInput = d3.rgb(this.value.replace(/\'/g, '').replace(/\"/g,''));
    this.value = '';

    if(colorInput.opacity !== NaN) colorInput.opacity = 1;
    if(colorInput.displayable()) updateColorChannelInput(colorInput.toString());
    else return;

    container.select(".selectedColor").style('background-color', colorInput);

    var barValue;
    if(COLORPICKER_SPACE === "jab") barValue = d3.jab(colorInput).J;
    else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") barValue = d3.lab(colorInput).l;
    else barValue = colorInput.r;
    relocateColorpickerBarThumb(barValue);
  });


  container.select('#colorpicker_square')
      .on("click", function () {
        var context = this.getContext('2d'),
            px = context.getImageData(d3.mouse(this)[0], d3.mouse(this)[1], 1, 1).data, // remove alpha
            rgb = "rgba("+px.slice(0,4).join(',')+")";
        d3.select(".selectedColor").style('background', rgb);
        updateColorChannelInput(rgb);
      })
      .on("mousemove", function() {
        var context = this.getContext('2d'),
            px = context.getImageData(d3.mouse(this)[0], d3.mouse(this)[1], 1, 1).data, // remove alpha
            rgb = "rgba("+px.slice(0,4).join(',')+")";
        container.select(".hoverColor").style("background", rgb);
        updateColorChannelInputHover(rgb);
      });

  var slider = container.select("#colorpicker_slider"),
      sliderMargin = { top: 10, right: 0, bottom: 10, left: 0 },
      thumb = slider.select(".thumb"),
      sliderHeight = +slider.style("height").replace("px", ""),
      sliderScale = d3.scaleLinear().domain([0, sliderHeight-sliderMargin.top]);

  thumb.attr('transform', 'translate(0,'+(sliderHeight/2-sliderMargin.top)+')');
  thumb.call(d3.drag().on("drag", dragColorpickerSlider));

  var paletteColors = [];
  dispatch.on("addSelectedColor.colorpicker"+makeID, function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(paletteColors.indexOf(rgbstr) > -1) return;
    paletteColors.push(rgbstr);
  });


  dispatch.on("clearPalette.colorpicker"+makeID, function() {
    paletteColors = [];
  });

  dispatch.on("deletePaletteColor.colorpicker"+makeID, function() {
    var idx = paletteColors.indexOf(d3.rgb(this.color).toString());
    if(idx < 0) return;
    paletteColors.splice(idx, 1);
  });

  dispatch.on("updateSelectedColor.colorpicker"+makeID, function () {
    var selectedColor = this.selectedColor,
        color = d3[COLORPICKER_SPACE](selectedColor),
        barValue;

    if(COLORPICKER_SPACE === "jab") barValue = color.J;
    else if(COLORPICKER_SPACE === "lab" || COLORPICKER_SPACE === "hcl") barValue = color.l;
    else if(COLORPICKER_SPACE === "rgb") barValue = color.r;

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

    var newThumbLoc = d3.scaleLinear()
            .domain(sliderScale.range())
            .range(sliderScale.domain());
    container.select(".thumb").attr("transform", "translate(0,"+newThumbLoc(barValue)+")");
  }


  function renderColorpicker(barValue) {
    var colorpicker = d3.select('#colorpicker_square').node(),
        context = colorpicker.getContext("2d");

    var height = colorpicker.height,
        width = colorpicker.width,
        img = context.createImageData(width, height);

    var hclScale_hue = d3.scaleLinear()
            .domain([0, width])
            .range([359, 0]),
        hclScale_chroma =  d3.scaleLinear()
            .domain([height, 0])
            .range([0, 135]);

    var labScale = d3.scaleLinear()
            .domain([0, width])
            .range([-115, 115]);

    var jabScale = d3.scaleLinear()
            .domain([0, width])
            .range([-45, 45]);

    var nd;

    var c,y,x,i=-1;
    for(y=height;y>0;y--) {
      for(x=width;x>0;x--) {
        nd = true;
        if(CHECK_FOR_ND) {
          nd = paletteColors.reduce(function(nd, rgb) {
                return nd && d3.noticeablyDifferent(rgb,c, 0.3);
              }, true);
        }
        if(nd === false) {
          c = CLEAR_COLOR;
        } else if(COLORPICKER_SPACE === 'rgb') c = d3.rgb(barValue, x, y);
        else {
          if(COLORPICKER_SPACE === 'lab') {
            c = d3.lab(barValue, -labScale(x), labScale(y));
          } else if(COLORPICKER_SPACE === "hcl") {
            c = d3.hcl(hclScale_hue(x), hclScale_chroma(y), barValue);
          } else {
            c = d3.jab(barValue, -jabScale(x), jabScale(y));
            // Hack around CIECAM02 out-of-gamut irregularities
            if(  (c.J < 42 && c.b > 25)
              || (c.J < 10 && c.b > 12)
              || (c.J < 4 && c.b > 7)
              || (c.J < 2 && (c.b > 3 || c.a < -8 || c.a > 8)) ) c = CLEAR_COLOR;
          }

          if(c.displayable() === false) c = CLEAR_COLOR;
          else c = d3.rgb(c);
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
    var colorpicker_bar = d3.select("#colorpicker_bar").node(),
        context = colorpicker_bar.getContext("2d"),
        height = colorpicker_bar.height,
        width = colorpicker_bar.width,
        img = context.createImageData(1, height);

    var c, x, y, i=-1;
    var barScale = d3.scaleLinear()
            .domain([0, height])
            .range(COLORPICKER_SPACE === "rgb" ? [0,255] : [0, 100]);

    for(y=height;y>0;y--) {
      if(COLORPICKER_SPACE === 'rgb') c = d3.rgb(barScale(y), 0, 0);
      else if(COLORPICKER_SPACE === 'hcl') {
        c = d3.rgb(d3.hcl(0,0,barScale(y)));
      }
      else if(COLORPICKER_SPACE === 'lab') {
        c = d3.rgb(d3.lab(barScale(y), 0, 0));
      } else if(COLORPICKER_SPACE === 'jab') {
        c = d3.rgb(d3.jab(barScale(y), 0, 0));
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
    if(d3.event.y < 0) y = 0;
    else if(d3.event.y > sliderH) y = sliderH;
    else y = d3.event.y;
    d3.select(this).attr("transform", "translate(0,"+y+")");
    renderColorpicker(sliderScale(y));

    var channels = [sliderScale(y)];
    d3.selectAll('.colorChannelInput')
        .filter(function() {
          return d3.select(this).attr('data-colorType') === COLORPICKER_SPACE;
        }).each(function(d,i) {
          if(i !== 0) channels.push(+this.value);
          else this.value = sliderScale(y);
        });

    var newColor;
    if(COLORPICKER_SPACE !== "hcl"){
      newColor = d3[COLORPICKER_SPACE](channels[0], channels[1], channels[2]);
    } else {
      newColor = d3[COLORPICKER_SPACE](channels[2], channels[1], channels[0]);
    }
    updateColorChannelInput(newColor);
    d3.select('.selectedColor').style('background-color', newColor.toString());
  }
  function toggleThumbVisibility() {
    var isHidden = d3.select(this).classed(".thumbHidden");
    d3.select(this).classed("thumbHidden", !isHidden);
  }


  function updateColorChannelInput(rgbstr) {
    updateColorChannelInput_abstract(rgbstr, '.colorChannelInput');
  }
  function updateColorChannelInputHover(rgbstr) {
    updateColorChannelInput_abstract(rgbstr, '.colorChannelInputHover');
  }

  function updateColorChannelInput_abstract(rgbstr, inputClass) {
    var colors = {
      rgb: d3.rgb(rgbstr),
      jab: d3.jab(rgbstr),
      lab: d3.lab(rgbstr),
      hcl: d3.hcl(rgbstr)
    };
    colors.hex = '#'+rgb2hex(colors.rgb.toString());

    d3.selectAll(inputClass).each(function() {
      var input = d3.select(this),
          colorType = input.attr('data-colorType');

      if(colorType === 'hex') {
        input.property("value", colors.hex);
      } else {
        var color = colors[colorType],
            channelValue = Math.round(color[input.attr('data-channel')]);
        if(isNaN(channelValue) === false) input.node().value = channelValue;
        else input.node().value = null;
      }
    });
  }

  var TMP_COLOR_CHANNEL_VALUE;
  function storeColorChannelValue() { TMP_COLOR_CHANNEL_VALUE = this.value; }
  function triggerColorChannelUpdate() {
    if(this.value === '') {
      this.value = TMP_COLOR_CHANNEL_VALUE;
    } else {
      var thisEl = d3.select(this),
          colorType = thisEl.attr('data-colorType'),
          rgbstr;
      if(colorType === 'hex') rgbstr = d3.rgb(this.value).toString();
      else {
        var selector = '.colorChannelInput[data-colorType="'+colorType+'"]',
            values = [];
        d3.selectAll(selector).each(function() { values.push(this.value) });
        if(colorType !== "hcl") {
          rgbstr = d3[colorType](values[0], values[1], values[2]).toString();
        } else {
          rgbstr = d3[colorType](values[2], values[1], values[0]).toString();
        }
      }

      updateColorChannelInput(rgbstr);

      d3.select(".selectedColor").style('background', rgbstr);
      var selectedColor = d3.select(".selectedColor"),
          color = d3[COLORPICKER_SPACE](rgbstr),
          barValue;
      if(COLORPICKER_SPACE === 'jab') barValue = color.J;
      else if(COLORPICKER_SPACE === 'lab' || COLORPICKER_SPACE === 'hcl') barValue = color.l;
      else barValue = color.r;

      renderColorpicker(barValue);
      renderColorpicker_bar();
      relocateColorpickerBarThumb(barValue);
    }
  }
}
