#!/usr/bin/env node

var JSLINT = '"./node_modules/jshint/bin/hint"';

var files = "\
js/editor.js \
js/main.js \
js/help.js \
js/late-socials.js \
js/publish.js \
js/share.js \
slowparse/slowparse.js \
";

require('shelljs/make');

target.check = function() {
  target['check-lint']();
};

target['check-lint'] = function() {
  echo('### Linting JS files');
  exec(JSLINT + ' ' + files);
};
