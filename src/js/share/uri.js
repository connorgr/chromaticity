var uri = function() {
  var inPalette = [];
  loadUri();

  dispatch.on("addSelectedColor.uri", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    inPalette.push(rgbstr);
    updateUri();
  });

  dispatch.on("clearPalette.uri", function() {
    inPalette = [];
    updateUri();
  });

  dispatch.on("deletePaletteColor.uri", function() {
    var idx = inPalette.indexOf(this.color);
    inPalette.splice(idx, 1);
    updateUri();
  });


  function loadUri() {
    var params = document.location.search.split("&"),
        palette = params.filter(d => d.indexOf("palette=") > -1);

    if (palette.length === 0) return;
    palette = palette[0].replace("?","").replace("palette=","").split(";");
    var colors = palette.map(d => d3.rgb(d)).filter(d => d.displayable());
    inPalette = colors.map(d => d.toString());
    inPalette = inPalette.filter((d,i) => inPalette.indexOf(d) === i);

    if(inPalette.length > 0) {
      inPalette.forEach(d => dispatch.call("addSelectedColor", {selectedColor: d}));
    }
  }


  function updateUri() {
    var txt = "?palette="+inPalette.map(d => d.toString().replace(/\s/g,"")).join(";");
    document.location.search = txt;
  }
}
