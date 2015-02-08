module.exports = function(pluto) {
    require("shelljs/global");
    require('es6-promise').polyfill();
    var request = require('popsicle');
    var welcomeModule = {};

    welcomeModule.listeners = {
        "users::signin": function(user) {
            if (user.name == "Andrew") {
                exec('echo "Hello, ' + user.name + '. Once you start Russian, there\'s no time for Stalin." | festival --tts');
            } else {
                request("http://www.davepagurek.com/badjokes/joke").then(function(res) {
                    joke = JSON.parse(res.body);
                    exec('echo "Hello, ' + user.name + '. ' + joke.q + ' ' + joke.a + '" | festival --tts');
                });
            }
        },
        "users::signout": function(user) {
            exec('echo "Goodbye, ' + user.name + '" | festival --tts');
        },
        "users::register": function(user) {
            exec('echo "Hello, ' + user.name + '. Nice to meet you." | festival --tts');
        }
    };

    return welcomeModule;
}
