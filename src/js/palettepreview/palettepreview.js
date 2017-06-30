var palettepreview = function(container) {
  var colorList = container.select("ul"),
      inPalette = [];
  var obj = {};

  obj.addColorToPreview = function(newColor) {
    colorList.append("li")
        .style("background-color", newColor)
        .on("click", function() {
          var rgb = d3.select(this).style("background-color");
          dispatch.call("deletePaletteColor", {color: rgb});
        });
    inPalette.push(d3.rgb(newColor).toString());
    updatePreview();
  }

  dispatch.on("addSelectedColor.palettePreview", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
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
      d3.select(this).remove();
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
