var vispreview = function(container) {
  var inPalette = [],
      barSvg = container.select(".barPreview"),
      mapSvg = container.select(".mapPreview"),
      scatterSvg = container.select(".scatterPreview"),
      margin = { top: 15, right: 15, bottom: 20, left: 15 },
      obj = {};

  var SCATTER_OPTIONS = {
    RADIUS : 5,
    SHOW_FILL : false,
    SHOW_STROKE : true,
    STROKE_WIDTH : 1
  };

  var MAP_OPTIONS = {
    SHOW_STROKE : true,
    STROKE_COLOR : 'white',
    STROKE_WIDTH : 1
  }

  var numMapPoly = mapSvg.selectAll("polygon").size(),
      mapSvgPolyData = new Array(numMapPoly);

  for(var i = 0; i < numMapPoly; i++) mapSvgPolyData[i] = i;
  mapSvgPolyData = d3.shuffle(mapSvgPolyData);

  drawBar();
  drawScatter();

  container.select(".scatterOptions_radius").on("input", function() {
    SCATTER_OPTIONS.RADIUS = +d3.select(this).property("value");
    updateScatter();
  });
  container.select(".scatterOptions_showStroke").on("change", function() {
    SCATTER_OPTIONS.SHOW_STROKE = !SCATTER_OPTIONS.SHOW_STROKE;
    updateScatter();
  });
  container.select(".scatterOptions_showFill").on("change", function() {
    SCATTER_OPTIONS.SHOW_FILL = !SCATTER_OPTIONS.SHOW_FILL;
    updateScatter();
  });
  container.select(".scatterOptions_stroke_width").on("input", function() {
    SCATTER_OPTIONS.STROKE_WIDTH = +d3.select(this).property("value");
    updateScatter();
  });

  container.select(".mapOptions_showStroke").on("change", function() {
    MAP_OPTIONS.SHOW_STROKE = !MAP_OPTIONS.SHOW_STROKE;
    updateMap();
  });
  container.select(".mapOptions_stroke_color").on("blur", function() {
    MAP_OPTIONS.STROKE_COLOR = d3.select(this).property("value");
    updateMap();
  });
  container.select(".mapOptions_stroke_width").on("input", function() {
    MAP_OPTIONS.STROKE_WIDTH = +d3.select(this).property("value");
    updateMap();
  });

  dispatch.on("addSelectedColor.visPreview", function() {
    var rgbstr = d3.rgb(this.selectedColor).toString();
    if(inPalette.indexOf(rgbstr) > -1) return;
    obj.addColorToPalette(rgbstr);
  });

  dispatch.on("clearPalette.visPreview", function() {
    inPalette = [];
    updateScatter();
    updateBar();
    updateMap();
  });

  dispatch.on("deletePaletteColor.visPreview", function() {
    var rgbstr = d3.rgb(this.color).toString(),
        idx = inPalette.indexOf(rgbstr);
    if(idx < 0) return;

    inPalette.splice(idx, 1);
    updateScatter();
    updateBar();
    updateMap();
  });

  obj.addColorToPalette = function(color) {
    inPalette.push(color);
    updateScatter();
    updateBar();
    updateMap();
  };


  function updateBar() {
    var width = barSvg.attr("width") - margin.left - margin.right,
        height = barSvg.attr("height") - margin.top - margin.bottom;

    var x = d3.scaleBand().domain(inPalette).range([0, width]).padding(0.1),
        y = d3.scaleLinear().domain([0,1]).range([height, 0]),
        g = barSvg.select(".bars");

    var bars = g.selectAll("rect").data(inPalette);

    bars.enter()
        .append("rect")
            .each(function() {
              var bar = d3.select(this),
                  yVal = 0;
              while(yVal < 0.25) yVal = y(Math.random());
              bar.attr("y", yVal).attr("height", height -yVal);
            })
        .merge(bars)
            .style("fill", d => d)
            .attr("x", d => x(d))
            .attr("width", x.bandwidth());

    bars.exit().remove();

  }


  function updateMap() {
    mapSvg.selectAll("polygon")
        .style("fill", (d,i) => inPalette[mapSvgPolyData[i]  % inPalette.length])
        .style("stroke",(d,i) => MAP_OPTIONS.SHOW_STROKE ? MAP_OPTIONS.STROKE_COLOR : "none")
        .style("stroke-width",(d,i) => MAP_OPTIONS.STROKE_WIDTH);
  }


  function updateScatter() {
    scatterSvg.select(".circles").selectAll("circle")
        .attr("r", SCATTER_OPTIONS.RADIUS)
        .style("fill",(d,i) => SCATTER_OPTIONS.SHOW_FILL ? inPalette[i % inPalette.length] : "none")
        .style("stroke",(d,i) => SCATTER_OPTIONS.SHOW_STROKE ? inPalette[i % inPalette.length] : "none")
        .style("stroke-width",(d,i) => SCATTER_OPTIONS.STROKE_WIDTH);
  }

  function drawBar() {
    var outline = generateChartBasics(barSvg, true),
        margin = outline.margin, width = outline.width, height = outline.height,
        svg = outline.svg;

    svg.append("g").classed("bars", true);
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
          .attr("r", SCATTER_OPTIONS.RADIUS)
          .style("stroke-width",(d,i) => SCATTER_OPTIONS.STROKE_WIDTH);
    }
  }

  function generateChartBasics(svgObj, makeAxis) {
    var width = +svgObj.attr("width") - margin.left - margin.right,
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
