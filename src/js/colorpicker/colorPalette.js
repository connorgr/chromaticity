var colorPalette = function(tbl) {
  var inPalette = [],
      palettePreview = tbl.select(".palettePreview");

  var obj = {};
  obj.updatePalettePreview = function() {
    palettePreview.attr("width", inPalette.length);

    if(inPalette.length === 0) return;

    var width = palettePreview.attr("width"),
        context = palettePreview.node().getContext("2d"),
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
  }

  obj.addColorToPalette = function(newColor) {
    var jab = d3.jab(newColor),
        lab = d3.lab(newColor),
        rgb = d3.rgb(newColor);

    inPalette.push(rgb.toString());

    var jabstr = "Jab("+[jab.J, jab.a, jab.b].map(Math.round).join(',')+")",
        labstr = "Lab("+[lab.l, lab.a, lab.b].map(Math.round).join(',')+")"

    var newRow = tbl.select("tbody").insert("tr", ":first-child");
    newRow.append("td").append("span").classed("deletePaletteTableColor", true).text("×")//"✖")
        .on("click", function() {
          inPalette.splice(inPalette.indexOf(rgb.toString()), 1);
          newRow.remove();
          obj.updatePalettePreview();
          dispatch.call("deletePaletteColor", {color: rgb});
        });
    tbl.selectAll('tbody input[type="radio"]')
        .property("checked", false);
    newRow.append("td").append("input").attr("type", "radio")
        .property("checked", true).on("click", function() {
          d3.selectAll('.paletteTable tbody input[type="radio"]').property("checked", false);
          d3.select(this).property("checked", true);
          dispatch.call("updateSelectedColor", {selectedColor: rgb});
        });
    newRow.append("td").classed("swatch", true).style("background", newColor);
    newRow.append("td").text(rgb2hex(newColor));
    newRow.append("td").text(rgb.toString());
    newRow.append("td").text(jabstr);
    newRow.append("td").text(labstr);

    obj.updatePalettePreview();
    tbl.select(".paletteInputField").property("value", '"'+inPalette.join('","')+'"');
  };

  dispatch.on("addSelectedColor.colorPalette", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
  });

  tbl.select(".paletteInputField").on("blur", function() {
    tbl.select("tbody").selectAll("tr").each(function() {
      var color = d3.select(this).select(".swatch").style("background-color");
      dispatch.call("deletePaletteColor", {color: color});
      d3.select(this).select(".deletePaletteTableColor").on("click")();
    });

    if(this.value === "") return;

    var tkns = this.value.replace(/\s/g, "").replace("[","").replace("]","")
            .split('",');
    if(tkns.length < 1) return;
    var colors = tkns.map(d => d.replace(/"/g, ""));
    colors.forEach(obj.addColorToPalette)
    colors.forEach(d => dispatch.call("addSelectedColor", { selectedColor: d }));
  });

  return obj;
}
