import * as d3 from "d3";
import {dispatch} from "../dispatch";
import {rgb2hex} from "../util/rgb2hex";

export function ColorPaletteTable(container) {
  this.colorpalettetable = makeColorPaletteTable(container);
}

var makeColorPaletteTable = function(tbl) {
  var makeID = Date.now().toString();

  var inPalette = [];

  var obj = {};

  dispatch.on("addSelectedColor.colorPalette"+makeID, function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
  });

  dispatch.on("clearPalette.colorPalette"+makeID, function() {
    inPalette = [];
    tbl.select("tbody").selectAll("tr").remove();
  });

  dispatch.on("deletePaletteColor.colorPalette"+makeID, function() {
    var idx = inPalette.indexOf(this.color);
    inPalette.splice(idx, 1);
    tbl.select("tbody").selectAll("tr").each(function(d,i) {
      if(i !== idx) return;
      d3.select(this).remove();
    });
  });

  obj.addColorToPalette = function(newColor) {
    var jab = d3.jab(newColor),
        lab = d3.lab(newColor),
        rgb = d3.rgb(newColor);

    inPalette.push(rgb.toString());

    var jabstr = "Jab("+[jab.J, jab.a, jab.b].map(Math.round).join(",")+")",
        labstr = "Lab("+[lab.l, lab.a, lab.b].map(Math.round).join(",")+")";

    var newRow = tbl.select("tbody").append("tr");
    newRow.append("td").append("span").classed("deletePaletteTableColor", true)
        .text("×")
        .on("click", function() {
          var swatch = d3.select(this.parentNode.parentNode).select(".swatch"),
              color = swatch.style("background-color");
          dispatch.call("deletePaletteColor", {
            color: d3.rgb(color).toString()
          });
        });
    tbl.selectAll("tbody input[type=\"radio\"]")
        .property("checked", false);
    newRow.append("td").append("input").attr("type", "radio")
        .property("checked", true).on("click", function() {
          d3.selectAll(".paletteTable tbody input[type=\"radio\"]")
              .property("checked", false);
          d3.select(this).property("checked", true);
          dispatch.call("updateSelectedColor", {selectedColor: rgb});
        });
    newRow.append("td").classed("swatch", true).style("background", newColor);
    newRow.append("td").text(rgb2hex(newColor));
    newRow.append("td").text(rgb.toString().replace(/\s/g, ""));
    newRow.append("td").text(labstr);
    newRow.append("td").text(jabstr);
  };

  return obj;
};
