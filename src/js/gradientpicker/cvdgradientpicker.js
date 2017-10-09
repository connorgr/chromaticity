import {dispatch} from "../dispatch";
import {colorVisionDeficiency} from "../cvd";

export function CvdGradientPicker(container) {
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
      var row = d3.select(this),
          cvdType = row.attr("data-cvdType"),
          cvdFn = cvd.colorTransforms[cvdType];
      row.selectAll("td").filter((d,i) => i > 0)
          .each(function(d,i) {
            var td = d3.select(this),
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
        interpolator = d3["interpolate" + space[0].toUpperCase() + space.slice(1)],
        scale = d3.scaleLinear()
            .domain([0, width-1])
            .interpolate(interpolator)
            .range([start, stop]);

    var c;
    for(var x = 0; x < width; ++x) {
      c = d3.rgb(scale(x));
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
