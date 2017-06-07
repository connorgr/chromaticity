var gradientpicker = function(container) {
  var TMP_START_COLOR_VALUE,
      TMP_STOP_COLOR_VALUE,
      NUM_COLOR_STEPS = 5;

  var inPalette = [];

  var gradientMenu = container.select(".gradientPickerMenu"),
      startColorSwatchList = gradientMenu.select(".startColor .swatchList"),
      stopColorSwatchList = gradientMenu.select(".stopColor .swatchList"),
      startInput = container.select(".gradientStartColor"),
      stopInput =  container.select(".gradientStopColor");

  var startColor = "rgb(0, 0, 0)",
      stopColor = "rgb(255, 255, 255)";

  renderGradients();

  container.selectAll(".gradientPickerInput")
      .on('focus', storeColorValue);
  startInput.on('blur', triggerTextInputColorChange(startInput));
  stopInput.on('blur', triggerTextInputColorChange(stopInput));

  container.select(".gradientStepCount")
      .on("blur", function() {
        NUM_COLOR_STEPS = +this.value;
        container.selectAll(".sequential").attr("width", NUM_COLOR_STEPS);
        renderGradients();
      });

  dispatch.on("addSelectedColor.gradientpicker", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    inPalette.push(rgbstr);

    var newStart = startColorSwatchList.append("li")
            .style("background-color", this.selectedColor)
            .on("click", function() {
              startColor = rgbstr;
              renderGradients();
            }),
        newStop = stopColorSwatchList.append("li")
            .style("background-color", this.selectedColor)
            .on("click", function() {
              stopColor = rgbstr;
              renderGradients();
            });
  });

  dispatch.on("deletePaletteColor.gradientpicker", function() {
    var rgb = d3.rgb(this.color);
    gradientMenu.selectAll("li").filter(function() {
      return d3.select(this).style("background-color") === rgb.toString();
    }).remove();
    inPalette.splice(inPalette.indexOf(rgb.toString()), 1);
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
      renderSingleGradient(d3.select(this), startColor, stopColor);
    });
    container.selectAll(".gradientOutputText").each(function() {
      renderSingleGradientText(d3.select(this), startColor, stopColor);
    });
  }

  function renderSingleGradient(canvas, start, stop) {
    var width = canvas.attr("width"),
        context = canvas.node().getContext("2d"),
        image = context.createImageData(width, 1),
        i = -1,
        space = canvas.attr("data-colorType"),
        interpolator = d3["interpolate" + space[0].toUpperCase() + space.slice(1)],
        scale = d3.scaleLinear()
            .domain([0, width-1])
            .interpolate(interpolator)
            .range([start, stop]);

    var c;
    for(var x = 0; x < width; ++x) {
      c = d3.rgb(scale(x));
      // console.log(c);
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
        interpolator = d3["interpolate" + space[0].toUpperCase() + space.slice(1)],
        scale = d3.scaleLinear()
            .domain([0, input.classed("sequential") ? NUM_COLOR_STEPS-1 : 1])
            .interpolate(interpolator)
            .range([start, stop]),
        colors = Array.from(Array(NUM_COLOR_STEPS), (d,i) => scale(i));

    input.property("value", JSON.stringify(colors));
  }


  function storeColorValue() {
    TMP_START_COLOR_VALUE = startColor;
    TMP_STOP_COLOR_VALUE = stopColor;
  }
  function triggerTextInputColorChange(inputSelection) {
    return function() {
      var input = d3.rgb(inputSelection.property("value"));
      if(input.displayable()) {
        if(inputSelection.classed("gradientStartColor")) startColor = input;
        else stopColor = input;
        renderGradients();
      }
    };
  }
}
