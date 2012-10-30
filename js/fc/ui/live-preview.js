"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(["jquery", "backbone-events"], function($, BackboneEvents) {
  function LivePreview(options) {
    var self = {codeMirror: options.codeMirror, title: ""},
        codeMirror = options.codeMirror,
        iframe;
        
    // triggers whenever the cursor or text selection is manipulated
    codeMirror.on("cursor-activity", function(event) {
      console.log(event);
      /*
        var p = event.MONKEY, <select element(s)>
            parseInfo = p.parseInfo,
            start = parseInfo.openTag.start,
            end = parseInfo.closeTag.end,
            text = codeMirror.getRange(codeMirror.posFromIndex(start),codeMirror.posFromIndex(end));
            
      */
    });

    // triggers whenever the user types (or removes) text in codemirror
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
        var x = 0,
            y = 0,
            docFrag = event.document, // DOM document
            doc, wind;
        
        console.log("BREAK");
     
        
        if (iframe) {
          doc = $(iframe).contents()[0];
          wind = doc.defaultView;
          x = wind.pageXOffset;
          y = wind.pageYOffset;
          $(iframe).remove();
        }

        iframe = document.createElement("iframe");
        options.previewArea.append(iframe);
        
        // Update the preview area with the given HTML.
        doc = $(iframe).contents()[0];
        wind = doc.defaultView;

        doc.open();
        doc.write(event.sourceCode);
        doc.close();

        // Insert a BASE TARGET tag so that links don't open in
        // the iframe.
        var baseTag = doc.createElement('base');
        baseTag.setAttribute('target', '_blank');
        doc.querySelector("head").appendChild(baseTag);
        
        // TODO: If the document has images that take a while to load
        // and the previous scroll position of the document depends on
        // their dimensions being set on load, we may need to refresh
        // this scroll position after the document has loaded.
        wind.scroll(x, y);
        
        self.trigger("refresh", {
          window: wind,
          documentFragment: event.document
        });

        if (wind.document.title != self.title) {
          self.title = wind.document.title;
          self.trigger("change:title", self.title);
        }
      }
    });

    BackboneEvents.mixin(self);
    return self;
  };
  
  return LivePreview;
});
