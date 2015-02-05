module.exports = function(pluto) {
    require("shelljs/global");
    var welcomeModule = {};

    welcomeModule.listeners = {
        "users::signin": function(user) {
            console.log("Hello, " + user.name + "!");
            exec('echo ".Hello, ' + user.name + '" | festival --tts');
        }
    };

    return welcomeModule;
}
