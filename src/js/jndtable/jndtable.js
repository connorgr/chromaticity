var jndtable = function(table) {
  var JND_PERCENT = 0.5,
      JND_SIZE = 0.1;
  var obj = {},
      paramMenu = table.select(".jndParameters");

  obj.addColorToTable = function(newColor) {
    var c = d3.rgb(newColor),
        rgbstr = c.toString(),
        curPalette = getCurrentColors(),
        palette = table.select(".palette");

    if(curPalette.indexOf(rgbstr) > -1) return;

    palette.append("td").style("background-color", rgbstr);
    table.selectAll(".ndRow").each(function(d,i) {
      var rowColor = curPalette[i],
          td = d3.select(this).append("td");

      if(d3.noticeablyDifferent(rgbstr, rowColor, JND_SIZE, JND_PERCENT) === false) {
        td.classed("notDifferent", true).text("⚠");
      }
    });

    var newRow = table.select("tbody").append("tr").classed("ndRow", true);
    newRow.append("td").style("background-color", rgbstr);

    curPalette.forEach(function(c) {
      var td = newRow.append("td");

      if(d3.noticeablyDifferent(rgbstr, c, JND_SIZE, JND_PERCENT) === false) {
        td.classed("notDifferent", true).text("⚠");
      }
    });
    newRow.append("td"); // self-row should be blank;
  };

  obj.updateColorTable = function() {
    var curPalette = getCurrentColors();
    table.selectAll(".ndRow").each(function(d,i) {
      var rowColor = curPalette[i],
          tr = d3.select(this);
      tr.selectAll("td").filter((d,i) => i > 0).each(function(td,j) {
        var c = curPalette[j];
        if(c === rowColor) return;
        var isND = d3.noticeablyDifferent(c, rowColor, JND_SIZE, JND_PERCENT);
        d3.select(this).classed("notDifferent", !isND)
            .text(isND ? "" : "⚠");
      });
    });
  };

  dispatch.on("addSelectedColor.jndtable", function() {
    obj.addColorToTable(this.selectedColor);
  });

  dispatch.on("deletePaletteColor.jndtable", function() {
    var curPalette = getCurrentColors(),
        cIdx = curPalette.indexOf(d3.rgb(this.color).toString()),
        colorCells = table.selectAll(".palette td").filter((d,i) => i > 0),
        rows = table.selectAll(".ndRow");

    curPalette.splice(cIdx, 1);

    colorCells.filter((d,i) => i === cIdx).remove();

    colorCells.each(function(d,i) { if(i === cIdx) d3.select(this).remove(); });

    rows.each(function(d,i) {
      var row = d3.select(this);
      if(i === cIdx) { row.remove(); return; }

      var rowColor = row.style("background-color");

      var cmps = row.selectAll("td").filter((d,i) => i > 0);
      cmps.filter((d,i) => i === cIdx).remove();

      cmps.each(function(d,j) {
        var td = d3.select(this),
            bg = td.style("background-color");
        if(bg === rowColor) return;

        var notDiff = !d3.noticeablyDifferent(bg, rowColor);
        td.classed("notDifferent", notDiff).text(notDiff ? "⚠" : "");
      });
    });
  });


  paramMenu.selectAll("li").each(function() {
    var li = d3.select(this),
        parameter = li.attr("data-parameter"),
        valText = li.select(".value");

    li.select("input").on("input", function() {
      var val = +d3.select(this).property("value");
      if(parameter === "percent") {
        JND_PERCENT = val;
        // HACK TODO remove Javascript imprecision rounding.
        val = val.toFixed(2).replace("0.","").replace(".","") + "%";
      } else if(parameter === "size") {
        JND_SIZE = val;
        val = val.toFixed(2);
      }
      valText.text(val);

      obj.updateColorTable();
      dispatch.call("updateJNDParameters", {percent: JND_PERCENT, size: JND_SIZE});
    });
  });


  // jnd calculator
  var va_text = table.select(".visualangle_va"),
      dist = table.select(".visualangle_distance"),
      size = table.select(".visualangle_size");

  dist.on("blur", calculateVA);
  size.on("blur", calculateVA);
  calculateVA();

  function calculateVA() {
    var d = +dist.property("value"),
        s = +size.property("value"),
        va = 2*Math.atan( (s/2) / d );
    va = va * 180 / Math.PI; // radian to degrees
    va_text.text(d3.format(".3f")(va));
  }


  function getCurrentColors() {
    var colors = [];
    table.select(".palette").selectAll("td").each(function(d,i) {
      if(i !== 0) colors.push(d3.select(this).style("background-color"));
    });
    return colors;
  }

  return obj;
};
