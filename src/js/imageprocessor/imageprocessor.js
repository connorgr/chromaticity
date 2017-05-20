var imageprocessor = function(container) {
  var canvas = container.select("canvas").node(),
      context = canvas.getContext("2d"),
      colorList = container.select(".uniqueColors"),
      dropArea = container.select("p"),
      dropImg = container.select(".dropImg");

  dropArea.on('dragover', dragOverArea);
  dropArea.on('drop', selectFile);

  dropImg.on("load", buildCanvas);

  function buildCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(dropImg.node(), 0, 0, canvas.width, canvas.height);

    var image = context.getImageData(0, 0, canvas.width, canvas.height),
        pxs = Array(canvas.width*canvas.height);

    // quickly iterate over all pixels
    var i = -1;
    for(var x = 0; x < canvas.width*canvas.height; ++x) {
      pxs[x] = d3.rgb(image.data[++i], image.data[++i], image.data[++i]).toString();
      ++i;
    }

    var uniqueColors = pxs.filter(function(d, i, self) {
              return self.indexOf(d) === i;
            })
            .reduce(function(acc, d, i) {
              if(acc.length === 0) return [d];

              var i = 0, isND;
              for(var i = 0; i<acc.length; i++) {
                isND = d3.noticeablyDifferent(acc[i], d);
                if(isND === false) return acc;
              }
              acc.push(d);
              return acc;
            }, []);

    colorList.selectAll("li").remove();
    colorList.selectAll("li")
        .data(uniqueColors)
        .enter()
        .append("li")
            .style("background-color", d => d)
            .on("click", function(d) {
              dispatch.call("addSelectedColor",{selectedColor: d});
            });
  }

  function dragOverArea(e) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    d3.event.dataTransfer.dropEffect = 'copy';
  }

  function selectFile() {
    d3.event.stopPropagation();
    d3.event.preventDefault();

    var files = d3.event.dataTransfer.files;
    if(files.length < 1) return;

    var file = files[0];
    if (!file.type.match('image.*')) {
        return;
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = function(e) {
      dropImg.node().src=e.target.result;
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL(file);

    // var fileDataUrl = FileReader.readAsDataURL(files[0]);
    //
    // // files is a FileList of File objects. List some properties.
    // var output = [];
    // for (var i = 0, f; f = files[i]; i++) {
    //   output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
    //               f.size, ' bytes, last modified: ',
    //               f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
    //               '</li>');
    // }

    // console.log(output);
  }
};
