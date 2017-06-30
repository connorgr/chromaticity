var cvd = colorVisionDeficiency(),
    colorDB = colorStore(),
    exprt = exportFunction(d3.select(".exportOptionsContainer")),
    cp = colorpicker(d3.select(".colorpicker")),
    ip = imageprocessor(d3.select(".imageProcessor")),
    palette = colorPalette(d3.select(".paletteTable")),
    gp = gradientpicker(d3.select(".gradientPicker")),
    jnds = jndtable(d3.select(".jndTable")),
    cvdTable = cvdtable(d3.select(".cvdTable")),
    cvdGrads = cvdgradientpicker(d3.select(".cvdGradientPicker")),
    palettePreview = palettepreview(d3.select(".palettePreview")),
    visPreview = vispreview(d3.select(".visPreview")),
    share = uri();

d3.selectAll(".hiddenMenu").each(function() {
  var menu = d3.select(this),
      title = menu.select(".hiddenMenuTitle"),
      content = menu.select(".hiddenMenuContent");
  title.on("click", function() {
    var isHidden = content.style("visibility") === "hidden";
    content.style("visibility", isHidden ? "visible" : "hidden")
        .style("display", isHidden ? "inline-block" : "none");

  })
});
