"use strict";

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
define(["underscore", "jquery", "backbone"], function(_, $, Backbone) {
  function LivePreview(options) {
    var self = {codeMirror: options.codeMirror},
        codeMirror = options.codeMirror,
        iframe;

    codeMirror.on("reparse", function(event) {
      if (!event.error || options.ignoreErrors) {
        var x = 0,
            y = 0,
            docFrag = event.document,
            doc, wind;
        
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
      }
    });

    _.extend(self, Backbone.Events);
    return self;
  };
  
  return LivePreview;
});
