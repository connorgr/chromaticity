import * as d3 from "d3";
import {dispatch} from "../dispatch";

export function GradientPicker(container) {
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
    var rgbstr = d3.rgb(this.selectedColor).toString();
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
        spaceName = space[0].toUpperCase() + space.slice(1),
        interpolator = d3["interpolate" + spaceName],
        continuousScale = d3.scaleLinear()
            .domain([0, width-1])
            .interpolate(interpolator)
            .range([start, stop]),
        discreteScale = d3.scaleLinear()
            .domain([0, NUM_COLOR_STEPS-1])
            .interpolate(interpolator)
            .range([start, stop]);

    var isContinuous = canvas.classed("continuous");

    var pxPerColor = Math.floor(width / NUM_COLOR_STEPS),
        colorIdx = 0;

    var c = d3.rgb(continuousScale(0));
    for(var x = 0; x < width; ++x) {
      if(isContinuous) c = d3.rgb(continuousScale(x));
      else if(x % pxPerColor === 0 && colorIdx !== NUM_COLOR_STEPS) {
        c = d3.rgb(discreteScale(colorIdx));
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
        interpolator = d3["interpolate" + spaceName],
        scale = d3.scaleLinear()
            .domain([0, input.classed("sequential") ? NUM_COLOR_STEPS-1 : 1])
            .interpolate(interpolator)
            .range([start, stop]),
        colors = Array.from(Array(NUM_COLOR_STEPS), (d,i) => scale(i));

    input.property("value", JSON.stringify(colors));
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
};
