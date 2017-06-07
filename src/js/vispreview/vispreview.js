var vispreview = function(container) {
  var inPalette = [],
      scatterSvg = container.select(".scatterPreview"),
      obj = {};
  drawScatter();

  dispatch.on("addSelectedColor.visPreview", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(this.selectedColor);
  });

  dispatch.on("deletePaletteColor.visPreview", function() {
    var idx = inPalette.indexOf(this.color);
    if(idx < 0) return;

    inPalette.splice(idx, 1);
    colorizeScatter();
  });

  obj.addColorToPalette = function(color) {
    inPalette.push(color);
    colorizeScatter();
  };

  function colorizeScatter() {
    scatterSvg.select(".circles").selectAll("circle")
        .style("fill",(d,i) => inPalette[i % inPalette.length]);
  }

  function drawScatter() {
    var outline = generateChartBasics(scatterSvg, true),
        margin = outline.margin, width = outline.width, height = outline.height,
        svg = outline.svg, x = outline.x, y = outline.y;

    var circles = svg.append("g").classed("circles", true);
    for(var i = 0; i < 100; i++) {
      circles.append("circle")
          .attr("cx", x(Math.random()))
          .attr("cy", y(Math.random()))
          .attr("r", 5);
    }
  }

  function generateChartBasics(svgObj, makeAxis) {
    var margin = { top: 15, right: 15, bottom: 20, left: 15 },
        width = +svgObj.attr("width") - margin.left - margin.right,
        height = +svgObj.attr("height") - margin.top - margin.bottom;

    var svg = svgObj.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")");

    var x = d3.scaleLinear().domain([0,1]).range([0, width]),
        y = d3.scaleLinear().domain([0,1]).range([height, 0]);

    if(makeAxis) {
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(0));
      svg.append("g")
        .call(d3.axisLeft(y).ticks(0));
    }

    return {
      height: height, margin: margin, svg: svg, width: width, x: x, y: y
    };
  }
};
