var exportFunction = function(container) {
  var inPalette = [],
      obj = {},
      paletteInputField = container.select(".paletteInputField");
      paletteCanvas = container.select(".paletteCanvas");

  dispatch.on("addSelectedColor.export", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
    obj.updatePaletteCanvas();
    obj.updatePaletteInputField();
  });
  dispatch.on("deletePaletteColor.export", function() {
    var idx = inPalette.indexOf(this.color);
    inPalette.splice(idx, 1);
    obj.updatePaletteCanvas();
    obj.updatePaletteInputField();
  });

  obj.updatePaletteCanvas = function() {
    paletteCanvas.attr("width", inPalette.length);

    if(inPalette.length === 0) return;

    var width = paletteCanvas.attr("width"),
        context = paletteCanvas.node().getContext("2d"),
        image = context.createImageData(width, 1),
        i = -1,
        rgb, idx;

    for(var x = 0; x < width; ++x) {
      rgb = d3.rgb(inPalette[x]);

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
    paletteInputField.property("value", '"'+inPalette.join('","')+'"');
  }

  obj.addColorToPalette = function(newColor) {
    inPalette.push(d3.rgb(newColor).toString());
  };

  paletteInputField.on("blur", function() {
    if(this.value === "") return;
    var colors = this.value.replace(/\s/g, "").replace(/\"/g, "")
            .replace("[","").replace("]","")
            .split('",');
    if(colors.length < 1) return;

    dispatch.call("clearPalette");

    inPalette = [];

    // var colors = tkns.map(d => d.replace(/"/g, ""));
    colors.forEach(obj.addColorToPalette);
    colors.forEach(d => dispatch.call("addSelectedColor", { selectedColor: d }));
    obj.updatePaletteCanvas();
  });
};
