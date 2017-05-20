var colorStore = function() {
  var colors = [],
      rgbs = [];

  dispatch.on("addSelectedColor.colorStore", function() {
    colorDB.addColor(this.selectedColor);
  });

  return {
    addColor : function(c) {
      colors.push(c);
      rgbs.push(d3.rgb(c));
    },
    getColors : function() { return colors; },
    getRGBColors : function() { return rgbs; }
  };
}
