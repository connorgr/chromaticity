import * as d3 from "d3";

import {ColorPaletteTable} from "./colorPaletteTable/colorPaletteTable";
import {ColorPicker} from "./colorPicker/colorPicker";
import {CvdGradientPicker} from "./gradientPicker/cvdGradientPicker";
import {CvdJndTable} from "./jndTable/cvdJndTable";
import {GradientPicker} from "./gradientPicker/gradientPicker";
import {ImageColorPicker} from "./imageColorPicker/imageColorPicker";
import {JndTable} from "./jndTable/jndTable";
import {PaletteExporter} from "./paletteExporter/paletteExporter";
import {PalettePreview} from "./palettePreview/palettePreview";
import {VisualizationPreview} from
    "./visualizationPreview/visualizationPreview";

import {initializeHiddenMenus} from "./util/hiddenMenu";
import {initializeURISharing} from "./share/uri";

/* eslint-disable no-unused-vars */
var cvdGraientPicker = new CvdGradientPicker(d3.select(".cvdGradientPicker")),
    cvdJndTable = new CvdJndTable(d3.select(".cvdTable")),
    gradientPicker = new GradientPicker(d3.select(".gradientPicker")),
    imageColorPicker = new ImageColorPicker(d3.select(".imageColorPicker")),
    jndTable = new JndTable(d3.select(".jndTable")),
    paletteExporter = new PaletteExporter(d3.select(".exportOptionsContainer")),
    palettePreview = new PalettePreview(d3.select(".palettePreview")),
    paletteTable = new ColorPaletteTable(d3.select(".paletteTable")),
    picker = new ColorPicker(d3.select(".colorpicker")),
    visPreview = new VisualizationPreview(d3.select(".visPreview"));
/* eslint-enable no-unused-vars */

// Must follow initialization of all interface components, as the URI color
// palette parser will dispatch add color messages
initializeURISharing();

// Add hide/show for all hidden menues
initializeHiddenMenus();
