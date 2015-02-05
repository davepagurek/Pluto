module.exports = function(pluto) {
    var welcomeModule = {};

    welcomeModule.listeners = {
        "users::signin": function(user) {
            console.log("Hello, " + user.name + "!");
        }
    };

    return welcomeModule;
}
