var cvd = colorVisionDeficiency(),
    colorDB = colorStore(),
    cp = colorpicker(d3.select(".colorpicker")),
    ip = imageprocessor(d3.select(".imageProcessor")),
    palette = colorPalette(d3.select(".paletteTable")),
    gp = gradientpicker(d3.select(".gradientPicker")),
    jnds = jndtable(d3.select(".jndTable")),
    cvdTable = cvdtable(d3.select(".cvdTable"));
