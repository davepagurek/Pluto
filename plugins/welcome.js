module.exports = function(pluto) {
    require("shelljs/global");
    require('es6-promise').polyfill();
    var request = require('popsicle');
    var welcomeModule = {};

    welcomeModule.listeners = {
        "users::signin": function(user) {
            if (user.name == "Andrew") {
                exec('echo "Hello, ' + user.name + '. Once you start Russian, there\'s no time for Stalin." | festival --tts');
            }else if (user.name=="Dave"){
                exec ('echo "I\'m sorry Dave, I\'m afraid I can\'t let you do that!" | festival --tts');
            }else if (user.name=="Ruo Tai"){
                exec ('echo "Hello Ruo Tai, please check twice before you commit. OH YEAH!"| festival --tts');
            }else if (user.name=="Yu Chen"){
                exec ('echo "Hola, Yu Chen. Did you know that there are more than 1000 species of Cats around the world. MeeeWow!" | festival --tts');
            }else if (user.name=="Steven"){
                exec ('echo "Heeey there. Stevie. Remember, Silence is consent." | festival --tts');
            } else {

                request("http://www.davepagurek.com/badjokes/joke").then(function(res) {
                    joke = JSON.parse(res.body);
                    exec('echo "Hello, ' + user.name + '. ' + joke.q + '" | festival --tts');
                    exec('echo "' + joke.a + '" | festival --tts');
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
