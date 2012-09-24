"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(["jquery", "backbone-events"], function($, BackboneEvents) {
  function LivePreview(options) {
    var self = {codeMirror: options.codeMirror},
        codeMirror = options.codeMirror,
        Slowparse = options.slowparse,
        iframe = document.createElement("iframe"),
        frame;
   
    // set up the iframe
    options.previewArea.append(iframe);
    frame = new Frame(iframe);

    codeMirror.on("reparse", function(event) {
      var isPreviewInDocument = $.contains(document.documentElement,
                                           options.previewArea[0]);
      if (!isPreviewInDocument) {
        if (window.console)
          window.console.log("reparse triggered, but preview area is not " +
                             "attached to the document.");
        return;
      }

      if (!event.error || options.ignoreErrors) {
      
        // shortcut!
        var ret = Slowparse.HTML(document, event.sourceCode);
        if(ret.error) { return; }

        var d1 = document.createElement("div");
        d1.innerHTML = event.sourceCode;
        var d2 = document.createElement("div");
        d2.innerHTML = frame.body.innerHTML;

        diffApply(d1, d2, frame);
      }
    });

    BackboneEvents.mixin(self);
    return self;
  };
  
  return LivePreview;
});
