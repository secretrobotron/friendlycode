/**
 * Processing.js start-up handler
 */
(function setupReload() {
  if(typeof Processing !== "undefined") { Processing.reload(); }
  else { setTimeout(setupReload, 250); }}());

/**
 * Processing.js sketch fragment updates
 */
function update(source) {
  Processing.reload();
/*
  try {
    // throw-away canvas element
    var canvas = document.createElement("canvas");
    canvas.id = "testSketch";

    // source to load from file
    var sources = document.getElementById("gameCanvas").getAttribute("data-processing-sources").split(/\s+/);

    // source from aggregate fragment code
    var fragments = document.querySelectorAll("script[type='text/processing']");
    var f, l=fragments.length, fragment, text, code = [];
    for(f=0; f<l; f++) {
      fragment = fragments[f];
      text = fragment.textContent;
      if(fragment === source) {
        // this is the fragment that got changed
        text = "//BEGIN CHANGESET//\n" + text + "//END CHANGESET//\n";
      }
      code.push(text);
    }

    // let's try this!
    Processing.loadSketchFromSources(canvas, sources, code);
    
    (function tryReplace(canvas) {
      var newSketch = Processing.getInstanceById(canvas.id);
      if(newSketch && newSketch.finishedInitializing && newSketch.finishedInitializing()) {

        // for now, we replace the old sketch with the new sketch
        var oldCanvas = document.getElementById("gameCanvas"),
            owner = oldCanvas.parentNode;
        owner.replaceChild(canvas, oldCanvas);
        canvas.setAttribute("data-processing-sources", oldCanvas.getAttribute("data-processing-sources"));
        canvas.setAttribute("data-diff-ignore", oldCanvas.getAttribute("data-diff-ignore"));
        canvas.id = oldCanvas.id;
        // for now, we replace the old sketch with the new sketch

      } else { setTimeout(function(){tryReplace(canvas);},250); }}(canvas));
    
  }
  catch(e) { console.log(e); }
*/
}