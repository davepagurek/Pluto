module.exports = function(pluto) {
    require("shelljs/global");
    require('es6-promise').polyfill();
    var request = require('popsicle');
    var welcomeModule = {
        "waitDelay": 3.5
    };

    welcomeModule.lines = [];

    var readLines = function() {
        while(welcomeModule.lines.length > 0) {
            pluto.say(welcomeModule.lines.shift());
        }
    };

    var addLine = function(line) {
        welcomeModule.lines.push(line);

        //Wait five seconds before reading things
        if (welcomeModule.timer) clearTimeout(welcomeModule.timer);
        welcomeModule.timer = setTimeout(readLines, welcomeModule.waitDelay*1000);
    };

    welcomeModule.listeners = {
        "users::signin": function(user) {
            if (user.name == "Andrew") {
                addLine("Hello, " + user.name + ". Once you start Russian, there's no time for Stalin.");
            }else if (user.name=="Dave"){
                addLine("I'm sorry Dave, I'm afraid I can't let you do that!");
            }else if (user.name=="Ruo Tai"){
                addLine("Hello Ruo Tai, please check twice before you commit. OH YEAH!");
            }else if (user.name=="Yu Chen"){
                addLine("Hola, Yu Chen. Did you know that there are more than 1000 species of Cats around the world. MeeeWow!");
            }else if (user.name=="Steven"){
                addLine("Hey there. Stevie. Remember, Silence is consent.");
            } else {

                request("http://www.davepagurek.com/badjokes/joke").then(function(res) {
                    joke = JSON.parse(res.body);
                    addLine("Hello, " + user.name + ". " + joke.q);
                    addLine(joke.a);
                });
            }
        },
        "users::signout": function(user) {
            addLine("Goodbye, " + user.name);
        },
        "users::register": function(user) {
            addLine("Hello, " + user.name + ". Nice to meet you.");
        }
    };

    return welcomeModule;
}
