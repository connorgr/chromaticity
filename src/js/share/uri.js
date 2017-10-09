import {dispatch} from "../dispatch";

export function initializeURISharing() {
  var inPalette = [];

  var params = document.location.search.split("&"),
      palette = params.filter(d => d.indexOf("palette=") > -1);

  if (palette.length === 0) return;
  palette = palette[0].replace("?","").replace("palette=","").split(";");
  var colors = palette.map(d => d3.rgb(d)).filter(d => d.displayable());
  inPalette = colors.map(d => d.toString());
  inPalette = inPalette.filter((d,i) => inPalette.indexOf(d) === i);

  if(inPalette.length > 0) {
    inPalette.forEach(d => dispatch.call("addSelectedColor", {selectedColor: d}));
  }
}
