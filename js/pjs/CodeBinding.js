/**
 * ...docs go here...
 */
(function tryExtend() {
  if(typeof Processing !== "undefined") {

    Processing.CodeBinding.prototype.setSketch = function(p) {
      this.p = p;
      var alias = this;

      /**
       * Update a sketch based on a change in a code fragment
       */
      p.updateFromFragment = function(fragment) {
        for(var pos=alias.fragments.length-1; pos>=0; pos--) {
          if(alias.fragments[pos] === fragment) {
            var code = alias.code,
                oldCode = code[pos],
                newCode = fragment.textContent;
            if(oldCode === newCode) return;
            code[pos] = newCode;
            try {
              var canvas = document.createElement("canvas");
              var newSketch = new Processing(canvas, code.join("\n"));

              // If there is an error during attaching,
              // roll back the changes in the codeBinding.
              newSketch.onError = function(e) {
                console.log("sketch did not successfully recompile");
                code[pos] = oldCode;
              };

              // If we succeeded, update the original sketch
              // based on the changes in the code.
              newSketch.onAttach = function() {
                oldCode = code[pos];
                if(oldCode === newCode) return;
                console.log("succesfully recompiled");
                
                var scope = newCode.match(/class\s+(\S+)\s*(\s\S+\s*)*{/);
                if (scope=== null) {
                  console.log("change on global");
                  // ... CODE GOES HERE
                } else {
                  scope = scope[1];
                  console.log("change in class " + scope);
                  
                  // update the class
                  p[scope] = newSketch[scope];

                  // This only updates the class definition,
                  // so all instances of this class still need
                  // to be updated...
                  
                }
              };
            } catch(e) {
              // bad code, don't actually do any updating
            }
          } // end if
        } // end for
      }; // end p.updateFromFragment()
    };
  } else { setTimeout(tryExtend, 100); }
}());