var cvdtable = function(table) {
  var obj = {};

  var JND_PERCENT = 0.5,
      JND_SIZE = 0.1;

  obj.addColorToTable = function(newColor) {
    var c = d3.rgb(newColor),
        rgbstr = c.toString(),
        curPalette = getCurrentColors();

    if(curPalette.indexOf(rgbstr) > -1) return;

    table.selectAll("tbody tr").each(function() {
      var tr = d3.select(this),
          cvdType = tr.attr("class"),
          color;

      if(cvdType === "palette") color = rgbstr;
      else color = cvd.colorTransforms[cvdType](rgbstr);

      tr.append("td").style("background-color", color);
    });

    updateJNDs();
  };

  dispatch.on("addSelectedColor.cvdtable", function() {
    obj.addColorToTable(this.selectedColor);
  });

  dispatch.on("deletePaletteColor.cvdtable", function() {
    var curPalette = getCurrentColors(),
        cIdx = curPalette.indexOf(d3.rgb(this.color).toString());

    table.selectAll("tr").each(function() {
      var row = d3.select(this)
          tds = row.selectAll("td").filter((d,i) => i > 0);
      tds.filter((d,i) => i === cIdx).remove();
    });

    updateJNDs();
  });


  function getCurrentColors() {
    var colors = [];
    table.select(".palette").selectAll("td").each(function(d,i) {
      if(i !== 0) colors.push(d3.select(this).style("background-color"));
    });
    return colors;
  }

  function updateJNDs() {
    table.selectAll("tbody tr").each(function() {
      var tr = d3.select(this),
          cvdType = tr.attr("class");

      var rowColors = [];
      tr.selectAll("td").each(function(d,i) {
        if (i === 0) return;
        rowColors.push(d3.select(this).style("background-color"));
      });

      tr.selectAll("td").each(function(d,i) {
        if(i === 0) return;
        var td = d3.select(this),
            tdBG = td.style("background-color"),
            tdBGIdx = rowColors.indexOf(tdBG),
            isND = rowColors.reduce(function(acc, d, i) {
              if(i === tdBGIdx) return acc;
              var ndResult = d3.noticeablyDifferent(d, tdBG, JND_SIZE, JND_PERCENT);
              return acc && ndResult;
            }, true);

        td.classed("notDifferent", isND === false)
            .text(isND === false ? "⚠" : "");
      });
    });
  }


  return obj;
}
