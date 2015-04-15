var $ = require('jquery');

module.exports = function (demo) {

    var demos = $('body').find('#demos');

    demos.append('<h3>' + demo.title + '</h3>');

    demos.append('<p>' + demo.description + '</p>');

    demos.append('<h4>Example</h4>');

    var el = $('<div></div>');
    demos.append(el);
    demos.append(demo.present(el));

    demos.append('<hr/>');
};