function rgb2hex(rgbstr){
  var rgb = rgbstr.replace('rgb(','').replace(')','').split(',').map(d => +d),
      r = rgb[0], g = rgb[1], b = rgb[2],
      bin = r << 16 | g << 8 | b;
  return (function(h){
      return new Array(7-h.length).join("0")+h
  })(bin.toString(16).toUpperCase())
}
