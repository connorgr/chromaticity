var jndtable = function(table) {
  var obj = {
    addColorToTable: function(newColor) {
      var c = d3.rgb(newColor),
          rgbstr = c.toString(),
          curPalette = getCurrentColors(),
          palette = table.select(".palette");

      if(curPalette.indexOf(rgbstr) > -1) return;

      palette.append("td").style("background-color", rgbstr);
      table.selectAll(".ndRow").each(function(d,i) {
        var rowColor = curPalette[i],
            td = d3.select(this).append("td");

        if(d3.noticeablyDifferent(rgbstr, rowColor) === false) {
          td.classed("notDifferent", true).text("⚠");
        }
      });

      var newRow = table.select("tbody").append("tr").classed("ndRow", true);
      newRow.append("td").style("background-color", rgbstr);

      curPalette.forEach(function(c) {
        var td = newRow.append("td");

        if(d3.noticeablyDifferent(rgbstr, c) === false) {
          td.classed("notDifferent", true).text("⚠");
        }
      });
      newRow.append("td"); // self-row should be blank;
    }
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


  function getCurrentColors() {
    var colors = [];
    table.select(".palette").selectAll("td").each(function(d,i) {
      if(i !== 0) colors.push(d3.select(this).style("background-color"));
    });
    return colors;
  }

  return obj;
};
