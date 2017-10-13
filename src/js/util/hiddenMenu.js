import * as d3 from "d3";

export function initializeHiddenMenus() {
  d3.selectAll(".hiddenMenu").each(function() {
    var menu = d3.select(this),
        title = menu.select(".hiddenMenuTitle"),
        content = menu.select(".hiddenMenuContent");
    title.on("click", function() {
      var isHidden = content.style("visibility") === "hidden";
      content.style("visibility", isHidden ? "visible" : "hidden")
          .style("display", isHidden ? "inline-block" : "none");

    });
  });
}
