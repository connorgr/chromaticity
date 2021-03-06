import * as d3 from "d3";
import {dispatch} from "../dispatch";

export function PaletteExporter(container) {
  this.paletteExporter = makePaletteExporter(container);
}

var makePaletteExporter = function(container) {
  var inPalette = [],
      obj = {},
      paletteCanvas = container.select(".paletteCanvas"),
      paletteInputField = container.select(".paletteInputField"),
      paletteShareField = container.select(".paletteShareField");

  dispatch.on("addSelectedColor.export", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
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
        rgb;

    var pxForColor = Math.floor(width / inPalette.length),
        palIdx = -1;

    for(var x = 0; x < width; ++x) {
      if(x % pxForColor === 0 && palIdx !== inPalette.length-1) palIdx++;
      rgb = d3.rgb(inPalette[palIdx]);

      if(rgb.displayable()) {
        image.data[++i] = rgb.r;
        image.data[++i] = rgb.g;
        image.data[++i] = rgb.b;
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
    inPalette.push(d3.rgb(newColor).toString());
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
        .filter(d => d3.rgb(d).displayable());
    /* eslint-enable */
    colors.forEach(obj.addColorToPalette);
    colors.forEach(d => dispatch.call("addSelectedColor", {
      selectedColor: d
    }));
    obj.updatePaletteCanvas();

    paletteInputField.property("value", "\""+colors.join("\",\"")+"\"");
  });
};
