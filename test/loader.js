var fs = require('fs'),
    haml = require('haml'),
    jsdom = require('jsdom');

global.document = jsdom.jsdom();
global.window = global.document.parentWindow;

var $ = require('jquery');

// turn off animations for tests
$.fx.off = true;

/* Compile haml extensions on the fly */
require.extensions['.haml'] = function (module, filename) {
    var contents = fs.readFileSync(filename).toString();
    var compiled = 'module.exports = ' + haml(contents).toString();
    return module._compile(compiled);
};