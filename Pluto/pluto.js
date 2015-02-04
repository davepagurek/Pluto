module.exports = function(app) {
    var path = require('path');
    var favicon = require('serve-favicon');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');
    var fs = require('fs');

    var pluto = {};

    var sources = [];
    var listeners = {};


    var addListener = function(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    };

    removeListener = function(event, callback) {
        if (listeners[event]) {

            //Remove listener from array
            listeners[event] = listeners[event].filter(function(element) {
                return (element != callback);
            });
        }
    };

    pluto.emitEvent = function(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(function(listener)) {
                if (listener) listener(data);
            }
        }
    };

    pluto.getStorage = function(filename, callback) {
        fs.readFile("storage/"+filename+".json", function(err, data) {
            if (data) {
                data = JSON.parse(data);
            }
            if (callback) callback(err, data);
        });
    };

    pluto.saveStorage = function(filename, data, callback) {
        fs.writeFile("storage/"+filename+".json", JSON.parse(data), callback);
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



    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    //app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });


    return pluto;
};
