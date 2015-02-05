module.exports = function() {
    var path = require('path');
    //var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var express = require("express");
    var app = express();

    var pluto = {};

    var sources = [];
    var modules = [];
    var listeners = {};



    pluto.router = express.Router();

    //Map requests to router
    pluto.get = function() {
        pluto.router.get.apply(pluto.router, arguments);
    };
    pluto.post = function() {
        pluto.router.post.apply(pluto.router, arguments);
    };



    var addListener = function(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    };

    var removeListener = function(event, callback) {
        if (listeners[event]) {

            //Remove listener from array
            listeners[event] = listeners[event].filter(function(element) {
                return (element != callback);
            });
        }
    };

    pluto.emitEvent = function(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(function(listener) {
                if (listener) listener(data);
            });
        }
    };

    pluto.getStorage = function(filename, callback) {
        var file = "./storage/"+filename+".json";
        fs.exists(file, function(exists) {
            if (exists) {
                fs.readFile(file, function(err, data) {
                    if (err) throw err;
                    if (data) {
                        data = JSON.parse(data);
                    }
                    if (callback) callback(err, data);
                });
            } else if (callback) callback("Does not exist");
        });
    };

    pluto.saveStorage = function(filename, data, callback) {
        if (!callback) callback = function() {}; //noop
        fs.writeFile("./storage/"+filename+".json", JSON.stringify(data), callback);
    };



    pluto.addSource = function(source) {
        sources.push(source);
    };

    pluto.removeSource = function(source) {
        sources = sources.map(function(element) {
            return (element != source);
        });
    };

    pluto.addModule = function(module) {
        modules.push(module);
        if (module.listeners) {
            for (var event in module.listeners) {
                addListener(event, module.listeners[event]);
            }
        }
    };

    pluto.removeModule = function(module) {
        if (module.listeners) {
            for (var event in module.listeners) {
                removeListener(event, module.listeners[event]);
            }
        }
        modules = modules.map(function(element) {
            return (element != module);
        });
    };



    //This function should be called AFTER adding sources so that other listeners
    //take precedence over the error listeners
    pluto.listen = function(port) {
        //pluto.router.use(favicon(__dirname + '/public/favicon.ico'));
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());
        app.use(express.static(path.join(__dirname, 'public')));

        // catch 404 and forward to error handler
        pluto.router.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        pluto.router.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.send("error: " + err.message);
        });

        app.use("/", pluto.router);
        app.listen(port);

    };


    return pluto;
};
